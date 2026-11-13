const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const util = require("util");
const nodemailer = require("nodemailer");
const email = require("../src/services/emailRecuperacao");
const { VALIDADE_MINUTOS } = require("../src/services/codigoRecuperacao");

// Valores fictícios e fáceis de procurar nos logs. Nenhum teste envia e-mail real.
const SMTP = {
    SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "465", SMTP_SECURE: "true",
    SMTP_USER: "equipe.ficticia@example.test", SMTP_PASS: "senhaDeAppFicticiaXYZ",
    SMTP_FROM: "Portal Scrum <equipe.ficticia@example.test>",
};
const VARIAVEIS = ["NODE_ENV", "RECUPERACAO_MODO", ...email.VARIAVEIS_SMTP];

// Originais capturados uma vez: cada preparar() parte deles, e o fim do teste volta a eles.
const AMBIENTE = { ...process.env };
const CRIAR_ORIGINAL = nodemailer.createTransport;
const CONSOLE_ORIGINAL = { log: console.log, warn: console.warn, error: console.error };
function restaurar() {
    for (const chave of Object.keys(process.env)) if (!(chave in AMBIENTE)) delete process.env[chave];
    Object.assign(process.env, AMBIENTE);
    nodemailer.createTransport = CRIAR_ORIGINAL;
    Object.assign(console, CONSOLE_ORIGINAL);
    email.descartarTransporte();
}

// Ambiente isolado: limpa modo e SMTP, aplica os valores e captura os logs.
function preparar(t, valores = {}) {
    restaurar();
    const logs = [];
    for (const nome of VARIAVEIS) delete process.env[nome];
    Object.assign(process.env, valores);
    for (const tipo of Object.keys(CONSOLE_ORIGINAL)) console[tipo] = (...args) => logs.push(util.format(...args));
    const criados = [];
    nodemailer.createTransport = opcoes => { criados.push(opcoes); throw new Error("Transporte não esperado."); };
    t.after(restaurar);
    return { logs, criados };
}

// Garante que nenhum valor de configuração aparece no texto (só nomes de variáveis).
function semValores(texto) {
    for (const valor of Object.values(SMTP)) assert.ok(!texto.includes(valor), "valor de configuração exposto no log");
}

test("SMTP completo usa o transporte SMTP com TLS direto na porta 465", async (t) => {
    for (const modo of [undefined, "smtp"]) {
        const ctx = preparar(t, { ...SMTP, NODE_ENV: "production", ...(modo ? { RECUPERACAO_MODO: modo } : {}) });
        const enviados = [];
        nodemailer.createTransport = opcoes => {
            ctx.criados.push(opcoes);
            return { sendMail: async dados => { enviados.push(dados); return { accepted: [dados.to], rejected: [] }; } };
        };
        assert.deepEqual(email.configuracao(), {
            modo: "smtp", host: "smtp.gmail.com", porta: 465, seguro: true, remetente: SMTP.SMTP_FROM,
        });
        await email.enviarCodigo("pessoa@example.test", "004213", crypto.randomUUID());
        await email.enviarCodigo("pessoa@example.test", "991100", crypto.randomUUID());
        assert.equal(ctx.criados.length, 1, "o transporte é criado uma vez e reaproveitado");
        const [opcoes] = ctx.criados;
        assert.equal(opcoes.host, "smtp.gmail.com");
        assert.equal(opcoes.port, 465);
        assert.equal(opcoes.secure, true);
        assert.equal(opcoes.requireTLS, false);
        assert.deepEqual(opcoes.auth, { user: SMTP.SMTP_USER, pass: SMTP.SMTP_PASS });
        assert.equal(opcoes.logger, false); assert.equal(opcoes.debug, false);
        assert.equal(enviados[0].from, SMTP.SMTP_FROM);
        assert.equal(enviados[0].to, "pessoa@example.test");
        assert.equal(enviados[0].subject, email.ASSUNTO);
        assert.match(enviados[0].text, /004213/); assert.match(enviados[0].html, /004213/);
        assert.deepEqual(ctx.logs, [], "o envio SMTP não registra nada no log");
    }
});

test("RECUPERACAO_MODO=console em development usa o console e não cria transporte", async (t) => {
    // Mesmo com SMTP completo, console é a escolha explícita.
    for (const valores of [{}, SMTP]) {
        const ctx = preparar(t, { ...valores, NODE_ENV: "development", RECUPERACAO_MODO: "console" });
        assert.deepEqual(email.configuracao(), { modo: "console" });
        await email.enviarCodigo("pessoa@example.test", "004213", "id-console");
        assert.equal(ctx.criados.length, 0);
        assert.equal(ctx.logs.length, 1);
        assert.match(ctx.logs[0], /\[RECUPERAÇÃO LOCAL\].*id-console.*004213.*10 minutos/);
        assert.ok(!ctx.logs[0].includes("pessoa@example.test"), "o console não registra o e-mail");
        assert.deepEqual(await email.prepararEnvio(), { pronto: true, modo: "console" });
        assert.match(ctx.logs[1], /Modo console ativo/);
    }
});

