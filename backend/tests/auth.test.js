const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";
const pool = require("../src/config/db");
const { gerarHash, verificarSenha } = require("../src/services/senha");
const app = require("../src/app");

test("login, sessão, proteção e saída sem modificar o banco", async (t) => {
    const senhaHash = await gerarHash("Senha123");
    assert.equal(await verificarSenha("Senha123", senhaHash), true);
    assert.equal(await verificarSenha("Errada123", senhaHash), false);
    for (const hash of [null, "texto", "scrypt$xx$xx", senhaHash + "$extra"]) {
        assert.equal(await verificarSenha("Senha123", hash), false);
    }
    const queryOriginal = pool.query;
    let falharBanco = false;
    let removido = false;
    // Simula apenas a resposta do banco; o Express e a sessão são reais.
    pool.query = async (sql, parametros) => {
        if (falharBanco) throw new Error("Banco indisponível");
        if (sql.includes("INSERT INTO tbcandidato")) {
            assert.match(sql, /RETURNING .*versao_sessao/);
            assert.equal(parametros[0], "52998224725");
            assert.equal(await verificarSenha("Senha123", parametros[3]), true);
            return { rows: [{ id: 7, versao_sessao: 0 }] };
        }
        assert.match(sql, /WHERE (cpf|id) = \$1/);
        assert.equal(parametros.length, 1);
        if (sql.includes("WHERE cpf")) {
            return { rows: parametros[0] === "52998224725" ? [{ id: 7, senha_hash: senhaHash, versao_sessao: 0 }] : [] };
        }
        assert.equal(parametros[0], 7);
        return { rows: removido ? [] : [{ id: 7, nome: "Maria Silva", versao_sessao: 0 }] };
    };
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    t.after(async () => {
        pool.query = queryOriginal;
        await new Promise(resolve => servidor.close(resolve));
        await pool.end();
    });
    const base = "http://127.0.0.1:" + servidor.address().port;
    async function pedir(url, opcoes = {}) {
        return fetch(base + url, { redirect: "manual", ...opcoes });
    }
    async function entrar(cpf, senha, cookie) {
        return pedir("/api/auth/login", { method: "POST", headers: {
            "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}),
        }, body: JSON.stringify({ cpf, senha }) });
    }
    for (const url of ["/pages/menu.html", "/pages/MENU.html", "/pages/%6denu.html", "/pages//menu.html", "/pages/menu.html/", "/pages/menu.html."]) {
        const resposta = await pedir(url);
        assert.equal(resposta.status, 302, url);
    }
    assert.equal((await pedir("/api/auth/usuario")).status, 401);
    assert.equal((await pedir("/pages/login.html")).status, 200);
    assert.equal((await pedir("/api/auth/login", { method: "POST" })).status, 415);
    for (const [cpf, senha] of [["52998224725", "Errada123"], ["11144477735", "Senha123"], ["' OR 1=1", "Senha123"]]) {
        const resposta = await entrar(cpf, senha);
        assert.equal(resposta.status, 401);
        assert.deepEqual(await resposta.json(), { mensagem: "CPF ou senha incorretos" });
        assert.equal(resposta.headers.get("set-cookie"), null);
    }
    let resposta = await pedir("/api/candidatos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "Maria Silva", cpf: "52998224725", email: "maria@example.com", senha: "Senha123", aceiteTermos: true }),
    });
    assert.equal(resposta.status, 201);
    const cookieCadastro = resposta.headers.get("set-cookie").split(";")[0];
    resposta = await pedir("/api/auth/usuario", { headers: { Cookie: cookieCadastro } });
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), { id: 7, nome: "Maria Silva" });
    for (const url of ["/pages/menu.html", "/pages/temas.html"]) {
        assert.equal((await pedir(url, { headers: { Cookie: cookieCadastro } })).status, 200);
    }
    resposta = await entrar("529.982.247-25", "Senha123");
    assert.equal(resposta.status, 200);
    const cabecalho = resposta.headers.get("set-cookie");
    assert.match(cabecalho, /HttpOnly/); assert.match(cabecalho, /SameSite=Lax/);
    let cookie = cabecalho.split(";")[0];
    assert.deepEqual(await resposta.json(), { mensagem: "Login realizado com sucesso." });
    resposta = await pedir("/api/auth/usuario", { headers: { Cookie: cookie } });
    assert.deepEqual(await resposta.json(), { id: 7, nome: "Maria Silva" });
    assert.equal(resposta.headers.get("cache-control"), "no-store");
    for (let i = 0; i < 2; i++) {
        resposta = await pedir("/pages/menu.html", { headers: { Cookie: cookie } });
        assert.equal(resposta.status, 200);
        assert.match(await resposta.text(), /href="temas\.html"/);
    }
    const anterior = cookie;
    resposta = await entrar("52998224725", "Senha123", cookie);
    cookie = resposta.headers.get("set-cookie").split(";")[0];
    assert.notEqual(cookie, anterior);
    assert.equal((await pedir("/api/auth/usuario", { headers: { Cookie: anterior } })).status, 401);
    falharBanco = true;
    resposta = await entrar("52998224725", "Senha123");
    assert.equal(resposta.status, 500);
    assert.doesNotMatch(await resposta.text(), /Banco indisponível|senha_hash/);
    falharBanco = false;
    resposta = await pedir("/api/auth/logout", { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: "{}" });
    assert.equal(resposta.status, 200);
    assert.match(resposta.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
    assert.equal((await pedir("/api/auth/usuario", { headers: { Cookie: cookie } })).status, 401);
    assert.equal((await pedir("/pages/menu.html", { headers: { Cookie: cookie } })).status, 302);
    resposta = await entrar("52998224725", "Senha123");
    cookie = resposta.headers.get("set-cookie").split(";")[0];
    removido = true;
    assert.equal((await pedir("/api/auth/usuario", { headers: { Cookie: cookie } })).status, 401);
});
