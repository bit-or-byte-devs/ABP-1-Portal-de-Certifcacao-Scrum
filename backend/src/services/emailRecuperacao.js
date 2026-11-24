const nodemailer = require("nodemailer");
const { VALIDADE_MINUTOS } = require("./codigoRecuperacao");

// Todas obrigatórias no modo SMTP. Mensagens de erro citam só estes nomes, nunca os valores.
const VARIAVEIS_SMTP = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
const ASSUNTO = "Código de recuperação de senha - Portal de Certificação Scrum";
let transporte;

function erroConfiguracao(mensagem, detalhes = {}) {
    return Object.assign(new Error(mensagem), { code: "CONFIG_RECUPERACAO" }, detalhes);
}

// Escolhe o transporte. Console é escolha explícita e só em development; nunca é fallback de erro SMTP.
function configuracao() {
    const modo = (process.env.RECUPERACAO_MODO || "").trim();
    if (modo === "console") {
        if (process.env.NODE_ENV !== "development") {
            throw erroConfiguracao("RECUPERACAO_MODO=console só é permitido com NODE_ENV=development.");
        }
        return { modo: "console" };
    }
    if (modo && modo !== "smtp") throw erroConfiguracao("RECUPERACAO_MODO deve ser smtp ou console.");
    const faltando = VARIAVEIS_SMTP.filter(nome => !(process.env[nome] || "").trim());
    if (faltando.length) {
        throw erroConfiguracao("Configuração SMTP incompleta. Variáveis ausentes: " + faltando.join(", ") + ".", { faltando });
    }
    const porta = Number(process.env.SMTP_PORT);
    const invalidas = [];
    if (!Number.isInteger(porta) || porta < 1 || porta > 65535) invalidas.push("SMTP_PORT");
    if (!["true", "false"].includes(process.env.SMTP_SECURE.trim())) invalidas.push("SMTP_SECURE");
    if (invalidas.length) {
        throw erroConfiguracao("Configuração SMTP inválida nas variáveis: " + invalidas.join(", ") + ".", { invalidas });
    }
    return {
        modo: "smtp", host: process.env.SMTP_HOST.trim(), porta,
        seguro: process.env.SMTP_SECURE.trim() === "true", remetente: process.env.SMTP_FROM.trim(),
    };
}

function obterTransporte(opcoes) {
    if (!transporte) {
        transporte = nodemailer.createTransport({
            host: opcoes.host, port: opcoes.porta,
            // 465: TLS direto (secure). Outras portas: STARTTLS obrigatório.
            secure: opcoes.seguro, requireTLS: !opcoes.seguro,
            auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS },
            connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
            logger: false, debug: false,
        });
    }
    return transporte;
}

// Só para testes: força a criação de um novo transporte na próxima chamada.
function descartarTransporte() {
    transporte = undefined;
}

// Código seguro para log: identificador do erro (EAUTH, ETIMEDOUT...) e resposta SMTP numérica.
// Nunca a mensagem, que pode trazer endereço ou resposta completa do servidor.
function codigoErro(erro) {
    const codigo = erro && typeof erro.code === "string" && /^[A-Z0-9_]{1,40}$/.test(erro.code) ? erro.code : "DESCONHECIDO";
    return erro && Number.isInteger(erro.responseCode) ? codigo + "/" + erro.responseCode : codigo;
}

function montarMensagem(remetente, destinatario, codigo) {
    const validade = "Ele é válido por " + VALIDADE_MINUTOS + " minutos e pode ser usado apenas uma vez.";
    const ignorar = "Se você não pediu a recuperação de senha, ignore este e-mail. Sua senha continua a mesma.";
    return {
        from: remetente, to: destinatario, subject: ASSUNTO,
        text: "Recebemos um pedido de recuperação de senha no Portal de Certificação Scrum.\n\n" +
            "Seu código de recuperação é: " + codigo + "\n\n" + validade + "\n\n" + ignorar,
        html: '<div style="font-family:Arial,sans-serif;color:#222;max-width:480px">' +
            "<p>Recebemos um pedido de recuperação de senha no Portal de Certificação Scrum.</p>" +
            "<p>Seu código de recuperação é:</p>" +
            '<p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">' + codigo + "</p>" +
            "<p>" + validade + "</p>" +
            '<p style="color:#555">' + ignorar + "</p></div>",
    };
}

async function enviarCodigo(email, codigo, solicitacaoId) {
    const opcoes = configuracao();
    if (opcoes.modo === "console") {
        console.log("[RECUPERAÇÃO LOCAL] Solicitação: %s | Código: %s | Validade: %d minutos", solicitacaoId, codigo, VALIDADE_MINUTOS);
        return;
    }
    const resultado = await obterTransporte(opcoes).sendMail(montarMensagem(opcoes.remetente, email, codigo));
    if (!resultado.accepted || resultado.accepted.length === 0 || resultado.rejected?.length) {
        throw Object.assign(new Error("O SMTP não aceitou o destinatário."), { code: "DESTINATARIO_RECUSADO" });
    }
}

// Chamada uma vez ao subir. Nunca lança: sem SMTP, o portal continua no ar e só a recuperação deixa de enviar.
async function prepararEnvio() {
    let opcoes;
    try {
        opcoes = configuracao();
    } catch (erro) {
        console.error("[RECUPERAÇÃO] %s Os códigos de recuperação de senha não serão enviados até a configuração ser corrigida; o restante do portal funciona normalmente.", erro.message);
        return { pronto: false, codigo: codigoErro(erro), faltando: erro.faltando || [] };
    }
    if (opcoes.modo === "console") {
        console.warn("[RECUPERAÇÃO] Modo console ativo (somente development): os códigos aparecem neste log e nenhum e-mail é enviado.");
        return { pronto: true, modo: "console" };
    }
    try {
        await obterTransporte(opcoes).verify();
        console.log("[RECUPERAÇÃO] SMTP pronto.");
        return { pronto: true, modo: "smtp" };
    } catch (erro) {
        console.error("[RECUPERAÇÃO] Falha ao verificar o SMTP (código %s). Os códigos de recuperação não serão entregues até a falha ser corrigida.", codigoErro(erro));
        return { pronto: false, modo: "smtp", codigo: codigoErro(erro) };
    }
}

module.exports = { VARIAVEIS_SMTP, ASSUNTO, configuracao, enviarCodigo, prepararEnvio, montarMensagem, codigoErro, descartarTransporte };
