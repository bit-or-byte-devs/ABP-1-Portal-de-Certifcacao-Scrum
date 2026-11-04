const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { preparar } = require('../scripts/preparar-banco');

const script = path.join(__dirname, '../scripts/preparar-banco.js');

test('modo de validação funciona sem conexão nem dependências de PostgreSQL', () => {
    const resultado = spawnSync(process.execPath, [script, '--validar'], {
        encoding: 'utf8', env: { ...process.env, DB_HOST: 'banco-inexistente.invalid' },
    });
    assert.equal(resultado.status, 0, resultado.stderr);
    assert.match(resultado.stdout, /12 temas, 70 seções e \d+ questões/);
    assert.match(resultado.stdout, /Banco não acessado/);
});

test('argumento desconhecido falha antes de conectar ao banco', () => {
    const resultado = spawnSync(process.execPath, [script, '--desconhecido'], { encoding: 'utf8' });
    assert.equal(resultado.status, 1);
    assert.match(resultado.stderr, /Use --validar/);
});

function bancoSimulado(t, consultar) {
    let liberado = false;
    const chamadas = [];
    const db = {
        async query(sql, parametros) {
            chamadas.push(sql);
            if (sql === 'ROLLBACK') return { rows: [] };
            return consultar(sql, parametros);
        },
        release() { liberado = true; },
    };
    t.after(() => assert.equal(liberado, true, 'a conexão deve ser liberada'));
    return { pool: { async connect() { return db; } }, chamadas };
}
const opcoes = { log() {} };

test('estrutura incompleta interrompe a preparação antes das migrações', async t => {
    const { pool, chamadas } = bancoSimulado(t, (sql, parametros) => {
        assert.match(sql, /to_regclass/);
        assert.ok(parametros[0].includes('tbtema'));
        return { rows: [{ nome: 'tbtema' }] };
    });
    await assert.rejects(preparar(pool, opcoes), /Tabelas ausentes: tbtema/);
    assert.equal(chamadas.length, 2);
});

test('falha em uma migração impede as próximas migrações e as importações', async t => {
    const { pool, chamadas } = bancoSimulado(t, sql => {
        if (sql.includes('to_regclass')) return { rows: [] };
        if (sql.includes('versao_sessao')) return { rows: [] };
        if (sql.includes('CREATE TABLE IF NOT EXISTS tbprogresso_estudo'))
            throw new Error('erro simulado');
        assert.fail('A preparação continuou após a falha: ' + sql);
    });
    await assert.rejects(preparar(pool, opcoes), /002_progresso_estudos.sql: erro simulado/);
    assert.equal(chamadas.at(-1), 'ROLLBACK');
    assert.equal(chamadas.length, 4);
});

test('falha nos temas impede a importação das questões', async t => {
    const { pool, chamadas } = bancoSimulado(t, sql => {
        if (sql.includes('INSERT INTO tbtema')) throw new Error('falha nos temas');
        return { rows: [] };
    });
    await assert.rejects(preparar(pool, opcoes), /importação dos temas: falha nos temas/);
    assert.equal(chamadas.some(sql => sql.includes('FROM tbquestao')), false);
    assert.equal(chamadas.some(sql => sql.includes('INSERT INTO tbquestao')), false);
    assert.match(chamadas[1], /versao_sessao/);
    assert.match(chamadas[2], /subtitulos INTEGER/);
    assert.match(chamadas[3], /ALTER TABLE tbquestao/);
    assert.match(chamadas[4], /ADD COLUMN IF NOT EXISTS conteudo JSONB/);
});