test("console fora de development é recusado com erro, sem fallback silencioso", async (t) => {
    for (const nodeEnv of ["production", "test", undefined]) {
        for (const valores of [{}, SMTP]) {
            const ctx = preparar(t, { ...valores, RECUPERACAO_MODO: "console", ...(nodeEnv ? { NODE_ENV: nodeEnv } : {}) });
            assert.throws(() => email.configuracao(), erro => {
                assert.equal(erro.code, "CONFIG_RECUPERACAO");
                assert.match(erro.message, /RECUPERACAO_MODO=console só é permitido com NODE_ENV=development/);
                return true;
            });
            await assert.rejects(email.enviarCodigo("pessoa@example.test", "004213", "id"), { code: "CONFIG_RECUPERACAO" });
            assert.equal(ctx.criados.length, 0, "não cai para SMTP mesmo com SMTP configurado");
            const resultado = await email.prepararEnvio();
            assert.equal(resultado.pronto, false);
            assert.equal(ctx.logs.length, 1);
            assert.match(ctx.logs[0], /^\[RECUPERAÇÃO\] RECUPERACAO_MODO=console só é permitido/);
            assert.ok(!ctx.logs[0].includes("004213"));
        }
    }
});

test("variáveis ausentes ou inválidas são listadas por nome, nunca por valor", async (t) => {
    const casos = [
        { remover: email.VARIAVEIS_SMTP, faltando: email.VARIAVEIS_SMTP },
        { remover: ["SMTP_PASS"], faltando: ["SMTP_PASS"] },
        { remover: ["SMTP_HOST", "SMTP_FROM"], faltando: ["SMTP_HOST", "SMTP_FROM"] },
        // Só espaços conta como ausente.
        { trocar: { SMTP_USER: "   " }, faltando: ["SMTP_USER"] },
    ];
    for (const caso of casos) {
        const valores = { ...SMTP, ...caso.trocar, NODE_ENV: "production" };
        for (const nome of caso.remover || []) delete valores[nome];
        const ctx = preparar(t, valores);
        let mensagem;
        assert.throws(() => email.configuracao(), erro => {
            assert.equal(erro.code, "CONFIG_RECUPERACAO");
            assert.deepEqual(erro.faltando, caso.faltando);
            assert.equal(erro.message, "Configuração SMTP incompleta. Variáveis ausentes: " + caso.faltando.join(", ") + ".");
            mensagem = erro.message;
            return true;
        });
        semValores(mensagem);
        const resultado = await email.prepararEnvio();
        assert.deepEqual(resultado, { pronto: false, codigo: "CONFIG_RECUPERACAO", faltando: caso.faltando });
        assert.equal(ctx.logs.length, 1);
        for (const nome of caso.faltando) assert.ok(ctx.logs[0].includes(nome));
        assert.match(ctx.logs[0], /o restante do portal funciona normalmente/);
        semValores(ctx.logs[0]);
        assert.equal(ctx.criados.length, 0);
    }
    for (const [nome, valor] of [["SMTP_PORT", "porta"], ["SMTP_PORT", "70000"], ["SMTP_SECURE", "sim"]]) {
        preparar(t, { ...SMTP, [nome]: valor });
        assert.throws(() => email.configuracao(), { message: "Configuração SMTP inválida nas variáveis: " + nome + "." });
    }
    preparar(t, { ...SMTP, RECUPERACAO_MODO: "gmail" });
    assert.throws(() => email.configuracao(), { message: "RECUPERACAO_MODO deve ser smtp ou console." });
});

test("verificação ao subir: SMTP pronto ou falha só com o código do erro", async (t) => {
    let ctx = preparar(t, SMTP);
    let verificacoes = 0;
    nodemailer.createTransport = opcoes => { ctx.criados.push(opcoes); return { verify: async () => { verificacoes++; return true; } }; };
    assert.deepEqual(await email.prepararEnvio(), { pronto: true, modo: "smtp" });
    assert.equal(verificacoes, 1);
    assert.deepEqual(ctx.logs, ["[RECUPERAÇÃO] SMTP pronto."]);

    ctx = preparar(t, SMTP);
    nodemailer.createTransport = () => ({
        verify: async () => {
            // Mensagens reais do servidor podem trazer usuário e resposta completa; nada disso vai ao log.
            throw Object.assign(new Error("Invalid login: 535 user " + SMTP.SMTP_USER + " " + SMTP.SMTP_PASS), { code: "EAUTH", responseCode: 535 });
        },
    });
    assert.deepEqual(await email.prepararEnvio(), { pronto: false, modo: "smtp", codigo: "EAUTH/535" });
    assert.equal(ctx.logs.length, 1);
    assert.match(ctx.logs[0], /^\[RECUPERAÇÃO\] Falha ao verificar o SMTP \(código EAUTH\/535\)/);
    assert.ok(!ctx.logs[0].includes("Invalid login"));
    semValores(ctx.logs[0]);
});

