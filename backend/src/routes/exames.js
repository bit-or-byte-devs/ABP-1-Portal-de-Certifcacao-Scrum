const express = require("express");
const pool = require("../config/db");
const { exigirSessao, exigirJson } = require("../middlewares/autenticacao");
const {
    DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS, INTERVALO_SINAL_SEGUNDOS, LIMITE_SEM_SINAL_SEGUNDOS,
    reconciliarQuestoesAbertas, interromperQuestoesEmAndamento,
} = require("../services/encerramentoQuestao");
const { recalcularCertificacao, buscarProximoTemaPendente } = require("../services/certificacao");
const router = express.Router();

// Toda rota reconcilia antes de ler ou alterar uma questão: a regra fica só no servidor.
async function reconciliar(db, idcertificacao) {
    const encerradas = await reconciliarQuestoesAbertas(db, idcertificacao);
    if (encerradas.length) await recalcularCertificacao(db, idcertificacao);
    return encerradas.length > 0;
}

// Trava a certificação dona da resposta; devolve null para resposta de outro candidato.
async function travarCertificacaoDaResposta(db, idresposta, idcandidato) {
    const { rows } = await db.query(`SELECT c.id FROM tbcertificacao c JOIN tbresposta r ON r.idcertificacao=c.id
        WHERE r.id=$1 AND c.idcandidato=$2 FOR UPDATE OF c`, [idresposta, idcandidato]);
    return rows[0]?.id ?? null;
}

const MENSAGENS_ENCERRADA = {
    tempo_esgotado: "Tempo esgotado. A questão conta como incorreta.",
    interrompida: "Questão encerrada por interrupção.",
};

