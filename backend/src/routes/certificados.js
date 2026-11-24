const express = require("express");
const path = require("node:path");
const pool = require("../config/db");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { PERCENTUAL_MINIMO_CERTIFICADO } = require("../services/certificacao");
const { exigirSessao } = require("../middlewares/autenticacao");

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

function criarPdfCertificado(certificado, codigo, qr, { publico = false } = {}) {
    return new Promise((resolve, reject) => {
        const pdf = new PDFDocument({ size: [1020, 612], margin: 0 });
        const partes = [];
        pdf.on("data", parte => partes.push(parte));
        pdf.on("end", () => resolve(Buffer.concat(partes)));
        pdf.on("error", reject);

        const width = 816;
        const fundo = path.join(__dirname, "../../../imagens/questoes/Certificado2.png");
        pdf.image(fundo, 0, 0, { width, height: 612 });
        pdf.rect(816, 0, 204, 612).fill("#f3faf9");
        pdf.moveTo(816, 0).lineTo(816, 612).lineWidth(2).strokeColor("#14958e").stroke();
        const escrever = (texto, x, y, w, h, tamanho = 10, alinhamento = "center", negrito = false) => {
            pdf.fillColor("#173f43").font(negrito ? "Helvetica-Bold" : "Helvetica").fontSize(tamanho)
                .text(String(texto), x, y, {
                    width: w, height: h, align: alinhamento, ellipsis: true,
                    lineBreak: false,
                });
        };
        const emissao = new Date(certificado.data_hora_emissao);
        const dataEmissao = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(emissao);
        const nome = certificado.nome_completo_emitido;
        const opcoesNome = { width: 490, align: "center" };
        let tamanhoNome = 17;
        pdf.fillColor("#173f43").font("Helvetica-Bold").fontSize(tamanhoNome);
        while (tamanhoNome > 7 && pdf.heightOfString(nome, opcoesNome) > 32) {
            pdf.fontSize(--tamanhoNome);
        }
        const alturaNome = pdf.heightOfString(nome, opcoesNome);
        pdf.text(nome, 153, 222 + (36 - alturaNome) / 2, opcoesNome);
        if (publico) {
            escrever("Via pública", 145, 265, 210, 18, 9);
            escrever(`Emitido em ${dataEmissao}`, 429, 265, 220, 18, 9);
        } else {
            const cpf = String(certificado.cpf_emitido || "").replace(/\D/g, "");
            escrever(cpf.length === 11 ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : "CPF não informado", 145, 265, 210, 18, 9);
            escrever(certificado.email_emitido, 429, 265, 220, 18, 9);
        }
        escrever(dataEmissao, 220, 363, 185, 21, 10);
        escrever("Não informada", 430, 363, 190, 21, 10);
        escrever(new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(emissao), 210, 401, 105, 16, 8);
        escrever(Number(certificado.nota_final_emitida).toFixed(2), 342, 401, 105, 16, 8);
        escrever(`${Number(certificado.percentual_acertos_emitido).toFixed(2)}%`, 476, 401, 102, 16, 8);
        escrever("VALIDAÇÃO DO CERTIFICADO", 830, 378, 176, 28, 10, "center", true);
        pdf.image(qr, 862, 416, { width: 112, height: 112 });
        escrever("Escaneie para validar", 830, 536, 176, 18, 9);
        escrever(`Código ${codigo.slice(0, 12)}`, 830, 558, 176, 16, 7);
        pdf.end();
    });
}

async function buscarCertificadoPublico(codigo) {
    const { rows } = await pool.query(`SELECT nome_completo_emitido, nota_final_emitida,
        percentual_acertos_emitido, data_hora_emissao
        FROM tbcertificado WHERE codigo_validacao=$1 AND percentual_acertos_emitido >= $2`,
    [codigo, PERCENTUAL_MINIMO_CERTIFICADO]);
    return rows[0];
}

router.post("/validar", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = typeof req.body?.codigo === "string" ? req.body.codigo.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
        return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
    }

    try {
        const certificado = await buscarCertificadoPublico(codigo);
        if (!certificado) return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
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

router.get("/:codigo/pdf-publico", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = req.params.codigo.toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
        return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
    }

    try {
        const certificado = await buscarCertificadoPublico(codigo);
        if (!certificado) return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });

        const qr = await QRCode.toBuffer(urlConsultaPublica(req, codigo), {
            type: "png", errorCorrectionLevel: "H", width: 320, margin: 2,
        });
        const arquivo = await criarPdfCertificado(certificado, codigo, qr, { publico: true });
        return res.type("pdf").attachment(`certificado-publico-${codigo}.pdf`).send(arquivo);
    } catch {
        return res.status(503).json({ mensagem: "Não foi possível gerar o PDF do certificado." });
    }
});

router.get("/:codigo/pdf", exigirSessao, async (req, res) => {
    res.set("Cache-Control", "no-store");
    const codigo = req.params.codigo.toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
        return res.status(404).json({ mensagem: "Certificado inválido ou não encontrado." });
    }

    try {
        const { rows } = await pool.query(`SELECT cert.nome_completo_emitido, cert.cpf_emitido,
            cert.email_emitido, cert.nota_final_emitida, cert.percentual_acertos_emitido,
            cert.data_hora_emissao FROM tbcertificado cert
            JOIN tbcertificacao c ON c.id=cert.idcertificacao
            WHERE cert.codigo_validacao=$1 AND cert.percentual_acertos_emitido >= $2 AND c.idcandidato=$3`,
        [codigo, PERCENTUAL_MINIMO_CERTIFICADO, req.candidato.id]);
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
