const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function mostrarResultado(busca, proximoTema, situacao = 'respondida') {
    const elementos = new Map();
    function elemento(id) {
        if (!elementos.has(id)) elementos.set(id, {
            hidden: true, disabled: false, textContent: '', href: '',
            classList: { add() {}, remove() {} },
            addEventListener() {}, append() {}, remove() {},
            querySelectorAll() { return []; },
        });
        return elementos.get(id);
    }
    const avisos = [], chamadas = [];
    const questao = { id: 42, nome: 'Tema', enunciado: 'Questão', imagem: null,
        alternativas: [], situacao, acertou: situacao === 'respondida',
        alternativa_correta: { id: 1, letra: 'A', texto: 'Correta' },
        justificativa: '', proximo_tema: proximoTema };
    const contexto = {
        URLSearchParams, location: { search: busca },
        document: { getElementById: elemento, querySelector: elemento },
        window: { addEventListener() {} },
        cronometro: { parar() {}, iniciar() { assert.fail('Não deve iniciar cronômetro em questão encerrada'); } },
        clearTimeout() {},
        portal: { pedir: async (url) => { chamadas.push(url); return questao; }, avisar: m => avisos.push(m) },
    };
    await vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../frontend/js/exame.js'), 'utf8'), contexto);
    assert.deepEqual(avisos, []);
    return { link: elemento('link-continuar'), chamadas };
}

for (const situacao of ['respondida', 'tempo_esgotado', 'interrompida']) {
    test('Navegação: tema 12 oferece tema 1 após ' + situacao, async () => {
        const { link } = await mostrarResultado('?tema=12', 1, situacao);
        assert.equal(link.hidden, false);
        assert.equal(link.textContent, 'Próximo tema');
        assert.equal(link.href, 'exame.html?tema=1');
    });
}

test('Navegação: tema 4 oferece tema 6 indicado pela API', async () => {
    const { link } = await mostrarResultado('?tema=4', 6);
    assert.equal(link.hidden, false);
    assert.equal(link.textContent, 'Próximo tema');
    assert.equal(link.href, 'exame.html?tema=6');
});

for (const tema of [6, 12]) {
    test('Navegação: último tema pendente ' + tema + ' oferece retorno à lista', async () => {
        const { link } = await mostrarResultado('?tema=' + tema, null);
        assert.equal(link.hidden, false);
        assert.equal(link.textContent, 'Voltar à lista');
        assert.equal(link.href, 'exames.html');
    });
}

test('Navegação: revisão continua retornando aos exames sem iniciar tentativa', async () => {
    const { link, chamadas } = await mostrarResultado('?resposta=42', 1);
    assert.equal(link.hidden, false);
    assert.equal(link.textContent, 'Voltar aos exames');
    assert.equal(link.href, 'exames.html');
    assert.deepEqual(chamadas, ['/api/exames/respostas/42']);
});
