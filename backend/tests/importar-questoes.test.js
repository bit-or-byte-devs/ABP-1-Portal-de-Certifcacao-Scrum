const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { carregar, importar } = require('../scripts/importar-questoes');
test('PDFs: 16 questões e gabaritos revisados', () => {
    const q = carregar();
    assert.equal(q.length, 16);
    assert.equal(new Set(q.map(x => x.codigo)).size, 16);
    assert.deepEqual([1,2,3,4].map(tema => q.filter(x => x.tema === tema).map(x => x.alternativas.find(a => a.correta).letra).join('')), ['BCAD','CABD','BACD','CBAD']);
    assert.equal(q.filter(x => x.imagem !== null).length, 12);
    assert.ok(q.every(x => x.justificativa.length > 0));
});
test('validação rejeita gabarito inválido, códigos duplicados e imagem ausente', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'questoes-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const dados = JSON.parse(fs.readFileSync(path.join(__dirname, '../../database/questoes/tema-01.json')));
    function validar(d) { fs.writeFileSync(path.join(dir, 'tema.json'), JSON.stringify(d)); return () => carregar(dir); }
    const errado = structuredClone(dados); errado.questoes[0].alternativas[0].correta = true;
    assert.throws(validar(errado), /Alternativas inválidas/);
    const duplicado = structuredClone(dados); duplicado.questoes.push(duplicado.questoes[0]);
    assert.throws(validar(duplicado), /duplicada/);
    const imagem = structuredClone(dados); imagem.questoes[0].imagem = { caminho: '/imagens/inexistente.png', alt: 'Teste' };
    assert.throws(validar(imagem), /Imagem ausente/);
});
test('carga usa IDs reais, não duplica e reverte uma falha integralmente', async () => {
    let registros = new Map(); let snapshot; let alternativas = 0; let snapshotAlternativas;
    const db = { async query(sql,p) {
        if (sql === 'BEGIN') { snapshot = new Map(registros); snapshotAlternativas = alternativas; return {}; }
        if (sql === 'ROLLBACK') { registros = snapshot; alternativas = snapshotAlternativas; return {}; }
        if (sql === 'COMMIT' || sql.includes('pg_advisory')) return {};
        if (sql.includes('SELECT hash_origem')) return { rows: registros.has(p[0]) ? [{ hash_origem: registros.get(p[0]) }] : [] };
        if (sql.includes('SELECT id FROM tbtema')) return { rows: [{ id: 100+p[0] }] };
        if (sql.includes('INSERT INTO tbquestao')) { assert.ok(p[0] > 100); assert.equal(p[1], null); registros.set(p[4],p[5]); return { rows: [{ id: registros.size }] }; }
        if (sql.includes('INSERT INTO tbalternativa')) { alternativas++; return {}; }
        throw new Error('SQL inesperado');
    }};
    const crypto = require('node:crypto');
    const q = carregar().map(({ hash, ...x }) => {
        x.imagem = null;
        return { ...x, hash: crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex') };
    });
    assert.deepEqual(await importar(db,q), { inseridas: 16, existentes: 0 });
    assert.equal(alternativas,64);
    assert.deepEqual(await importar(db,q), { inseridas: 0, existentes: 16 });
    assert.equal(alternativas,64);
    await assert.rejects(importar(db,[{ ...q[0], codigo: 'nova', hash: 'nova' },{ ...q[1], hash: 'alterado' }]), /Conteúdo alterado/);
    assert.equal(registros.size,16); assert.equal(alternativas,64);
});

test('vinculação adiciona somente a imagem e rejeita substituição ou alteração de texto', async () => {
    const crypto = require('node:crypto');
    const q = carregar()[0];
    const { hash, ...conteudo } = q;
    const hashSemImagem = crypto.createHash('sha256').update(JSON.stringify({ ...conteudo, imagem: null })).digest('hex');
    let hashAtual = hashSemImagem, idimagem = null, inseridas = 0, rollback = false;
    const db = { async query(sql,p) {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql.includes('pg_advisory')) return {};
        if (sql === 'ROLLBACK') { rollback = true; return {}; }
        if (sql.includes('SELECT hash_origem')) return { rows: [{ hash_origem: hashAtual }] };
        if (sql.includes('SELECT id, idimagem')) return { rows: [{ id: 123, idimagem }] };
        if (sql.includes('INSERT INTO tbimagem')) { assert.equal(p[0],q.imagem.caminho); inseridas++; return { rows: [{ id: 456 }] }; }
        if (sql.includes('UPDATE tbquestao')) { assert.deepEqual(p,[456,q.hash,123]); idimagem=p[0]; hashAtual=p[1]; return {}; }
        throw new Error('A vinculação não deve alterar questões, alternativas ou respostas: '+sql);
    }};
    await assert.rejects(importar(db,[q]), /Conteúdo alterado/);
    assert.equal(inseridas,0);
    assert.deepEqual(await importar(db,[q],{ vincularImagens: true }), { inseridas: 0, existentes: 1, imagensVinculadas: 1 });
    assert.deepEqual(await importar(db,[q],{ vincularImagens: true }), { inseridas: 0, existentes: 1, imagensVinculadas: 0 });
    assert.equal(inseridas,1);
    hashAtual=hashSemImagem; idimagem=999;
    await assert.rejects(importar(db,[q],{ vincularImagens: true }), /já possui outra imagem/);
    assert.ok(rollback);
    hashAtual='conteudo-diferente'; idimagem=null;
    await assert.rejects(importar(db,[q],{ vincularImagens: true }), /Conteúdo alterado/);
    assert.equal(inseridas,1);
});