async function buscarEstadoResposta(db, id) {
    const { rows } = await db.query(`SELECT r.id, r.situacao, r.acertou, r.idalternativa,
        r.idcertificacao, t.ordem, t.nome, q.id AS questao, q.enunciado,
        CASE WHEN r.situacao <> 'em_andamento' THEN q.justificativa END AS justificativa,
        i.arquivo_ou_url AS imagem, i.texto_alternativo AS imagem_alt,
        GREATEST(0, EXTRACT(EPOCH FROM (r.data_hora_exibicao
            + $2 * INTERVAL '1 second' - clock_timestamp())))::double precision AS segundos_restantes
        FROM tbresposta r JOIN tbtema t ON t.id=r.idtema
        JOIN tbquestao q ON q.id=r.idquestao LEFT JOIN tbimagem i ON i.id=q.idimagem
        WHERE r.id=$1`, [id, DURACAO_QUESTAO_SEGUNDOS]);
    const { idcertificacao, ordem, ...resposta } = rows[0];
    const alternativas = await db.query("SELECT id, letra, texto FROM tbalternativa WHERE idquestao=$1 ORDER BY letra", [resposta.questao]);
    resposta.alternativas = alternativas.rows;
    if (resposta.situacao === 'em_andamento') resposta.intervalo_sinal_segundos = INTERVALO_SINAL_SEGUNDOS;
    else {
        delete resposta.segundos_restantes;
        const correta = await db.query("SELECT id, letra, texto FROM tbalternativa WHERE idquestao=$1 AND correta", [resposta.questao]);
        resposta.alternativa_correta = correta.rows[0];
        resposta.proximo_tema = await buscarProximoTemaPendente(db, idcertificacao, ordem);
    }
    return resposta;
}
router.use(exigirSessao);
router.get("/progresso", async (req, res) => {
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const certificacao = await db.query("SELECT id FROM tbcertificacao WHERE idcandidato=$1 FOR UPDATE", [req.candidato.id]);
        const idcertificacao = certificacao.rows[0]?.id ?? null;
        if (idcertificacao !== null) await reconciliar(db, idcertificacao);
        const { rows: temas } = await db.query(`SELECT t.ordem, t.nome,
            CASE WHEN r.id IS NULL THEN 'pendente'
                WHEN r.situacao='em_andamento' THEN 'em_andamento'
                ELSE 'concluido' END AS estado
            FROM tbtema t LEFT JOIN tbresposta r ON r.idtema=t.id AND r.idcertificacao=$1
            ORDER BY t.ordem`, [idcertificacao]);
        let proximoTema = null;
        if (temas.some(tema => tema.estado === 'pendente')) {
            proximoTema = await buscarProximoTemaPendente(db, idcertificacao, 0);
            // O serviço também inclui questões abertas; continuar oferece só temas não sorteados.
            while (temas.find(tema => tema.ordem === proximoTema)?.estado === 'em_andamento') {
                proximoTema = await buscarProximoTemaPendente(db, idcertificacao, proximoTema);
            }
        }
        await db.query("COMMIT");
        res.json({ temas, proximo_tema: proximoTema,
            certificacao_concluida: temas.length === 12 && temas.every(tema => tema.estado === 'concluido') });
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível consultar o progresso da certificação." }); }
    finally { db?.release(); }
});
router.param("ordem", (req, res, next, valor) => {
    if (!/^(?:[1-9]|1[0-2])$/.test(valor)) return res.status(400).json({ mensagem: "Tema inválido." });
    req.ordem = Number(valor); next();
});
// Abrir tema já encerrado só mostra o resultado; tema novo ou reaberto interrompe a questão aberta.
router.post("/:ordem/iniciar", exigirJson, async (req, res) => {
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const cert = await db.query(`INSERT INTO tbcertificacao (idcandidato) VALUES ($1)
            ON CONFLICT (idcandidato) DO UPDATE SET idcandidato=EXCLUDED.idcandidato RETURNING id`, [req.candidato.id]);
        const id = cert.rows[0].id;
        await db.query("SELECT id FROM tbcertificacao WHERE id=$1 FOR UPDATE", [id]);
        await reconciliar(db, id);
        const tema = await db.query("SELECT id, nome FROM tbtema WHERE ordem=$1", [req.ordem]);
        if (!tema.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Tema não cadastrado." }); }
        const existente = await db.query("SELECT situacao FROM tbresposta WHERE idcertificacao=$1 AND idtema=$2", [id, tema.rows[0].id]);
        // Tema já encerrado não é uma questão válida para iniciar: a questão aberta continua.
        if (existente.rows[0]?.situacao === 'em_andamento' || !existente.rows.length) {
            if (await interromperQuestoesEmAndamento(db, id)) await recalcularCertificacao(db, id);
        }
        await db.query(`INSERT INTO tbresposta (idcertificacao, idtema, idquestao)
            SELECT $1, q.idtema, q.id FROM tbquestao q WHERE q.idtema=$2
            ORDER BY random() LIMIT 1 ON CONFLICT (idcertificacao, idtema) DO NOTHING`, [id, tema.rows[0].id]);
        const { rows } = await db.query("SELECT id FROM tbresposta WHERE idcertificacao=$1 AND idtema=$2", [id, tema.rows[0].id]);
        if (!rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Ainda não há questões cadastradas para este tema." }); }
        const resposta = await buscarEstadoResposta(db, rows[0].id);
        await db.query("COMMIT");
        res.json(resposta);
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível iniciar o exame." }); }
    finally { db?.release(); }
});
router.post("/respostas/:id", exigirJson, async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(req.body?.alternativa) || req.body.alternativa < 1)
        return res.status(400).json({ mensagem: "Resposta inválida." });
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        // Serializa respostas da mesma certificação antes de calcular o resultado final.
        const idcertificacao = await travarCertificacaoDaResposta(db, req.params.id, req.candidato.id);
        if (idcertificacao === null) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Resposta não encontrada." }); }
        await reconciliar(db, idcertificacao);
        let estado = await buscarEstadoResposta(db, req.params.id);
        if (estado.situacao !== 'em_andamento') {
            await db.query("COMMIT");
            return res.status(409).json({ ...estado, mensagem: MENSAGENS_ENCERRADA[estado.situacao] ?? "Questão já encerrada." });
        }
        const resposta = await db.query(`UPDATE tbresposta r SET idalternativa=a.id, acertou=a.correta,
            situacao='respondida', data_hora_resposta=clock_timestamp(), data_hora_encerramento=clock_timestamp()
            FROM tbalternativa a WHERE r.id=$1 AND a.id=$2 AND a.idquestao=r.idquestao
            AND r.situacao='em_andamento'
            AND clock_timestamp() <= r.data_hora_exibicao + ($3::integer + $4::integer) * INTERVAL '1 second'
            AND clock_timestamp() <= r.data_hora_ultimo_sinal + $5 * INTERVAL '1 second'
            RETURNING r.id`, [req.params.id, req.body.alternativa, DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS, LIMITE_SEM_SINAL_SEGUNDOS]);
        if (resposta.rows.length) await recalcularCertificacao(db, idcertificacao);
        else await reconciliar(db, idcertificacao);
        estado = await buscarEstadoResposta(db, req.params.id);
        await db.query("COMMIT");
        if (!resposta.rows.length) return res.status(409).json({ ...estado,
            mensagem: MENSAGENS_ENCERRADA[estado.situacao] ?? "Alternativa inválida." });
        res.json(estado);
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível salvar a resposta." }); }
    finally { db?.release(); }
});
router.get("/respostas/:id", async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(404).json({ mensagem: "Resposta não encontrada." });
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const idcertificacao = await travarCertificacaoDaResposta(db, req.params.id, req.candidato.id);
        if (idcertificacao === null) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Resposta não encontrada." }); }
        // Consultar não renova o sinal.
        await reconciliar(db, idcertificacao);
        const resposta = await buscarEstadoResposta(db, req.params.id);
        await db.query("COMMIT");
        res.json(resposta);
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível consultar a questão." }); }
    finally { db?.release(); }
});
// Sinal periódico da página aberta: mantém a questão em andamento.
router.post("/respostas/:id/sinal", exigirJson, async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(404).json({ mensagem: "Resposta não encontrada." });
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const idcertificacao = await travarCertificacaoDaResposta(db, req.params.id, req.candidato.id);
        if (idcertificacao === null) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Resposta não encontrada." }); }
        await reconciliar(db, idcertificacao);
        await db.query(`UPDATE tbresposta SET data_hora_ultimo_sinal=clock_timestamp()
            WHERE id=$1 AND situacao='em_andamento'`, [req.params.id]);
        const estado = await buscarEstadoResposta(db, req.params.id);
        await db.query("COMMIT");
        if (estado.situacao !== 'em_andamento')
            return res.status(409).json({ ...estado, mensagem: MENSAGENS_ENCERRADA[estado.situacao] ?? "Questão já encerrada." });
        res.json({ situacao: estado.situacao, segundos_restantes: estado.segundos_restantes,
            intervalo_sinal_segundos: estado.intervalo_sinal_segundos });
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível renovar a questão." }); }
    finally { db?.release(); }
});
// Aviso explícito de saída (sendBeacon, retorno da conexão). Idempotente.
router.post("/respostas/:id/interromper", exigirJson, async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(404).json({ mensagem: "Resposta não encontrada." });
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const idcertificacao = await travarCertificacaoDaResposta(db, req.params.id, req.candidato.id);
        if (idcertificacao === null) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Resposta não encontrada." }); }
        await reconciliar(db, idcertificacao);
        // Já encerrada: nada muda e o estado é devolvido do mesmo jeito.
        if (await interromperQuestoesEmAndamento(db, idcertificacao, Number(req.params.id)))
            await recalcularCertificacao(db, idcertificacao);
        const estado = await buscarEstadoResposta(db, req.params.id);
        await db.query("COMMIT");
        res.json(estado);
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível encerrar a questão." }); }
    finally { db?.release(); }
});
module.exports = router;
