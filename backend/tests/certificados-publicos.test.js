const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
process.env.NODE_ENV = "test";

const pool = require("../src/config/db");
const app = require("../src/app");

test("consulta pública valida código sem login e não expõe dados pessoais", async (t) => {
    const codigoValido = "a".repeat(64);
    const dataEmissao = new Date("2026-11-16T12:00:00.000Z");
    const consultaOriginal = pool.query;
    let consultas = 0;
    pool.query = async (sql, parametros) => {
        consultas++;
        assert.match(sql, /FROM tbcertificado WHERE codigo_validacao=\$1/);
        assert.deepEqual(parametros, [parametros[0], 65]);
        return { rows: parametros[0] === codigoValido ? [{
            nome_completo_emitido: "Maria Silva",
            nota_final_emitida: "75.00",
            percentual_acertos_emitido: "75.00",
            data_hora_emissao: dataEmissao,
        }] : [] };
    };

    const servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    t.after(async () => {
        pool.query = consultaOriginal;
        await new Promise(resolve => servidor.close(resolve));
        await pool.end();
    });

    const base = `http://127.0.0.1:${servidor.address().port}`;
    const pagina = await fetch(`${base}/pages/consultar-certificado.html`, { redirect: "manual" });
    assert.equal(pagina.status, 200);
    const html = await pagina.text();
    assert.match(html, /consulta-certificado\.js/);
    assert.doesNotMatch(html, /sessao-estudos\.js/);
    assert.match(html, /id="status-certificado">Autenticidade confirmada</);

    async function validar(codigo) {
        return fetch(`${base}/api/certificados/validar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo }),
        });
    }

    const invalido = await validar("nao-e-um-codigo");
    assert.equal(invalido.status, 404);
    assert.equal(consultas, 0);

    const resposta = await validar(codigoValido);
    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get("cache-control"), "no-store");
    assert.deepEqual(await resposta.json(), {
        valido: true,
        certificado: {
            nome: "Maria Silva",
            nota_final: 75,
            percentual_acertos: 75,
            data_hora_emissao: dataEmissao.toISOString(),
        },
    });

    const naoEncontrado = await validar("b".repeat(64));
    assert.equal(naoEncontrado.status, 404);
    assert.equal(consultas, 2);
});