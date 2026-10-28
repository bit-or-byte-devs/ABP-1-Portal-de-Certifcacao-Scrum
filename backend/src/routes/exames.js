const express = require("express");
const pool = require("../config/db");
const { exigirSessao, exigirJson } = require("../middlewares/autenticacao");
const {
    DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS,
    encerrarQuestoesVencidasDaCertificacao, interromperQuestoesEmAndamento,
} = require("../services/encerramentoQuestao");
const { recalcularCertificacao, buscarProximoTemaPendente } = require("../services/certificacao");
const router = express.Router();

async function atualizarQuestoesVencidas(db, idcertificacao) {
    const encerradas = await encerrarQuestoesVencidasDaCertificacao(db, idcertificacao);
    if (encerradas.length) await recalcularCertificacao(db, idcertificacao);
}

async function buscarEstadoResposta(db, id) {
    const { rows } = await db.query(`SELECT r.id, r.situacao, r.acertou, r.idalternativa,
        r.idcertificacao, t.ordem, t.nome, q.id AS questao, q.enunciado,
        CASE WHEN r.situacao <> 'em_andamento' THEN q.justificativa END AS justificativa,
        i.arquivo_ou_url AS imagem, i.texto_alternativo AS imagem_alt,
        GREATEST(0, EXTRACT(EPOCH FROM (r.data_hora_exibicao
            + $2 * INTERVAL '1 second' - clock_timestamp())))::double precision AS segundos_restantes
        FROM tbresposta r JOIN tbtema t ON t.id=r.idtema
        JOIN tbquestao q ON q.id=r.idquestao JOIN tbimagem i ON i.id=q.idimagem
        WHERE r.id=$1`, [id, DURACAO_QUESTAO_SEGUNDOS]);
    const { idcertificacao, ordem, ...resposta } = rows[0];
    const alternativas = await db.query("SELECT id, letra, texto FROM tbalternativa WHERE idquestao=$1 ORDER BY letra", [resposta.questao]);
    resposta.alternativas = alternativas.rows;
    if (resposta.situacao !== 'em_andamento') {
        delete resposta.segundos_restantes;
        const correta = await db.query("SELECT id, letra, texto FROM tbalternativa WHERE idquestao=$1 AND correta", [resposta.questao]);
        resposta.alternativa_correta = correta.rows[0];
        resposta.proximo_tema = await buscarProximoTemaPendente(db, idcertificacao, ordem);
    }
    return resposta;
}
router.use(exigirSessao);
router.param("ordem", (req, res, next, valor) => {
    if (!/^(?:[1-9]|1[0-2])$/.test(valor)) return res.status(400).json({ mensagem: "Tema inválido." });
    req.ordem = Number(valor); next();
});
// Encerra questões pendentes antes de iniciar um tema ainda não sorteado.
router.post("/:ordem/iniciar", exigirJson, async (req, res) => {
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const cert = await db.query(`INSERT INTO tbcertificacao (idcandidato) VALUES ($1)
            ON CONFLICT (idcandidato) DO UPDATE SET idcandidato=EXCLUDED.idcandidato RETURNING id`, [req.candidato.id]);
        const id = cert.rows[0].id;
        await db.query("SELECT id FROM tbcertificacao WHERE id=$1 FOR UPDATE", [id]);
        const vencidas = await encerrarQuestoesVencidasDaCertificacao(db, id);
        const interrompidas = await interromperQuestoesEmAndamento(db, id);
        if (vencidas.length || interrompidas) await recalcularCertificacao(db, id);
        const tema = await db.query("SELECT id, nome FROM tbtema WHERE ordem=$1", [req.ordem]);
        if (!tema.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Tema não cadastrado." }); }
        await db.query(`INSERT INTO tbresposta (idcertificacao, idtema, idquestao)
            SELECT $1, q.idtema, q.id FROM tbquestao q WHERE q.idtema=$2
            AND (SELECT count(*) FROM tbalternativa a WHERE a.idquestao=q.id)=4
            AND EXISTS (SELECT 1 FROM tbalternativa a WHERE a.idquestao=q.id AND a.correta)
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
        const cert = await db.query(`SELECT c.id FROM tbcertificacao c JOIN tbresposta r ON r.idcertificacao=c.id
            WHERE r.id=$1 AND c.idcandidato=$2 FOR UPDATE OF c`, [req.params.id, req.candidato.id]);
        if (!cert.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Resposta não encontrada." }); }
        const idcertificacao = cert.rows[0].id;
        await atualizarQuestoesVencidas(db, idcertificacao);
        let estado = await buscarEstadoResposta(db, req.params.id);
        if (estado.situacao !== 'em_andamento') {
            await db.query("COMMIT");
            return res.status(409).json({ ...estado, mensagem: estado.situacao === 'tempo_esgotado'
                ? "Tempo esgotado. A questão conta como incorreta." : "Questão já encerrada." });
        }
        const resposta = await db.query(`UPDATE tbresposta r SET idalternativa=a.id, acertou=a.correta,
            situacao='respondida', data_hora_resposta=clock_timestamp(), data_hora_encerramento=clock_timestamp()
            FROM tbalternativa a WHERE r.id=$1 AND a.id=$2 AND a.idquestao=r.idquestao
            AND r.situacao='em_andamento'
            AND clock_timestamp() <= r.data_hora_exibicao + ($3::integer + $4::integer) * INTERVAL '1 second'
            RETURNING r.id`, [req.params.id, req.body.alternativa, DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS]);
        if (resposta.rows.length) await recalcularCertificacao(db, idcertificacao);
        else await atualizarQuestoesVencidas(db, idcertificacao);
        estado = await buscarEstadoResposta(db, req.params.id);
        await db.query("COMMIT");
        if (!resposta.rows.length) return res.status(409).json({ ...estado,
            mensagem: estado.situacao === 'tempo_esgotado'
                ? "Tempo esgotado. A questão conta como incorreta." : "Alternativa inválida." });
        res.json(estado);
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível salvar a resposta." }); }
    finally { db?.release(); }
});
router.get("/respostas/:id", async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(404).json({ mensagem: "Resposta não encontrada." });
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const cert = await db.query(`SELECT c.id FROM tbcertificacao c JOIN tbresposta r ON r.idcertificacao=c.id
            WHERE r.id=$1 AND c.idcandidato=$2 FOR UPDATE OF c`, [req.params.id, req.candidato.id]);
        if (!cert.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Resposta não encontrada." }); }
        await atualizarQuestoesVencidas(db, cert.rows[0].id);
        const resposta = await buscarEstadoResposta(db, req.params.id);
        await db.query("COMMIT");
        res.json(resposta);
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível consultar a questão." }); }
    finally { db?.release(); }
});
module.exports = router;
