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
    // A validade vem da constante única do back-end.
    assert.equal(codigo.VALIDADE_MINUTOS, 10);
    assert.match(mensagem.text, /000007/); assert.match(mensagem.text, /10 minutos/);
    assert.match(mensagem.text, /ignore este e-mail/);
    falhar = true;
    await assert.rejects(email.enviarCodigo("teste@example.test", "000007", id));
    falhar = false; rejeitar = true;
    await assert.rejects(email.enviarCodigo("teste@example.test", "000007", id));
    assert.equal(logs.length, 1); // Nenhum código foi registrado em produção.
});

// Entradas recusadas antes de qualquer consulta: o banco não pode ser acessado.
test("contrato público das rotas de recuperação sem acessar o banco", async (t) => {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.RECUPERACAO_SECRET = crypto.randomBytes(32).toString("hex");
    const pool = require("../src/config/db");
    const queryOriginal = pool.query;
    const connectOriginal = pool.connect;
    pool.query = pool.connect = async () => { throw new Error("O banco não deveria ser acessado."); };
    const app = require("../src/app");
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    t.after(async () => {
        pool.query = queryOriginal; pool.connect = connectOriginal;
        await new Promise(resolve => servidor.close(resolve));
        await pool.end();
    });
    const base = "http://127.0.0.1:" + servidor.address().port + "/api/auth/recuperacao";
    async function post(rota, dados) {
        const resposta = await fetch(base + rota, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
        });
        return { status: resposta.status, corpo: await resposta.json(), cache: resposta.headers.get("cache-control") };
    }
    // A solicitação pede só o e-mail: CPF sozinho ou e-mail inválido são recusados.
    for (const corpo of [{ cpf: "52998224725" }, { email: "sem-arroba" }, { email: "a@b.c".padStart(260, "a") }, {}]) {
        const resposta = await post("/solicitar", corpo);
        assert.equal(resposta.status, 400, JSON.stringify(corpo));
        assert.deepEqual(resposta.corpo, { mensagem: "Informe um e-mail válido." });
        assert.equal(resposta.cache, "no-store");
    }
    // /verificar e /redefinir recusam e-mail ou código malformados com a mesma resposta.
    const malformado = { mensagem: "Informe o e-mail e o código de seis dígitos recebido." };
    const entradas = [
        { email: "maria@example.test", codigo: "12345" }, { email: "maria@example.test", codigo: "1234567" },
        { email: "maria@example.test", codigo: 123456 }, { email: "maria@example.test", codigo: "12a456" },
        { email: "x", codigo: "123456" }, { solicitacaoId: crypto.randomUUID(), codigo: "123456" }, {},
    ];
    for (const entrada of entradas) {
        const verificar = await post("/verificar", entrada);
        const redefinir = await post("/redefinir", { ...entrada, senha: "Nova12345", confirmarSenha: "Nova12345" });
        assert.equal(verificar.status, 400, JSON.stringify(entrada));
        assert.deepEqual(verificar.corpo, malformado);
        assert.deepEqual(redefinir, verificar);
    }
    // Regras de senha do /redefinir também são conferidas antes do banco.
    const valido = { email: "maria@example.test", codigo: "123456" };
    for (const senha of ["curta1", "semnumeros", "12345678", "a1".repeat(513)]) {
        const resposta = await post("/redefinir", { ...valido, senha, confirmarSenha: senha });
        assert.equal(resposta.status, 400);
        assert.match(resposta.corpo.mensagem, /8 a 1024 caracteres/);
    }
    assert.deepEqual((await post("/redefinir", { ...valido, senha: "Nova12345", confirmarSenha: "Nova12346" })).corpo,
        { mensagem: "As senhas não coincidem." });
    // Só POST com JSON; nada é aceito por GET (e-mail nunca na URL).
    for (const rota of ["/solicitar", "/verificar", "/redefinir"]) {
        assert.equal((await fetch(base + rota + "?email=maria%40example.test")).status, 404);
        const formulario = await fetch(base + rota, { method: "POST", body: "email=maria%40example.test" });
        assert.equal(formulario.status, 415);
    }
});
