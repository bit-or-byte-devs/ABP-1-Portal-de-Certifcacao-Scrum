const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.join(__dirname, "../..");
const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), "utf8");

test("páginas legais são públicas, navegáveis e ligadas ao cadastro", () => {
    const privacidade = ler("frontend/pages/privacidade.html");
    const termos = ler("frontend/pages/termos.html");
    const cadastro = ler("frontend/pages/cadastro.html");
    const app = ler("backend/src/app.js");

    assert.match(privacidade, /<html lang="pt-BR">/);
    assert.match(privacidade, /<h1>Privacidade e LGPD<\/h1>/);
    assert.match(privacidade, /Quais dados utilizamos/);
    assert.match(privacidade, /Seus direitos pela LGPD/);
    assert.match(privacidade, /href="termos\.html"/);

    assert.match(termos, /<html lang="pt-BR">/);
    assert.match(termos, /<h1>Termos de Uso<\/h1>/);
    assert.match(termos, /Uso permitido e condutas proibidas/);
    assert.match(termos, /href="privacidade\.html"/);

    assert.match(cadastro, /href="termos\.html" target="_blank" rel="noopener"/);
    assert.match(cadastro, /href="privacidade\.html" target="_blank" rel="noopener"/);
    assert.doesNotMatch(app, /paginasPrivadas[^;]+(?:privacidade|termos)\.html/);
});
