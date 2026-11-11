const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.SESSION_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
const pool = require('../src/config/db');
const app = require('../src/app');
test('progresso por conta, sessão, material e validação dos exames', async t => {
    const hash = await require('../src/services/senha').gerarHash('Senha123');
    const original = pool.query;
    const progresso = new Map();
    let falhar = false;
    pool.query = async (sql, p = []) => {
        if (sql.includes('WHERE cpf')) return { rows: [{ id: p[0] === '52998224725' ? 1 : 2, senha_hash: hash, versao_sessao: 0 }] };
        if (sql.includes('FROM tbcandidato WHERE id')) return { rows: [{ id: p[0], nome: 'Pessoa', versao_sessao: 0 }] };
        if (falhar) throw new Error('segredo do banco');
        if (sql.includes('LEFT JOIN tbprogresso')) return { rows: [{ id: 50, ordem: 5, nome: 'Eventos',
            descricao: 'Eventos do Scrum', vistos: progresso.get(p[0]) || [],
            codigos: ['tema-05-s01', 'tema-05-s02', 'tema-05-s03'] }] };
        if (sql.includes('COALESCE(array_agg(m.codigo_origem')) return { rows: [{ id: 50,
            codigos: ['tema-05-s01', 'tema-05-s02', 'tema-05-s03'] }] };
        if (sql.includes('INSERT INTO tbprogresso')) {
            assert.equal(p[1], 50);
            progresso.set(p[0], [...new Set([...(progresso.get(p[0]) || []), ...p[2]])]);
            return { rows: [{ secoes: progresso.get(p[0]) }] };
        }
        if (sql.includes('FROM tbtema WHERE ordem')) return { rows: [{ id: 50, ordem: 5, nome: 'Eventos', descricao: 'Eventos do Scrum' }] };
        if (sql.includes('codigo_origem AS codigo')) return { rows: [
            { codigo: 'tema-05-introducao', titulo: 'Introdução', tipo: 'introducao', ordem: 0, nivel: null,
                conteudo: [{ tipo: 'paragrafo', conteudo: 'Sprint e eventos.' }] },
            { codigo: 'tema-05-s01', titulo: 'Sprint', tipo: 'secao', ordem: 1, nivel: 3,
                conteudo: [{ tipo: 'paragrafo', conteudo: 'Conteúdo.' }] },
            { codigo: 'tema-05-s02', titulo: 'Daily Scrum', tipo: 'secao', ordem: 2, nivel: 3, conteudo: [] },
            { codigo: 'tema-05-s03', titulo: 'Review', tipo: 'secao', ordem: 3, nivel: 3, conteudo: [] },
        ] };
        throw new Error('SQL inesperado');
    };
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(async () => { pool.query = original; await new Promise(resolve => server.close(resolve)); await pool.end(); });
    const pedir = (url, cookie, method = 'GET', body) => fetch('http://127.0.0.1:' + server.address().port + url, { redirect: 'manual', method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    for (const pagina of ['temas', 'estudos', 'exames', 'exame', 'perfil']) assert.equal((await pedir('/pages/' + pagina + '.html')).status, 302);
    assert.equal((await pedir('/api/estudos')).status, 401);
    assert.equal((await pedir('/api/exames/5/iniciar', null, 'POST', {})).status, 401);
    async function login(cpf) { return (await pedir('/api/auth/login', null, 'POST', { cpf, senha: 'Senha123' })).headers.get('set-cookie').split(';')[0]; }
    const um = await login('52998224725'); const dois = await login('11144477735');
    let r = await pedir('/api/estudos/5', um); assert.equal(r.status, 200);
    const material = await r.json(); assert.equal(material.secoes[0].titulo, 'Sprint');
    await pedir('/api/estudos/5/progresso', um, 'PUT', { vistos: ['tema-05-s01', 'tema-05-s02'] });
    await pedir('/api/estudos/5/progresso', um, 'PUT', { vistos: ['tema-05-s02', 'tema-05-s03'] });
    assert.deepEqual((await (await pedir('/api/estudos', um)).json())[0].vistos,
        ['tema-05-s01', 'tema-05-s02', 'tema-05-s03']);
    assert.deepEqual((await (await pedir('/api/estudos', dois)).json())[0].vistos, []);
    for (const vistos of [['tema-05-s99'], ['tema-04-s01'], [0], null])
        assert.equal((await pedir('/api/estudos/5/progresso', um, 'PUT', { vistos })).status, 400);
    assert.equal((await pedir('/api/estudos/13', um)).status, 400);
    assert.equal((await pedir('/api/exames/13/iniciar', um, 'POST', {})).status, 400);
    assert.equal((await pedir('/api/exames/respostas/70', um, 'POST', { alternativa: '90' })).status, 400);
    const conectarOriginal = pool.connect;
    let respondida = false;
    let semQuestao = false;
    let rollbacks = 0;
    let liberacoes = 0;
    pool.connect = async () => ({
        release() { liberacoes++; },
        async query(sql, p = []) {
            if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
            if (sql === 'ROLLBACK') { rollbacks++; return { rows: [] }; }
            if (sql.includes('INSERT INTO tbcertificacao')) return { rows: [{ id: 9 }] };
            if (sql.includes("ELSE 'interrompida'")) return { rows: [], rowCount: 0 };
            // Tema ainda não sorteado nesta certificação.
            if (sql.includes('SELECT situacao FROM tbresposta')) return { rows: [] };
            if (sql.includes('WITH certificacoes AS MATERIALIZED')) return { rows: [] };
            if (sql.includes('SELECT id FROM tbcertificacao')) return { rows: [{ id: 9 }] };
            if (sql.includes('SELECT t.ordem')) return { rows: [{ ordem: 6 }] };
            if (sql.includes('FROM tbtema')) return { rows: [{ id: 50, nome: 'Eventos' }] };
            if (sql.includes('INSERT INTO tbresposta')) return { rows: [] };
            if (sql.includes('SELECT id FROM tbresposta')) return { rows: semQuestao ? [] : [{ id: 70 }] };
            if (sql.includes('FROM tbresposta r JOIN tbtema')) return { rows: [{
                id: 70, questao: 80, idcertificacao: 9, ordem: 5,
                situacao: respondida ? 'respondida' : 'em_andamento',
                acertou: respondida ? true : null, justificativa: respondida ? 'Explicação' : null,
                segundos_restantes: 150,
            }] };
            if (sql.includes('SELECT id, letra, texto')) {
                if (!respondida) assert.doesNotMatch(sql, /correta/);
                return { rows: [{ id: 90, letra: 'A', texto: 'Opção' }] };
            }
            if (sql.includes('FOR UPDATE OF c')) return { rows: p[1] === 1 ? [{ id: 9 }] : [] };
            if (sql.includes('UPDATE tbresposta')) {
                if (respondida || p[1] !== 90) return { rows: [] };
                respondida = true; return { rows: [{ acertou: true, idquestao: 80 }] };
            }
            if (sql.includes('UPDATE tbcertificacao')) return { rows: [] };
            if (sql.includes('SELECT justificativa')) return { rows: [{ justificativa: 'Explicação' }] };
            throw new Error('SQL inesperado na transação');
        }
    });
    t.after(() => { pool.connect = conectarOriginal; });
    r = await pedir('/api/exames/5/iniciar', um, 'POST', {}); assert.equal(r.status, 200);
    assert.equal((await r.json()).alternativas[0].correta, undefined);
    assert.equal((await pedir('/api/exames/respostas/70', dois, 'POST', { alternativa: 90 })).status, 404);
    assert.equal(respondida, false);
    assert.equal((await pedir('/api/exames/respostas/70', um, 'POST', { alternativa: 999 })).status, 409);
    r = await pedir('/api/exames/respostas/70', um, 'POST', { alternativa: 90 });
    assert.equal(r.status, 200);
    const resultado = await r.json();
    assert.equal(resultado.acertou, true);
    assert.equal(resultado.justificativa, 'Explicação');
    assert.equal(resultado.situacao, 'respondida');
    assert.deepEqual(resultado.alternativa_correta, { id: 90, letra: 'A', texto: 'Opção' });
    assert.equal(resultado.proximo_tema, 6);
    assert.equal((await pedir('/api/exames/respostas/70', um, 'POST', { alternativa: 90 })).status, 409);
    semQuestao = true;
    assert.equal((await pedir('/api/exames/5/iniciar', um, 'POST', {})).status, 404);
    assert.equal(rollbacks, 2); assert.equal(liberacoes, 6);
    falhar = true; r = await pedir('/api/estudos', um); assert.equal(r.status, 503); assert.doesNotMatch(await r.text(), /segredo do banco/);
});