test("conteúdo do e-mail: código em destaque, validade centralizada e aviso, sem links", () => {
    const mensagem = email.montarMensagem(SMTP.SMTP_FROM, "pessoa@example.test", "004213");
    assert.equal(mensagem.from, SMTP.SMTP_FROM);
    assert.equal(mensagem.subject, email.ASSUNTO);
    for (const corpo of [mensagem.text, mensagem.html]) {
        assert.ok(corpo.includes("004213"));
        assert.ok(corpo.includes(VALIDADE_MINUTOS + " minutos"));
        assert.match(corpo, /não pediu a recuperação de senha, ignore este e-mail/);
        assert.doesNotMatch(corpo, /https?:|www\.|<a\b|href/i);
        assert.ok(!corpo.includes("pessoa@example.test"), "o corpo não repete dados do candidato");
    }
    assert.match(mensagem.html, /font-weight:bold[^>]*>004213</);
});

test("202 genérico idêntico quando o SMTP rejeita, recusa o destinatário ou não está configurado", async (t) => {
    const SEGREDOS = { SESSION_SECRET: crypto.randomBytes(32).toString("hex"), RECUPERACAO_SECRET: crypto.randomBytes(32).toString("hex") };
    Object.assign(process.env, SEGREDOS);
    const pool = require("../src/config/db");
    const model = require("../src/models/recuperacaoModel");
    const originaisModel = { ...model };
    const originaisPool = { query: pool.query, connect: pool.connect };
    pool.query = pool.connect = async () => { throw new Error("O banco não deveria ser acessado."); };
    const codigos = [];
    let concluir;
    model.reservarLimite = async () => true;
    model.criarSolicitacao = async (destino, id, codigo) => {
        codigos.push(codigo);
        return destino === "conta@example.test" ? { email: destino } : null;
    };
    model.concluirEnvio = async (id, enviada) => concluir({ id, enviada });
    const app = require("../src/app");
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    t.after(async () => {
        Object.assign(model, originaisModel);
        Object.assign(pool, originaisPool);
        await new Promise(resolve => servidor.close(resolve));
        await pool.end();
    });
    const url = "http://127.0.0.1:" + servidor.address().port + "/api/auth/recuperacao/solicitar";
    async function solicitar(destino) {
        const conclusao = new Promise(resolve => { concluir = resolve; });
        const resposta = await fetch(url, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: destino }),
        });
        return { status: resposta.status, corpo: await resposta.json(), conclusao };
    }
    function transporte(sendMail) {
        nodemailer.createTransport = () => ({ sendMail });
    }
    const cenarios = [
        { nome: "SMTP aceita", valores: SMTP, sendMail: async d => ({ accepted: [d.to], rejected: [] }), enviada: true },
        { nome: "SMTP rejeita a autenticação", valores: SMTP, enviada: false, log: "EAUTH/535",
            sendMail: async () => { throw Object.assign(new Error("Invalid login " + SMTP.SMTP_PASS), { code: "EAUTH", responseCode: 535 }); } },
        { nome: "SMTP recusa o destinatário", valores: SMTP, enviada: false, log: "DESTINATARIO_RECUSADO",
            sendMail: async d => ({ accepted: [], rejected: [d.to] }) },
        { nome: "SMTP não configurado", valores: { NODE_ENV: "production" }, enviada: false, log: "CONFIG_RECUPERACAO" },
    ];
    let referencia;
    for (const cenario of cenarios) {
        const ctx = preparar(t, { ...SEGREDOS, ...cenario.valores, NODE_ENV: "production" });
        if (cenario.sendMail) transporte(cenario.sendMail);
        const resposta = await solicitar("conta@example.test");
        assert.equal(resposta.status, 202, cenario.nome);
        referencia ??= resposta.corpo;
        assert.deepEqual(resposta.corpo, referencia, cenario.nome);
        assert.equal((await resposta.conclusao).enviada, cenario.enviada, cenario.nome);
        if (cenario.log) {
            assert.deepEqual(ctx.logs, ["Falha no envio do código de recuperação de senha (código " + cenario.log + ")."], cenario.nome);
        } else {
            assert.deepEqual(ctx.logs, [], cenario.nome);
        }
        for (const linha of ctx.logs) {
            assert.ok(!linha.includes("conta@example.test") && !linha.includes(codigos.at(-1)), cenario.nome);
            semValores(linha);
        }
    }
    // Conta inexistente: mesma resposta e nenhum transporte usado.
    const ctx = preparar(t, { ...SEGREDOS, ...SMTP, NODE_ENV: "production" });
    const inexistente = await solicitar("ninguem@example.test");
    assert.equal(inexistente.status, 202);
    assert.deepEqual(inexistente.corpo, referencia);
    assert.equal(ctx.criados.length, 0);
    assert.deepEqual(ctx.logs, []);
});
