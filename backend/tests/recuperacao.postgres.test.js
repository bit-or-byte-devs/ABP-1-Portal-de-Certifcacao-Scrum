const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Só acessa PostgreSQL quando esse teste é explicitamente habilitado.
test("recuperação com PostgreSQL isolado, concorrência e sessões", {
    skip: process.env.TEST_RECUPERACAO_POSTGRES !== "true",
}, async (t) => {
    require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.RECUPERACAO_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.NODE_ENV = "development";
    process.env.RECUPERACAO_MODO = "console";
    const conexao = {
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 3000,
    };
    const administrador = new Pool(conexao);
    const schema = "teste_recuperacao_" + crypto.randomBytes(8).toString("hex");
    assert.match(schema, /^teste_recuperacao_[a-f0-9]{16}$/);
    let banco;
    let servidor;
    let criado = false;
    t.after(async () => {
        if (servidor) await new Promise(resolve => servidor.close(resolve));
        if (banco) await banco.end();
        // Remove somente o schema criado por este teste, com nome aleatório validado.
        if (criado) await administrador.query(`DROP SCHEMA "${schema}" CASCADE`);
        await administrador.end();
    });
    await administrador.query(`CREATE SCHEMA "${schema}"`);
    criado = true;
    banco = new Pool({ ...conexao, options: "-c search_path=" + schema });
    const ddl = fs.readFileSync(path.join(__dirname, "../../database/ddl/schema.sql"), "utf8");
    const inicio = ddl.indexOf("CREATE TABLE tbcandidato");
    await banco.query(ddl.slice(inicio, ddl.indexOf(");", inicio) + 2));
    const sql = fs.readFileSync(path.join(__dirname, "../../database/migrations/001_recuperacao_senha.sql"), "utf8");
    await banco.query(sql);
    await banco.query(sql); // A migração pode ser aplicada novamente sem apagar dados.
    // A 008 recusa e-mails repetidos sem alterar nada; resolvidos, normaliza e cria o índice único.
    const emailUnico = fs.readFileSync(path.join(__dirname, "../../database/migrations/008_email_unico.sql"), "utf8");
    await banco.query(
        `INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash) VALUES
         ('39053344705', 'Duplicado Um', 'Dup@Example.test', 'x'), ('12345678909', 'Duplicado Dois', ' dup@example.test ', 'x')`
    );
    const conexaoMigracao = await banco.connect();
    try {
        await assert.rejects(conexaoMigracao.query(emailUnico), /1 e-mail\(s\) repetido\(s\) em 2 conta\(s\); nenhum dado foi alterado/);
        await conexaoMigracao.query("ROLLBACK");
    } finally { conexaoMigracao.release(); }
    assert.deepEqual((await banco.query("SELECT email FROM tbcandidato ORDER BY cpf DESC")).rows.map(r => r.email),
        ["Dup@Example.test", " dup@example.test "]);
    assert.equal((await banco.query("SELECT to_regclass('uq_candidato_email') AS indice")).rows[0].indice, null);
    await banco.query("UPDATE tbcandidato SET email = ' Outro@Example.TEST ' WHERE cpf = '12345678909'");
    await banco.query(emailUnico);
    await banco.query(emailUnico); // Também pode ser aplicada novamente.
    assert.deepEqual((await banco.query("SELECT email FROM tbcandidato ORDER BY cpf DESC")).rows.map(r => r.email),
        ["dup@example.test", "outro@example.test"]);
    await banco.query("DELETE FROM tbcandidato");
    const caminhoDb = require.resolve("../src/config/db");
    require.cache[caminhoDb] = { id: caminhoDb, filename: caminhoDb, loaded: true, exports: banco };
    const { gerarHash, verificarSenha } = require("../src/services/senha");
    const codigoService = require("../src/services/codigoRecuperacao");
    const emailService = require("../src/services/emailRecuperacao");
    const hashOriginal = await gerarHash("Antiga123");
    const inserido = await banco.query(
        `INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash)
         VALUES ($1, $2, $3, $4) RETURNING id`, ["52998224725", "Maria Silva", "maria@example.test", hashOriginal]
    );
    const candidatoId = inserido.rows[0].id;
    await banco.query(
        "INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash) VALUES ($1, $2, $3, $4)",
        ["11144477735", "Outra Pessoa", "outra@example.test", hashOriginal]
    );
    const emails = [];
    let falharEmail = false;
    let atrasoEmail = 0;
    // Transporte de teste: guarda o código, pode demorar ou falhar. Nunca envia e-mail real.
    emailService.enviarCodigo = async (email, codigo, id) => {
        if (atrasoEmail) await new Promise(resolve => setTimeout(resolve, atrasoEmail));
        if (falharEmail) { emails.push({ email, codigo, id, falhou: true }); throw new Error("SMTP de teste indisponível"); }
        emails.push({ email, codigo, id });
    };
    const app = require("../src/app");
    servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    const base = "http://127.0.0.1:" + servidor.address().port;
    async function post(rota, dados) {
        const resposta = await fetch(base + rota, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
        });
        return { status: resposta.status, corpo: await resposta.json(), resposta };
    }
    async function solicitar(email = "maria@example.test") {
        return post("/api/auth/recuperacao/solicitar", { email });
    }
    async function verificar(codigo, email = "maria@example.test") {
        return post("/api/auth/recuperacao/verificar", { email, codigo });
    }
    async function trocar(codigo, senha = "Nova12345", email = "maria@example.test") {
        return post("/api/auth/recuperacao/redefinir", { email, codigo, senha, confirmarSenha: senha });
    }
    // O envio roda em segundo plano: espera o pedido sair de "enviando" antes de usar o código.
    async function aguardar(condicao, descricao) {
        for (let i = 0; i < 150; i++) {
            if (await condicao()) return;
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.fail("Tempo esgotado aguardando: " + descricao);
    }
    async function aguardarEnvio() {
        await aguardar(async () => (await banco.query(
            "SELECT count(*)::int AS pendentes FROM tbrecuperacao_senha WHERE NOT enviada AND NOT invalidada"
        )).rows[0].pendentes === 0, "conclusão do envio");
    }
    async function solicitarEnviado(email) {
        const pedido = await solicitar(email);
        assert.equal(pedido.status, 202);
        await aguardarEnvio();
        return pedido;
    }
    async function preparar() {
        process.env.RECUPERACAO_SOLICITACOES_LIVRES = "false";
        await banco.query("TRUNCATE tbrecuperacao_senha, tblimite_recuperacao");
        await banco.query("UPDATE tbcandidato SET senha_hash = $2, versao_sessao = 0 WHERE id = $1", [candidatoId, hashOriginal]);
        emails.length = 0; falharEmail = false; atrasoEmail = 0;
    }
    async function liberarReenvio() {
        await banco.query("UPDATE tblimite_recuperacao SET reinicia_em = clock_timestamp() - INTERVAL '1 second'");
    }
    async function lerConta() {
        return (await banco.query("SELECT senha_hash, versao_sessao FROM tbcandidato WHERE id = $1", [candidatoId])).rows[0];
    }
    async function lerPedido() {
        return (await banco.query("SELECT * FROM tbrecuperacao_senha")).rows[0];
    }
    function codigoErrado(codigo) { return codigo === "000000" ? "111111" : "000000"; }
    const MENSAGEM_PUBLICA = "Se houver uma conta com esse e-mail, enviaremos um código de recuperação.";
    const INVALIDO = { mensagem: "Código inválido ou já utilizado. Confira os dados ou solicite outro código." };
    const EXPIRADO = { mensagem: "Código expirado. Solicite outro código." };
    const TENTATIVAS = { mensagem: "Limite de cinco tentativas atingido. Solicite outro código." };
    await t.test("zeros à esquerda e HMAC vinculado ao pedido", async () => {
        const original = crypto.randomInt;
        try { crypto.randomInt = () => 7; assert.equal(codigoService.gerarCodigo(), "000007"); }
        finally { crypto.randomInt = original; }
        const id = crypto.randomUUID();
        const hmac = codigoService.protegerCodigo(candidatoId, id, "000007");
        assert.equal(codigoService.conferirCodigo(candidatoId, id, "000007", hmac), true);
        assert.equal(codigoService.conferirCodigo(candidatoId + 1, id, "000007", hmac), false);
        assert.equal(codigoService.conferirCodigo(candidatoId, crypto.randomUUID(), "000007", hmac), false);
    });
    await t.test("fluxo completo: solicitar, verificar, redefinir, uso único, login e sessões derrubadas", async () => {
        await preparar();
        const login = await post("/api/auth/login", { cpf: "52998224725", senha: "Antiga123" });
        const cookie = login.resposta.headers.get("set-cookie").split(";")[0];
        const outroLogin = await post("/api/auth/login", { cpf: "52998224725", senha: "Antiga123" });
        const outroCookie = outroLogin.resposta.headers.get("set-cookie").split(";")[0];
        // Só o e-mail, normalizado como no cadastro (espaços e maiúsculas).
        const pedido = await solicitarEnviado("  MARIA@Example.TEST ");
        assert.deepEqual(pedido.corpo, { mensagem: MENSAGEM_PUBLICA, expiraEmMinutos: 10, aguardarSegundos: 60 });
        assert.equal(pedido.resposta.headers.get("cache-control"), "no-store");
        assert.equal(emails.length, 1); assert.equal(emails[0].email, "maria@example.test");
        const row = await lerPedido();
        assert.equal(row.codigo_hmac.length, 64);
        assert.notEqual(row.codigo_hmac, emails[0].codigo);
        assert.equal(row.candidato_id, candidatoId);
        const ttl = row.expira_em.getTime() - Date.now();
        assert.ok(ttl > 590000 && ttl <= 600000);
        // Verificar confere sem consumir e sem gastar tentativa.
        const verificado = await verificar(emails[0].codigo, " Maria@Example.test");
        assert.equal(verificado.status, 200);
        assert.deepEqual(verificado.corpo, { mensagem: "Código confirmado. Defina a nova senha." });
        assert.equal((await verificar(emails[0].codigo)).status, 200);
        assert.equal((await lerPedido()).tentativas, 0);
        assert.equal((await lerPedido()).consumida_em, null);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
        // Redefinir confere de novo e consome na mesma operação.
        assert.equal((await trocar(emails[0].codigo)).status, 200);
        // Código já utilizado: mesma resposta nas duas rotas.
        assert.deepEqual((await verificar(emails[0].codigo)).corpo, INVALIDO);
        const reuso = await trocar(emails[0].codigo, "Outra12345");
        assert.equal(reuso.status, 400); assert.deepEqual(reuso.corpo, INVALIDO);
        const conta = await lerConta();
        assert.equal(conta.versao_sessao, 1);
        assert.equal(await verificarSenha("Nova12345", conta.senha_hash), true);
        assert.equal(await verificarSenha("Antiga123", conta.senha_hash), false);
        // Sessões abertas antes da troca deixam de valer.
        assert.equal((await fetch(base + "/api/auth/usuario", { headers: { Cookie: cookie } })).status, 401);
        assert.equal((await fetch(base + "/pages/menu.html", { redirect: "manual", headers: { Cookie: outroCookie } })).status, 302);
        assert.equal((await post("/api/auth/login", { cpf: "52998224725", senha: "Antiga123" })).status, 401);
        assert.equal((await post("/api/auth/login", { cpf: "52998224725", senha: "Nova12345" })).status, 200);
    });
    await t.test("202 idêntico para conta existente, inexistente e falha de envio", async () => {
        await preparar();
        const existente = await solicitarEnviado();
        const inexistente = await solicitar("ausente@example.test");
        assert.equal(inexistente.status, 202);
        assert.deepEqual(inexistente.corpo, existente.corpo);
        assert.equal(emails.length, 1);
        // Falha no transporte: mesma resposta, pedido invalidado e log sem código nem e-mail.
        await liberarReenvio(); falharEmail = true;
        const erros = []; const erroOriginal = console.error;
        console.error = (...args) => erros.push(args.join(" "));
        let falha;
        try {
            falha = await solicitar();
            await aguardarEnvio();
        } finally { console.error = erroOriginal; }
        assert.equal(falha.status, 202);
        assert.deepEqual(falha.corpo, existente.corpo);
        const row = await lerPedido();
        assert.equal(row.enviada, false); assert.equal(row.invalidada, true);
        assert.deepEqual(erros, ["Falha no envio do código de recuperação de senha."]);
        const codigoNaoEnviado = emails.at(-1).codigo;
        assert.ok(emails.at(-1).falhou);
        assert.doesNotMatch(erros.join(" "), new RegExp(codigoNaoEnviado + "|@"));
        // O código de um envio que falhou não vale em nenhuma das rotas.
        assert.deepEqual((await verificar(codigoNaoEnviado)).corpo, INVALIDO);
        assert.deepEqual((await trocar(codigoNaoEnviado)).corpo, INVALIDO);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
    });
    await t.test("resposta não aguarda o transporte e o código só vale depois do envio", async () => {
        await preparar(); atrasoEmail = 400;
        const inicio = Date.now();
        const pedido = await solicitar();
        assert.equal(pedido.status, 202);
        assert.ok(Date.now() - inicio < atrasoEmail, "a resposta não pode esperar o envio");
        assert.equal((await lerPedido()).enviada, false);
        await aguardarEnvio();
        assert.equal((await lerPedido()).enviada, true);
        assert.equal((await verificar(emails[0].codigo)).status, 200);
    });
    await t.test("solicitação só por e-mail: CPF é ignorado e não escolhe a conta", async () => {
        await preparar();
        // CPF de uma conta com e-mail de outra: vale só o e-mail.
        const pedido = await post("/api/auth/recuperacao/solicitar", { cpf: "52998224725", email: "outra@example.test" });
        assert.equal(pedido.status, 202);
        await aguardarEnvio();
        assert.deepEqual(emails.map(e => e.email), ["outra@example.test"]);
        assert.notEqual((await lerPedido()).candidato_id, candidatoId);
        // Sem e-mail não há pedido.
        assert.equal((await post("/api/auth/recuperacao/solicitar", { cpf: "52998224725" })).status, 400);
        assert.equal((await banco.query("SELECT * FROM tbrecuperacao_senha")).rowCount, 1);
        // O código da outra conta não serve para a Maria.
        assert.deepEqual((await verificar(emails[0].codigo)).corpo, INVALIDO);
    });
    await t.test("contador compartilhado: erros no /verificar somados aos do /redefinir bloqueiam no 5º", async () => {
        await preparar(); await solicitarEnviado();
        const certo = emails[0].codigo;
        const errado = codigoErrado(certo);
        assert.deepEqual((await verificar(errado)).corpo, INVALIDO);
        assert.deepEqual((await verificar(errado)).corpo, INVALIDO);
        assert.deepEqual((await trocar(errado)).corpo, INVALIDO);
        assert.deepEqual((await trocar(errado)).corpo, INVALIDO);
        assert.equal((await lerPedido()).tentativas, 4);
        const quinto = await verificar(errado);
        assert.equal(quinto.status, 400); assert.deepEqual(quinto.corpo, TENTATIVAS);
        assert.equal((await lerPedido()).tentativas, 5);
        // Bloqueado inclusive para o código correto, nas duas rotas.
        assert.deepEqual((await verificar(certo)).corpo, TENTATIVAS);
        assert.deepEqual((await trocar(certo)).corpo, TENTATIVAS);
        assert.equal((await lerPedido()).tentativas, 5);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
        // No sentido inverso o 5º erro também bloqueia: não há contador por rota.
        await liberarReenvio(); emails.length = 0; await solicitarEnviado();
        for (let i = 0; i < 4; i++) await trocar(codigoErrado(emails[0].codigo));
        assert.deepEqual((await verificar(codigoErrado(emails[0].codigo))).corpo, TENTATIVAS);
        assert.deepEqual((await trocar(emails[0].codigo)).corpo, TENTATIVAS);
    });
    await t.test("código inválido e expirado têm a mesma resposta nas duas rotas", async () => {
        await preparar(); await solicitarEnviado();
        const errado = codigoErrado(emails[0].codigo);
        const verificarErrado = await verificar(errado);
        const trocarErrado = await trocar(errado);
        assert.equal(verificarErrado.status, 400); assert.deepEqual(verificarErrado.corpo, INVALIDO);
        assert.equal(trocarErrado.status, 400); assert.deepEqual(trocarErrado.corpo, INVALIDO);
        // Conta inexistente responde como código inválido.
        assert.deepEqual((await verificar(emails[0].codigo, "ausente@example.test")).corpo, INVALIDO);
        assert.deepEqual((await trocar(emails[0].codigo, "Nova12345", "ausente@example.test")).corpo, INVALIDO);
        await banco.query("UPDATE tbrecuperacao_senha SET expira_em = clock_timestamp() - INTERVAL '1 second'");
        const tentativasAntes = (await lerPedido()).tentativas;
        const verificarExpirado = await verificar(emails[0].codigo);
        const trocarExpirado = await trocar(emails[0].codigo);
        assert.equal(verificarExpirado.status, 400); assert.deepEqual(verificarExpirado.corpo, EXPIRADO);
        assert.equal(trocarExpirado.status, 400); assert.deepEqual(trocarExpirado.corpo, EXPIRADO);
        assert.equal((await lerPedido()).tentativas, tentativasAntes);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
    });
    await t.test("reenvio respeita um minuto e invalida o pedido anterior", async () => {
        await preparar(); await solicitarEnviado(); const codigoAnterior = emails[0].codigo;
        const repetido = await solicitar("MARIA@example.test");
        assert.equal(repetido.status, 429);
        assert.equal(repetido.resposta.headers.get("retry-after"), "60");
        await liberarReenvio(); await solicitarEnviado();
        assert.equal(emails.length, 2);
        if (codigoAnterior !== emails[1].codigo) assert.deepEqual((await verificar(codigoAnterior)).corpo, INVALIDO);
        assert.equal((await trocar(emails[1].codigo)).status, 200);
    });
    await t.test("requisições simultâneas consomem o código somente uma vez", async () => {
        await preparar(); await solicitarEnviado();
        const respostas = await Promise.all([
            trocar(emails[0].codigo, "Primeira123"),
            trocar(emails[0].codigo, "Segunda123"),
        ]);
        assert.deepEqual(respostas.map(r => r.status).sort(), [200, 400]);
        assert.equal((await lerConta()).versao_sessao, 1);
    });
    await t.test("e-mail repetido é recusado pelo banco, sem diferenciar maiúsculas", async () => {
        await assert.rejects(banco.query(
            "INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash) VALUES ($1, $2, $3, $4)",
            ["39053344705", "Maria Copia", "MARIA@Example.TEST", hashOriginal]
        ), erro => erro.code === "23505" && erro.constraint === "uq_candidato_email");
    });
    await t.test("cadastro normaliza o e-mail e recusa repetido, inclusive simultâneo", async () => {
        await preparar(); // Não depende da senha deixada pelo teste anterior.
        async function cadastrar(cpf, email) {
            return post("/api/candidatos", { nome: "Teste Cadastro", cpf, email, senha: "Senha123", aceiteTermos: true });
        }
        const cpfsCriados = ["39053344705", "12345678909", "98765432100"];
        try {
            const repetido = await cadastrar("39053344705", "  MARIA@example.TEST ");
            assert.equal(repetido.status, 409);
            assert.deepEqual(repetido.corpo, { mensagem: "Este e-mail já possui cadastro.", campo: "email" });
            const novo = await cadastrar("39053344705", "  Nova@Example.TEST ");
            assert.equal(novo.status, 201);
            assert.equal((await banco.query("SELECT email FROM tbcandidato WHERE cpf = $1", ["39053344705"])).rows[0].email, "nova@example.test");
            const cpfRepetido = await cadastrar("52998224725", "inedito@example.test");
            assert.equal(cpfRepetido.status, 409);
            assert.deepEqual(cpfRepetido.corpo, { mensagem: "Este CPF já possui cadastro.", campo: "cpf" });
            const simultaneos = await Promise.all([cadastrar("12345678909", "par@example.test"), cadastrar("98765432100", "PAR@Example.test")]);
            assert.deepEqual(simultaneos.map(r => r.status).sort(), [201, 409]);
            assert.deepEqual(simultaneos.find(r => r.status === 409).corpo, { mensagem: "Este e-mail já possui cadastro.", campo: "email" });
            assert.equal((await banco.query("SELECT count(*)::int AS total FROM tbcandidato WHERE lower(email) = 'par@example.test'")).rows[0].total, 1);
            // A recusa do e-mail não altera a conta existente.
            assert.equal((await lerConta()).senha_hash, hashOriginal);
        } finally { await banco.query("DELETE FROM tbcandidato WHERE cpf = ANY($1)", [cpfsCriados]); }
    });
    await t.test("limites atômicos por e-mail e IP", async () => {
        await preparar();
        const model = require("../src/models/recuperacaoModel");
        const simultaneos = await Promise.all([
            model.reservarLimite("email-minuto", "teste@example.test", 1, 60),
            model.reservarLimite("email-minuto", "teste@example.test", 1, 60),
        ]);
        assert.deepEqual(simultaneos.sort(), [false, true]);
        // 10 solicitações por IP a cada 10 minutos, com e-mails diferentes.
        for (let i = 0; i < 10; i++) assert.equal((await solicitar(`ausente${i}@example.test`)).status, 202);
        assert.equal((await solicitar("ausente10@example.test")).status, 429);
        // 5 por hora para o mesmo e-mail, mesmo liberando o limite de 1 por minuto.
        await preparar();
        for (let i = 0; i < 5; i++) {
            assert.equal((await solicitar()).status, 202);
            await banco.query("UPDATE tblimite_recuperacao SET reinicia_em = clock_timestamp() - INTERVAL '1 second' WHERE chave = $1",
                [codigoService.protegerLimite("email-minuto", "maria@example.test")]);
        }
        assert.equal((await solicitar(" Maria@Example.TEST ")).status, 429);
        await aguardarEnvio();
        // Limite por IP das validações é um só para /verificar e /redefinir (30 a cada 10 minutos).
        await preparar();
        for (let i = 0; i < 15; i++) {
            assert.equal((await verificar("123456", "ausente@example.test")).status, 400);
            assert.equal((await trocar("123456", "Nova12345", "ausente@example.test")).status, 400);
        }
        assert.equal((await verificar("123456", "ausente@example.test")).status, 429);
        assert.equal((await trocar("123456", "Nova12345", "ausente@example.test")).status, 429);
    });
    await t.test("liberação local permite solicitar repetidamente sem espera", async () => {
        await preparar();
        process.env.RECUPERACAO_SOLICITACOES_LIVRES = "true";
        try {
            for (let i = 0; i < 12; i++) {
                const pedido = await solicitar();
                assert.equal(pedido.status, 202);
                assert.equal(pedido.corpo.aguardarSegundos, 0);
            }
            await aguardar(async () => emails.length === 12, "12 envios");
            assert.equal((await banco.query("SELECT * FROM tblimite_recuperacao")).rowCount, 0);
        } finally { process.env.RECUPERACAO_SOLICITACOES_LIVRES = "false"; }
    });
    await t.test("erro ao consumir código faz rollback também da nova senha", async () => {
        await preparar(); await solicitarEnviado();
        await banco.query("ALTER TABLE tbrecuperacao_senha ADD CONSTRAINT teste_impedir_consumo CHECK (consumida_em IS NULL)");
        const erroOriginal = console.error; console.error = () => {};
        try {
            assert.equal((await trocar(emails[0].codigo)).status, 503);
            assert.equal((await lerConta()).senha_hash, hashOriginal);
            assert.equal((await lerConta()).versao_sessao, 0);
        } finally {
            console.error = erroOriginal;
            await banco.query("ALTER TABLE tbrecuperacao_senha DROP CONSTRAINT teste_impedir_consumo");
        }
        assert.equal((await trocar(emails[0].codigo)).status, 200);
    });
});
