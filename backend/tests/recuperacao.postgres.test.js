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
        ["11144477735", "Outra Pessoa", "maria@example.test", hashOriginal]
    );
    const emails = [];
    let falharEmail = false;
    emailService.enviarCodigo = async (email, codigo, id) => {
        if (falharEmail) throw new Error("SMTP de teste indisponível");
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
    async function solicitar(cpf = "52998224725", email = "maria@example.test") {
        return post("/api/auth/recuperacao/solicitar", { cpf, email });
    }
    async function trocar(id, codigo, senha = "Nova12345") {
        return post("/api/auth/recuperacao/redefinir", { solicitacaoId: id, codigo, senha, confirmarSenha: senha });
    }
    async function preparar() {
        process.env.RECUPERACAO_SOLICITACOES_LIVRES = "false";
        await banco.query("TRUNCATE tbrecuperacao_senha, tblimite_recuperacao");
        await banco.query("UPDATE tbcandidato SET senha_hash = $2, versao_sessao = 0 WHERE id = $1", [candidatoId, hashOriginal]);
        emails.length = 0; falharEmail = false;
    }
    async function liberarReenvio() {
        await banco.query("UPDATE tblimite_recuperacao SET reinicia_em = clock_timestamp() - INTERVAL '1 second'");
    }
    async function lerConta() {
        return (await banco.query("SELECT senha_hash, versao_sessao FROM tbcandidato WHERE id = $1", [candidatoId])).rows[0];
    }
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
    await t.test("recuperação correta, uso único, senha antiga e sessões invalidadas", async () => {
        await preparar();
        const login = await post("/api/auth/login", { cpf: "52998224725", senha: "Antiga123" });
        const cookie = login.resposta.headers.get("set-cookie").split(";")[0];
        const outroLogin = await post("/api/auth/login", { cpf: "52998224725", senha: "Antiga123" });
        const outroCookie = outroLogin.resposta.headers.get("set-cookie").split(";")[0];
        const pedido = await solicitar();
        assert.equal(pedido.status, 202);
        assert.deepEqual(Object.keys(pedido.corpo).sort(), ["aguardarSegundos", "mensagem", "solicitacaoId"]);
        const row = (await banco.query("SELECT * FROM tbrecuperacao_senha")).rows[0];
        assert.equal(row.codigo_hmac.length, 64);
        assert.notEqual(row.codigo_hmac, emails[0].codigo);
        assert.equal(row.candidato_id, candidatoId);
        const ttl = row.expira_em.getTime() - Date.now();
        assert.ok(ttl > 590000 && ttl <= 600000);
        assert.equal((await trocar(pedido.corpo.solicitacaoId, emails[0].codigo)).status, 200);
        assert.equal((await trocar(pedido.corpo.solicitacaoId, emails[0].codigo)).status, 400);
        const conta = await lerConta();
        assert.equal(conta.versao_sessao, 1);
        assert.equal(await verificarSenha("Nova12345", conta.senha_hash), true);
        assert.equal(await verificarSenha("Antiga123", conta.senha_hash), false);
        assert.equal((await fetch(base + "/api/auth/usuario", { headers: { Cookie: cookie } })).status, 401);
        assert.equal((await fetch(base + "/pages/menu.html", { redirect: "manual", headers: { Cookie: outroCookie } })).status, 302);
        assert.equal((await post("/api/auth/login", { cpf: "52998224725", senha: "Antiga123" })).status, 401);
        assert.equal((await post("/api/auth/login", { cpf: "52998224725", senha: "Nova12345" })).status, 200);
    });
    await t.test("cinco erros bloqueiam inclusive o código correto", async () => {
        await preparar(); const pedido = await solicitar();
        const errado = emails[0].codigo === "000000" ? "111111" : "000000";
        for (let i = 0; i < 5; i++) assert.equal((await trocar(pedido.corpo.solicitacaoId, errado)).status, 400);
        const bloqueado = await trocar(pedido.corpo.solicitacaoId, emails[0].codigo);
        assert.match(bloqueado.corpo.mensagem, /cinco tentativas/);
        assert.equal((await banco.query("SELECT tentativas FROM tbrecuperacao_senha")).rows[0].tentativas, 5);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
    });
    await t.test("código expirado não muda senha", async () => {
        await preparar(); const pedido = await solicitar();
        await banco.query("UPDATE tbrecuperacao_senha SET expira_em = clock_timestamp() - INTERVAL '1 second'");
        const resposta = await trocar(pedido.corpo.solicitacaoId, emails[0].codigo);
        assert.match(resposta.corpo.mensagem, /expirado/);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
    });
    await t.test("reenvio respeita um minuto e invalida o pedido anterior", async () => {
        await preparar(); const primeiro = await solicitar(); const codigoAnterior = emails[0].codigo;
        assert.equal((await solicitar()).status, 429);
        await liberarReenvio(); const segundo = await solicitar();
        assert.equal(segundo.status, 202);
        assert.equal((await trocar(primeiro.corpo.solicitacaoId, codigoAnterior)).status, 400);
        assert.equal((await trocar(segundo.corpo.solicitacaoId, emails[1].codigo)).status, 200);
    });
    await t.test("requisições simultâneas consomem o código somente uma vez", async () => {
        await preparar(); const pedido = await solicitar();
        const respostas = await Promise.all([
            trocar(pedido.corpo.solicitacaoId, emails[0].codigo, "Primeira123"),
            trocar(pedido.corpo.solicitacaoId, emails[0].codigo, "Segunda123"),
        ]);
        assert.deepEqual(respostas.map(r => r.status).sort(), [200, 400]);
        assert.equal((await lerConta()).versao_sessao, 1);
    });
    await t.test("falha SMTP invalida código e não confirma envio", async () => {
        await preparar(); falharEmail = true;
        const pedido = await solicitar(); assert.equal(pedido.status, 503);
        const row = (await banco.query("SELECT enviada, invalidada FROM tbrecuperacao_senha")).rows[0];
        assert.equal(row.enviada, false); assert.equal(row.invalidada, true);
        assert.equal((await lerConta()).senha_hash, hashOriginal);
        assert.doesNotMatch(JSON.stringify(pedido.corpo), /SMTP de teste|senha_hash|codigo_hmac/);
    });
    await t.test("conta ausente e CPF incompatível têm a mesma resposta pública", async () => {
        await preparar(); const existente = await solicitar();
        const ausente = await solicitar("12345678901", "ausente@example.test");
        assert.equal(ausente.status, 202);
        assert.equal(ausente.corpo.mensagem, existente.corpo.mensagem);
        assert.equal(emails.length, 1);
        assert.equal((await trocar(ausente.corpo.solicitacaoId, "123456")).status, 400);
    });
    await t.test("e-mail repetido identifica a conta pelo CPF e exige correspondência", async () => {
        await preparar();
        const pedido = await solicitar("11144477735", "maria@example.test");
        assert.equal(pedido.status, 202);
        const conta = (await banco.query("SELECT candidato_id FROM tbrecuperacao_senha WHERE solicitacao_id = $1", [pedido.corpo.solicitacaoId])).rows[0];
        assert.notEqual(conta.candidato_id, candidatoId);
        await preparar();
        const errado = await solicitar("52998224725", "outro@example.test");
        assert.equal(errado.status, 202);
        assert.equal(emails.length, 0);
        assert.equal((await banco.query("SELECT * FROM tbrecuperacao_senha")).rowCount, 0);
    });
    await t.test("limites atômicos por conta e IP", async () => {
        await preparar();
        const model = require("../src/models/recuperacaoModel");
        const simultaneos = await Promise.all([
            model.reservarLimite("conta-minuto", "teste", 1, 60),
            model.reservarLimite("conta-minuto", "teste", 1, 60),
        ]);
        assert.deepEqual(simultaneos.sort(), [false, true]);
        for (let i = 0; i < 10; i++) assert.equal((await solicitar(String(i).padStart(11, "0"))).status, 202);
        assert.equal((await solicitar("99999999999")).status, 429);
        await preparar();
        for (let i = 0; i < 5; i++) {
            assert.equal((await solicitar()).status, 202);
            await banco.query("UPDATE tblimite_recuperacao SET reinicia_em = clock_timestamp() - INTERVAL '1 second' WHERE chave = $1", [codigoService.protegerLimite("conta-minuto", "52998224725")]);
        }
        assert.equal((await solicitar()).status, 429);
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
            assert.equal(emails.length, 12);
            assert.equal((await banco.query("SELECT * FROM tblimite_recuperacao")).rowCount, 0);
        } finally { process.env.RECUPERACAO_SOLICITACOES_LIVRES = "false"; }
    });
    await t.test("erro ao consumir código faz rollback também da nova senha", async () => {
        await preparar(); const pedido = await solicitar();
        await banco.query("ALTER TABLE tbrecuperacao_senha ADD CONSTRAINT teste_impedir_consumo CHECK (consumida_em IS NULL)");
        try {
            assert.equal((await trocar(pedido.corpo.solicitacaoId, emails[0].codigo)).status, 503);
            assert.equal((await lerConta()).senha_hash, hashOriginal);
            assert.equal((await lerConta()).versao_sessao, 0);
        } finally { await banco.query("ALTER TABLE tbrecuperacao_senha DROP CONSTRAINT teste_impedir_consumo"); }
        assert.equal((await trocar(pedido.corpo.solicitacaoId, emails[0].codigo)).status, 200);
    });
});
