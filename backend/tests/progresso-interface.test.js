const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function elemento() {
    const listeners = {};
    return { disabled: false, hidden: false, textContent: '', listeners,
        addEventListener(nome, fn) { (listeners[nome] ??= []).push(fn); },
        clicar() { for (const fn of listeners.click ?? []) fn({ stopPropagation() {} }); } };
}
function montar() {
    const eventos = {};
    const cards = Array.from({ length: 12 }, (_, i) => {
        const partes = { '.btn-iniciar': elemento(), '.progress-badge .green-text': elemento(), h3: elemento() };
        return { dataset: { id: String(i + 1) }, querySelector: s => partes[s] };
    });
    const continuar = elemento(), mensagem = elemento(), avisos = [], requisicoes = [];
    const contexto = {
        document: {
            querySelectorAll: () => cards,
            getElementById: id => id === 'btn-continuar-certificacao' ? continuar : mensagem,
            addEventListener: (nome, fn) => { eventos[nome] = fn; },
        },
        window: { addEventListener: (nome, fn) => { eventos[nome] = fn; } },
        location: { href: '' }, confirm: () => true,
        portal: { avisar: m => avisos.push(m), pedir: () => new Promise((resolve, reject) => requisicoes.push({ resolve, reject })) },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../frontend/js/exames.js'), 'utf8'), contexto);
    eventos.DOMContentLoaded();
    return { ...contexto, cards, continuar, mensagem, avisos, requisicoes, eventos };
}
function progresso(estados = {}, proximo = 1) {
    return { temas: Array.from({ length: 12 }, (_, i) => ({ ordem: i + 1, nome: 'Tema ' + (i + 1), estado: estados[i + 1] ?? 'pendente' })),
        proximo_tema: proximo, certificacao_concluida: proximo === null, total_acertos: 1, percentual_acertos: 8.33, aprovado: false };
}
const concluir = async () => { await Promise.resolve(); await Promise.resolve(); };

test('US24: consulta inicial única e botões bloqueados enquanto aguarda a API', async () => {
    const p = montar();
    p.eventos.pageshow({ persisted: false });
    assert.equal(p.requisicoes.length, 1);
    assert.ok(p.cards.every(c => c.querySelector('.btn-iniciar').disabled));
    assert.equal(p.continuar.disabled, true);
    p.requisicoes[0].resolve(progresso());
    await concluir();
    assert.equal(p.cards[0].querySelector('.btn-iniciar').disabled, false);
});

test('US24: restauração atualiza estados e continuar sem acumular listeners', async () => {
    const p = montar();
    p.requisicoes[0].resolve(progresso()); await concluir();
    p.eventos.pagehide();
    p.eventos.pageshow({ persisted: true });
    assert.equal(p.continuar.disabled, true);
    p.requisicoes[1].resolve(progresso({ 1: 'concluido' }, 2)); await concluir();
    assert.equal(p.cards[0].querySelector('.btn-iniciar').disabled, true);
    assert.equal(p.cards[0].querySelector('.progress-badge .green-text').textContent, '100%');
    p.continuar.clicar();
    assert.equal(p.location.href, 'exame.html?tema=2');
    assert.equal(p.continuar.listeners.click.length, 1);
    assert.ok(p.cards.every(c => c.querySelector('.btn-iniciar').listeners.click.length === 1));
});

test('US24: consulta antiga não sobrescreve progresso restaurado', async () => {
    const p = montar();
    p.eventos.pagehide(); p.eventos.pageshow({ persisted: true });
    p.requisicoes[1].resolve(progresso({ 1: 'concluido' }, 2)); await concluir();
    p.requisicoes[0].resolve(progresso()); await concluir();
    assert.equal(p.cards[0].querySelector('.btn-iniciar').disabled, true);
    p.continuar.clicar();
    assert.equal(p.location.href, 'exame.html?tema=2');
});

test('US24: falha ao retornar bloqueia ações e nova restauração permite recuperar', async () => {
    const p = montar();
    p.requisicoes[0].resolve(progresso()); await concluir();
    p.eventos.pagehide(); p.eventos.pageshow({ persisted: true });
    p.requisicoes[1].reject(new Error('Sem conexão')); await concluir();
    assert.ok(p.cards.every(c => c.querySelector('.btn-iniciar').disabled));
    assert.equal(p.continuar.hidden, true);
    p.continuar.clicar(); assert.equal(p.location.href, '');
    assert.deepEqual(p.avisos, ['Sem conexão']);
    p.eventos.pageshow({ persisted: true });
    p.requisicoes[2].resolve(progresso()); await concluir();
    assert.equal(p.continuar.disabled, false);
});

test('US24: certificação concluída bloqueia todos os temas e oculta continuar', async () => {
    const p = montar();
    p.requisicoes[0].resolve(progresso(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'concluido'])), null));
    await concluir();
    assert.ok(p.cards.every(c => c.querySelector('.btn-iniciar').disabled));
    assert.equal(p.continuar.hidden, true);
    assert.match(p.mensagem.textContent, /Certificação concluída/);
});
