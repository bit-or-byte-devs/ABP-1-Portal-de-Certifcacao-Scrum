const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const codigo = require("../src/services/codigoRecuperacao");
const email = require("../src/services/emailRecuperacao");

test("HMAC e SMTP sem enviar e-mail real", async (t) => {
    const ambiente = { ...process.env };
    const criarOriginal = nodemailer.createTransport;
    const logOriginal = console.log;
    t.after(() => {
        for (const chave of Object.keys(process.env)) if (!(chave in ambiente)) delete process.env[chave];
        Object.assign(process.env, ambiente);
        nodemailer.createTransport = criarOriginal; console.log = logOriginal;
    });
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.RECUPERACAO_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.RECUPERACAO_SOLICITACOES_LIVRES = "true";
    process.env.NODE_ENV = "production";
    assert.equal(codigo.solicitacoesLivres(), false);
    process.env.NODE_ENV = "development";
    assert.equal(codigo.solicitacoesLivres(), true);
    const id = crypto.randomUUID();
    const protegido = codigo.protegerCodigo(1, id, "000007");
    assert.equal(codigo.conferirCodigo(1, id, "000007", protegido), true);
    assert.equal(codigo.conferirCodigo(2, id, "000007", protegido), false);
    assert.equal(codigo.conferirCodigo(1, id, "000008", protegido), false);
    assert.equal(codigo.conferirCodigo(1, id, "000007", "malformado"), false);
    process.env.RECUPERACAO_MODO = "console";
    process.env.NODE_ENV = "production";
    await assert.rejects(email.enviarCodigo("teste@example.test", "000007", id));
    process.env.NODE_ENV = "development";
    const logs = [];
    console.log = (...args) => logs.push(args);
    await email.enviarCodigo("teste@example.test", "000007", id);
    assert.equal(logs.length, 1);
    process.env.NODE_ENV = "production";
    process.env.RECUPERACAO_MODO = "smtp";
    delete process.env.SMTP_HOST;
    await assert.rejects(email.enviarCodigo("teste@example.test", "000007", id));
    Object.assign(process.env, {
        SMTP_HOST: "smtp.example.test", SMTP_PORT: "587", SMTP_SECURE: "false",
        SMTP_USER: "teste", SMTP_PASSWORD: "teste", SMTP_FROM: "Portal <portal@example.test>",
    });
    let falhar = false;
    let rejeitar = false;
    let mensagem;
    nodemailer.createTransport = opcoes => {
        assert.equal(opcoes.requireTLS, true);
        assert.equal(opcoes.debug, false);
        return { sendMail: async dados => {
            mensagem = dados;
            if (falhar) throw new Error("Falha simulada");
            return rejeitar ? { accepted: [], rejected: [dados.to] } : { accepted: [dados.to], rejected: [] };
        } };
    };
    await email.enviarCodigo("teste@example.test", "000007", id);
    assert.match(mensagem.text, /000007/); assert.match(mensagem.text, /10 minutos/);
    assert.match(mensagem.text, /ignore este e-mail/);
    falhar = true;
    await assert.rejects(email.enviarCodigo("teste@example.test", "000007", id));
    falhar = false; rejeitar = true;
    await assert.rejects(email.enviarCodigo("teste@example.test", "000007", id));
    assert.equal(logs.length, 1); // Nenhum código foi registrado em produção.
});
