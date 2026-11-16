const express = require("express");
const pool = require("../config/db");
const { PERCENTUAL_MINIMO_CERTIFICADO } = require("../services/certificacao");

const router = express.Router();

router.post("/validar", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = typeof req.body?.codigo === "string" ? req.body.codigo.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
        return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
    }

    try {
        const { rows } = await pool.query(`SELECT nome_completo_emitido, nota_final_emitida,
            percentual_acertos_emitido, data_hora_emissao
            FROM tbcertificado WHERE codigo_validacao=$1 AND percentual_acertos_emitido >= $2`,
        [codigo, PERCENTUAL_MINIMO_CERTIFICADO]);
        if (!rows.length) return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });

        const certificado = rows[0];
        return res.json({ valido: true, certificado: {
            nome: certificado.nome_completo_emitido,
            nota_final: Number(certificado.nota_final_emitida),
            percentual_acertos: Number(certificado.percentual_acertos_emitido),
            data_hora_emissao: certificado.data_hora_emissao,
        } });
    } catch {
        return res.status(503).json({ mensagem: "Não foi possível consultar o certificado." });
    }
});

module.exports = router;