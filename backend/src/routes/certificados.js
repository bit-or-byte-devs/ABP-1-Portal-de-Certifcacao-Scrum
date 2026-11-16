const express = require("express");
const pool = require("../config/db");
const QRCode = require("qrcode");
const { PERCENTUAL_MINIMO_CERTIFICADO } = require("../services/certificacao");

const router = express.Router();

function urlConsultaPublica(req, codigo) {
    const base = process.env.PUBLIC_BASE_URL;
    if (!base && process.env.NODE_ENV === "production") throw new Error("PUBLIC_BASE_URL não configurada.");
    const url = new URL("/pages/consultar-certificado.html", base || `${req.protocol}://${req.get("host")}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error("PUBLIC_BASE_URL inválida.");
    }
    url.searchParams.set("codigo", codigo);
    url.searchParams.set("via", "qrcode");
    return url.toString();
}

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

router.get("/:codigo/qr", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = req.params.codigo.toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
        return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
    }

    try {
        const { rows } = await pool.query(`SELECT 1 FROM tbcertificado
            WHERE codigo_validacao=$1 AND percentual_acertos_emitido >= $2`,
        [codigo, PERCENTUAL_MINIMO_CERTIFICADO]);
        if (!rows.length) return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });

        const imagem = await QRCode.toBuffer(urlConsultaPublica(req, codigo), {
            type: "png", errorCorrectionLevel: "H", width: 320, margin: 2,
        });
        return res.type("png").send(imagem);
    } catch {
        return res.status(503).json({ mensagem: "Não foi possível gerar o QR Code do certificado." });
    }
});

module.exports = router;