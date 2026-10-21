const nodemailer = require("nodemailer");
let transporte;
function configuracao() {
    const modoConsole = process.env.RECUPERACAO_MODO === "console";
    if (modoConsole && process.env.NODE_ENV !== "development") {
        throw new Error("O modo console é permitido somente em development.");
    }
    // Console é uma escolha explícita; nunca é fallback de um erro SMTP.
    if (modoConsole) return { modoConsole: true };
    if (process.env.RECUPERACAO_MODO !== "smtp") throw new Error("Configure RECUPERACAO_MODO como smtp ou console.");
    const porta = Number(process.env.SMTP_PORT);
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD ||
        !process.env.SMTP_FROM || !Number.isInteger(porta) || porta < 1 || porta > 65535 ||
        !["true", "false"].includes(process.env.SMTP_SECURE)) throw new Error("Configuração SMTP incompleta.");
    return { modoConsole: false, porta };
}
async function enviarCodigo(email, codigo, solicitacaoId) {
    const opcoes = configuracao();
    if (opcoes.modoConsole) {
        console.log("[RECUPERAÇÃO LOCAL] Solicitação: %s | Código: %s | Validade: 10 minutos", solicitacaoId, codigo);
        return;
    }
    if (!transporte) {
        transporte = nodemailer.createTransport({
            host: process.env.SMTP_HOST, port: opcoes.porta,
            secure: process.env.SMTP_SECURE === "true", requireTLS: process.env.SMTP_SECURE !== "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
            connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
            logger: false, debug: false,
        });
    }
    const resultado = await transporte.sendMail({
        from: process.env.SMTP_FROM, to: email,
        subject: "Código de recuperação — Portal de Certificação Scrum",
        text: "Seu código de recuperação é: " + codigo +
            "\nEle é válido por 10 minutos e pode ser usado apenas uma vez." +
            "\nSe você não solicitou a recuperação, ignore este e-mail.",
    });
    if (!resultado.accepted || resultado.accepted.length === 0 || resultado.rejected?.length) {
        throw new Error("O SMTP não aceitou o destinatário.");
    }
}
module.exports = { configuracao, enviarCodigo };
