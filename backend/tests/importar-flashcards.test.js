const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { carregar } = require('../scripts/importar-flashcards');

const catalogo = path.join(__dirname, '../../database/flashcards');
const script = path.join(__dirname, '../scripts/importar-flashcards.js');

test('catálogo atual: 10 cartões por arquivo, códigos únicos e hash SHA-256', () => {
    const cartoes = carregar();
    const temas = [...new Set(cartoes.map(cartao => cartao.tema))];
    assert.ok(temas.length >= 1 && temas.length <= 12);
    for (const tema of temas) assert.equal(cartoes.filter(cartao => cartao.tema === tema).length, 10);
    assert.equal(new Set(cartoes.map(cartao => cartao.codigo)).size, cartoes.length);
    assert.ok(cartoes.every(cartao => /^[a-f0-9]{64}$/.test(cartao.hash)));
});

test('validação rejeita código, prefixo, duplicidade, campo vazio, quantidade e imagem inválidos', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashcards-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const original = JSON.parse(fs.readFileSync(path.join(catalogo, 'tema-01.json'), 'utf8'));
    function validar(alterar) {
        const dados = structuredClone(original);
        alterar(dados);
        fs.writeFileSync(path.join(dir, 'tema-01.json'), JSON.stringify(dados));
        return () => carregar(dir);
    }
    assert.doesNotThrow(validar(() => {}));
    assert.throws(validar(d => { d.flashcards[0].codigo = 'tema-01-q01'; }), /Código fora do padrão/);
    assert.throws(validar(d => { d.flashcards[0].codigo = 'tema-01-fc1'; }), /Código fora do padrão/);
    assert.throws(validar(d => { d.flashcards[0].codigo = 'tema-02-fc01'; }), /Código fora do padrão/);
    assert.throws(validar(d => { d.flashcards[1].codigo = d.flashcards[0].codigo; }), /duplicado/);
    for (const campo of ['frente', 'verso', 'explicacao', 'fonte'])
        assert.throws(validar(d => { d.flashcards[0][campo] = '   '; }), new RegExp(`Campo ${campo} vazio`));
    assert.throws(validar(d => { d.flashcards.pop(); }), /exatamente 10 flashcards \(tem 9\)/);
    assert.throws(validar(d => { d.flashcards.push({ ...d.flashcards[0], codigo: 'tema-01-fc11' }); }), /exatamente 10/);
    assert.throws(validar(d => { d.tema = 13; }), /Arquivo inválido/);
    assert.throws(validar(d => { d.flashcards[0].imagem = { caminho: '/imagens/../backend/server.js', alt: 'x' }; }), /fora de imagens/);
    assert.throws(validar(d => { d.flashcards[0].imagem = { caminho: '/imagens/inexistente.png', alt: 'x' }; }), /Imagem ausente/);
    assert.throws(validar(d => { d.flashcards[0].imagem = { caminho: '/imagens/logo.png' }; }), /Imagem inválida/);
    // Sufixo de versão é aceito.
    assert.doesNotThrow(validar(d => { d.flashcards[0].codigo = 'tema-01-fc01-v2'; }));
});

test('duplicidade é global entre arquivos e --exigir-todos cobra os 12 temas', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashcards-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const um = JSON.parse(fs.readFileSync(path.join(catalogo, 'tema-01.json'), 'utf8'));
    fs.writeFileSync(path.join(dir, 'tema-01.json'), JSON.stringify(um));
    fs.writeFileSync(path.join(dir, 'tema-01-copia.json'), JSON.stringify(um));
    assert.throws(() => carregar(dir), /Tema 1 repetido/);
    fs.rmSync(path.join(dir, 'tema-01-copia.json'));
    assert.equal(carregar(dir).length, 10);
    assert.throws(() => carregar(dir, { exigirTodos: true }), /Faltam flashcards dos temas: 2, 3, 4/);
});

test('hash ignora espaços nas pontas e muda quando o conteúdo muda', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashcards-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const dados = JSON.parse(fs.readFileSync(path.join(catalogo, 'tema-01.json'), 'utf8'));
    const referencia = carregar(catalogo).find(cartao => cartao.codigo === 'tema-01-fc01').hash;
    dados.flashcards[0].frente = `  ${dados.flashcards[0].frente}  `;
    fs.writeFileSync(path.join(dir, 'tema-01.json'), JSON.stringify(dados));
    assert.equal(carregar(dir)[0].hash, referencia);
    dados.flashcards[0].verso += ' Alterado.';
    fs.writeFileSync(path.join(dir, 'tema-01.json'), JSON.stringify(dados));
    assert.notEqual(carregar(dir)[0].hash, referencia);
});

test('CLI valida sem acessar o banco e recusa argumento desconhecido', () => {
    const valido = spawnSync(process.execPath, [script, '--validar'], {
        encoding: 'utf8', env: { ...process.env, DB_HOST: 'banco-inexistente.invalid' },
    });
    assert.equal(valido.status, 0, valido.stderr);
    assert.match(valido.stdout, /\d+ flashcards validados; banco não modificado/);
    const invalido = spawnSync(process.execPath, [script, '--desconhecido'], { encoding: 'utf8' });
    assert.equal(invalido.status, 1);
    assert.match(invalido.stderr, /Use --validar/);
});
