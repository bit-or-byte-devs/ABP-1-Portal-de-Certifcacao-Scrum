const express = require("express");
const pool = require("../config/db");
const conteudos = require("../services/conteudoTemas");
const { exigirSessao, exigirJson } = require("../middlewares/autenticacao");
const router = express.Router();
router.use(exigirSessao);
const total = ordem => (conteudos[ordem]?.match(/<h[34]\b/g) || []).length;
router.get("/", async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT t.id, t.nome, t.descricao, t.ordem,
            COALESCE(p.subtitulos, '{}') AS vistos FROM tbtema t
            LEFT JOIN tbprogresso_estudo p ON p.idtema=t.id AND p.idcandidato=$1 ORDER BY t.ordem`, [req.candidato.id]);
        res.json(rows.map(t => ({ ...t, total: total(t.ordem), percentual: total(t.ordem)
            ? Math.round(t.vistos.filter(i => i >= 0 && i < total(t.ordem)).length / total(t.ordem) * 100) : 0 })));
    } catch { res.status(503).json({ mensagem: "Não foi possível carregar os temas." }); }
});
router.param("ordem", (req, res, next, valor) => {
    if (!/^(?:[1-9]|1[0-2])$/.test(valor)) return res.status(400).json({ mensagem: "Tema inválido." });
    req.ordem = Number(valor); next();
});
router.get("/:ordem", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, nome, descricao, ordem FROM tbtema WHERE ordem=$1", [req.ordem]);
        if (!rows.length) return res.status(404).json({ mensagem: "Tema não cadastrado." });
        res.json({ ...rows[0], conteudo: conteudos[req.ordem] || "", total: total(req.ordem) });
    } catch { res.status(503).json({ mensagem: "Não foi possível carregar o material." }); }
});
router.put("/:ordem/progresso", exigirJson, async (req, res) => {
    const vistos = req.body?.vistos;
    if (!Array.isArray(vistos) || vistos.length > total(req.ordem) ||
        vistos.some(i => !Number.isInteger(i) || i < 0 || i >= total(req.ordem)))
        return res.status(400).json({ mensagem: "Progresso inválido." });
    try {
        const { rows } = await pool.query(`INSERT INTO tbprogresso_estudo (idcandidato, idtema, subtitulos)
            SELECT $1, id, $3::integer[] FROM tbtema WHERE ordem=$2
            ON CONFLICT (idcandidato, idtema) DO UPDATE SET subtitulos = ARRAY(
                SELECT DISTINCT unnest(tbprogresso_estudo.subtitulos || EXCLUDED.subtitulos) ORDER BY 1
            ), atualizado_em=CURRENT_TIMESTAMP RETURNING subtitulos`, [req.candidato.id, req.ordem, [...new Set(vistos)]]);
        if (!rows.length) return res.status(404).json({ mensagem: "Tema não cadastrado." });
        res.json({ vistos: rows[0].subtitulos });
    } catch { res.status(503).json({ mensagem: "Não foi possível salvar o progresso. Tente novamente." }); }
});
module.exports = router;
