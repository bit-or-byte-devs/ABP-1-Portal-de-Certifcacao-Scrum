const express = require("express");
const pool = require("../config/db");
const { exigirSessao, exigirJson } = require("../middlewares/autenticacao");
const router = express.Router();
router.use(exigirSessao);
router.param("ordem", (req, res, next, valor) => {
    if (!/^(?:[1-9]|1[0-2])$/.test(valor)) return res.status(400).json({ mensagem: "Tema inválido." });
    req.ordem = Number(valor); next();
});
// Inicia ou retoma a mesma questão por tema na certificação do candidato.
router.post("/:ordem/iniciar", exigirJson, async (req, res) => {
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const cert = await db.query(`INSERT INTO tbcertificacao (idcandidato) VALUES ($1)
            ON CONFLICT (idcandidato) DO UPDATE SET idcandidato=EXCLUDED.idcandidato RETURNING id`, [req.candidato.id]);
        const id = cert.rows[0].id;
        const tema = await db.query("SELECT id, nome FROM tbtema WHERE ordem=$1", [req.ordem]);
        if (!tema.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Tema não cadastrado." }); }
        await db.query(`INSERT INTO tbresposta (idcertificacao, idtema, idquestao)
            SELECT $1, q.idtema, q.id FROM tbquestao q WHERE q.idtema=$2
            AND (SELECT count(*) FROM tbalternativa a WHERE a.idquestao=q.id)=4
            AND EXISTS (SELECT 1 FROM tbalternativa a WHERE a.idquestao=q.id AND a.correta)
            ORDER BY random() LIMIT 1 ON CONFLICT (idcertificacao, idtema) DO NOTHING`, [id, tema.rows[0].id]);
        const { rows } = await db.query(`SELECT r.id, r.situacao, r.acertou, r.idalternativa,
            q.id AS questao, q.enunciado, CASE WHEN r.situacao <> 'em_andamento' THEN q.justificativa END AS justificativa,
            i.arquivo_ou_url AS imagem, i.texto_alternativo AS imagem_alt
            FROM tbresposta r JOIN tbquestao q ON q.id=r.idquestao JOIN tbimagem i ON i.id=q.idimagem
            WHERE r.idcertificacao=$1 AND r.idtema=$2`, [id, tema.rows[0].id]);
        if (!rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ mensagem: "Ainda não há questões cadastradas para este tema." }); }
        const alternativas = await db.query("SELECT id, letra, texto FROM tbalternativa WHERE idquestao=$1 ORDER BY letra", [rows[0].questao]);
        await db.query("COMMIT");
        res.json({ ...rows[0], nome: tema.rows[0].nome, alternativas: alternativas.rows });
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
        const resposta = await db.query(`UPDATE tbresposta r SET idalternativa=a.id, acertou=a.correta,
            situacao='respondida', data_hora_resposta=CURRENT_TIMESTAMP, data_hora_encerramento=CURRENT_TIMESTAMP
            FROM tbalternativa a WHERE r.id=$1 AND a.id=$2 AND a.idquestao=r.idquestao
            AND r.situacao='em_andamento' RETURNING r.acertou, r.idquestao`, [req.params.id, req.body.alternativa]);
        if (!resposta.rows.length) { await db.query("ROLLBACK"); return res.status(409).json({ mensagem: "Alternativa inválida ou questão já respondida." }); }
        await db.query(`UPDATE tbcertificacao SET total_acertos=s.acertos,
            percentual_acertos=round(s.acertos * 100.0 / 12, 2), nota_final=round(s.acertos * 100.0 / 12, 2),
            status=CASE WHEN s.respondidas=12 THEN 'concluida' ELSE 'em_andamento' END,
            data_conclusao=CASE WHEN s.respondidas=12 THEN CURRENT_TIMESTAMP ELSE NULL END
            FROM (SELECT count(*) FILTER (WHERE acertou)::integer AS acertos,
                count(*) FILTER (WHERE situacao <> 'em_andamento') AS respondidas
                FROM tbresposta WHERE idcertificacao=$1) s WHERE id=$1`, [cert.rows[0].id]);
        const q = await db.query("SELECT justificativa FROM tbquestao WHERE id=$1", [resposta.rows[0].idquestao]);
        await db.query("COMMIT");
        res.json({ acertou: resposta.rows[0].acertou, justificativa: q.rows[0].justificativa });
    } catch { if (db) await db.query("ROLLBACK").catch(() => {}); res.status(503).json({ mensagem: "Não foi possível salvar a resposta." }); }
    finally { db?.release(); }
});
module.exports = router;
