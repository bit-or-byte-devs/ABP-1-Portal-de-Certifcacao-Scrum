const express = require("express");
const pool = require("../config/db");
const PDFDocument = require("pdfkit");
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

function criarPdfCertificado(certificado, codigo, qr) {
    return new Promise((resolve, reject) => {
        const pdf = new PDFDocument({ size: "A4", layout: "landscape", margin: 48 });
        const partes = [];
        pdf.on("data", parte => partes.push(parte));
        pdf.on("end", () => resolve(Buffer.concat(partes)));
        pdf.on("error", reject);

        const { width, height } = pdf.page;
        pdf.rect(24, 24, width - 48, height - 48).lineWidth(3).strokeColor("#123b6d").stroke();
        pdf.fillColor("#0d2448").font("Helvetica-Bold").fontSize(13)
            .text("PORTAL BORB - CERTIFICACAO SCRUM", 60, 62, { width: width - 120, align: "center" });
        pdf.fontSize(30).text("CERTIFICADO", 60, 112, { width: width - 120, align: "center" });
        pdf.font("Helvetica").fontSize(14).text("Este certificado confirma que", 80, 180, {
            width: width - 160, align: "center",
        });
        pdf.font("Helvetica-Bold").fontSize(24).text(certificado.nome_completo_emitido, 80, 216, {
            width: width - 160, align: "center",
        });
        pdf.font("Helvetica").fontSize(13).text("concluiu a certificacao Scrum do Portal BorB.", 80, 270, {
            width: width - 160, align: "center",
        });
        pdf.fontSize(12).text(`Nota final: ${Number(certificado.nota_final_emitida).toFixed(2)} / 100`, 100, 326, {
            width: width - 200, align: "center",
        });
        pdf.text(`Percentual de acertos: ${Number(certificado.percentual_acertos_emitido).toFixed(2)}%`, 100, 350, {
            width: width - 200, align: "center",
        });
        const emissao = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" })
            .format(new Date(certificado.data_hora_emissao));
        pdf.text(`Emitido em ${emissao}`, 100, 374, { width: width - 200, align: "center" });
        pdf.fontSize(8).text(`Codigo de validacao: ${codigo}`, 56, height - 48, { width: width - 250 });
        pdf.image(qr, width - 164, height - 164, { width: 112, height: 112 });
        pdf.fontSize(8).text("Escaneie para validar", width - 186, height - 46, { width: 156, align: "center" });
        pdf.end();
    });
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

router.get("/:codigo/pdf", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = req.params.codigo.toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
        return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
    }

    try {
        const { rows } = await pool.query(`SELECT nome_completo_emitido, nota_final_emitida,
            percentual_acertos_emitido, data_hora_emissao FROM tbcertificado
            WHERE codigo_validacao=$1 AND percentual_acertos_emitido >= $2`,
        [codigo, PERCENTUAL_MINIMO_CERTIFICADO]);
        if (!rows.length) return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });

        const qr = await QRCode.toBuffer(urlConsultaPublica(req, codigo), {
            type: "png", errorCorrectionLevel: "H", width: 320, margin: 2,
        });
        const arquivo = await criarPdfCertificado(rows[0], codigo, qr);
        return res.type("pdf").attachment(`certificado-${codigo}.pdf`).send(arquivo);
    } catch {
        return res.status(503).json({ mensagem: "Não foi possível gerar o PDF do certificado." });
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