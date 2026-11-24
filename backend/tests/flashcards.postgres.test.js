const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Pool } = require('pg');

// Mesma variável das suítes PostgreSQL existentes.
const habilitado = process.env.TEST_EXAME_POSTGRES === 'true';
const opcoes = { skip: !habilitado };
const raiz = path.join(__dirname, '../..');
const schema = 'teste_flashcards_' + crypto.randomBytes(8).toString('hex');
const opcoesPostgresAnteriores = process.env.PGOPTIONS;
let administrador, banco, servidor, base, senhaHash, schemaCriado = false;
let importador;

before(async () => {
    if (!habilitado) return;
    require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    process.env.RECUPERACAO_SECRET = crypto.randomBytes(32).toString('hex');
    process.env.NODE_ENV = 'development';
    administrador = new Pool({
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 3000,
    });
    assert.match(schema, /^teste_flashcards_[a-f0-9]{16}$/);
    await administrador.query(`CREATE SCHEMA "${schema}"`);
    schemaCriado = true;
    // O pool da aplicação usa um schema isolado, criado e removido por esta suíte.
    process.env.PGOPTIONS = '-c search_path=' + schema;
    banco = require('../src/config/db');
    await banco.query(fs.readFileSync(path.join(raiz, 'database/ddl/schema.sql'), 'utf8'));
    // A migração precisa ser repetível sobre um banco que já tem as tabelas.
    const migracao = fs.readFileSync(path.join(raiz, 'database/migrations/009_flashcards.sql'), 'utf8');
    await banco.query(migracao);
    await banco.query(migracao);
    importador = require('../scripts/importar-flashcards');
    senhaHash = await require('../src/services/senha').gerarHash('Flash12345');
    servidor = require('../src/app').listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    base = 'http://127.0.0.1:' + servidor.address().port;
});

after(async () => {
    if (!habilitado) return;
    if (servidor) await new Promise(resolve => servidor.close(resolve));
    if (banco) await banco.end();
    if (schemaCriado) await administrador.query(`DROP SCHEMA "${schema}" CASCADE`);
    if (administrador) await administrador.end();
    if (opcoesPostgresAnteriores === undefined) delete process.env.PGOPTIONS;
    else process.env.PGOPTIONS = opcoesPostgresAnteriores;
});

beforeEach(async () => {
    if (!habilitado) return;
    await banco.query('TRUNCATE tbcandidato, tbtema, tbimagem CASCADE');
    await banco.query(`INSERT INTO tbtema (nome, descricao, ordem)
        SELECT 'Tema ' || n, 'Descrição ' || n, n FROM generate_series(1, 12) AS n`);
});

async function importar(cartoes) {
    const db = await banco.connect();
    try { return await importador.importar(db, cartoes); } finally { db.release(); }
}

async function contar(sql = 'SELECT count(*)::int AS n FROM tbflashcard', parametros = []) {
    return (await banco.query(sql, parametros)).rows[0].n;
}

function catalogoAlterado(t, alterar) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashcards-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const dados = JSON.parse(fs.readFileSync(path.join(raiz, 'database/flashcards/tema-01.json'), 'utf8'));
    alterar(dados);
    fs.writeFileSync(path.join(dir, 'tema-01.json'), JSON.stringify(dados));
    return importador.carregar(dir);
}

async function criarCandidato(cpf, email) {
    await banco.query(`INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash)
        VALUES ($1, 'Candidato de teste', $2, $3)`, [cpf, email, senhaHash]);
    const resposta = await fetch(base + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha: 'Flash12345' }),
    });
    assert.equal(resposta.status, 200);
    const id = (await banco.query('SELECT id FROM tbcandidato WHERE cpf=$1', [cpf])).rows[0].id;
    return { id, cookie: resposta.headers.get('set-cookie').split(';')[0] };
}

async function resumo(cookie) {
    const resposta = await fetch(base + '/api/flashcards', { headers: cookie ? { Cookie: cookie } : {} });
    return { status: resposta.status, corpo: await resposta.json() };
}

test('importação é repetível e usa os IDs reais dos temas', opcoes, async () => {
    const cartoes = importador.carregar();
    const temas = new Set(cartoes.map(cartao => cartao.tema)).size;
    assert.deepEqual(await importar(cartoes), { inseridos: cartoes.length, existentes: 0, desativados: 0 });
    assert.deepEqual(await importar(cartoes), { inseridos: 0, existentes: cartoes.length, desativados: 0 });
    assert.equal(await contar(), cartoes.length);
    assert.equal(await contar(`SELECT count(DISTINCT f.idtema)::int AS n FROM tbflashcard f
        JOIN tbtema t ON t.id=f.idtema WHERE f.codigo_origem LIKE 'tema-' || lpad(t.ordem::text, 2, '0') || '-%'`), temas);
    assert.equal(await contar('SELECT count(*)::int AS n FROM tbflashcard WHERE NOT ativo'), 0);
});

test('hash alterado no mesmo código desfaz toda a transação', opcoes, async t => {
    await importar(importador.carregar());
    const antes = await contar();
    const alterado = catalogoAlterado(t, dados => {
        dados.flashcards[9].codigo = 'tema-01-fc10-v2';
        dados.flashcards[0].verso += ' Texto novo.';
    });
    // O cartão novo vem antes do alterado para provar que a inserção também é revertida.
    await assert.rejects(importar([alterado[9], ...alterado]),
        /Conteúdo alterado em tema-01-fc01\. Use um novo código de versão\./);
    assert.equal(await contar(), antes);
    assert.equal(await contar("SELECT count(*)::int AS n FROM tbflashcard WHERE codigo_origem='tema-01-fc10-v2'"), 0);
    assert.equal(await contar('SELECT count(*)::int AS n FROM tbflashcard WHERE NOT ativo'), 0);
});

test('nova versão desativa a anterior sem apagar linha nem progresso', opcoes, async t => {
    const original = importador.carregar();
    await importar(original);
    const { id } = await criarCandidato('52998224725', 'versao@example.test');
    await banco.query(`INSERT INTO tbprogresso_flashcard (idcandidato, idflashcard, caixa)
        SELECT $1, id, 3 FROM tbflashcard WHERE codigo_origem='tema-01-fc01'`, [id]);
    const versao = catalogoAlterado(t, dados => {
        dados.flashcards[0].codigo = 'tema-01-fc01-v2';
        dados.flashcards[0].verso += ' Versão revisada.';
    });
    assert.deepEqual(await importar(versao), { inseridos: 1, existentes: 9, desativados: 1 });
    const linhas = (await banco.query(`SELECT codigo_origem, ativo FROM tbflashcard
        WHERE codigo_origem LIKE 'tema-01-fc01%' ORDER BY codigo_origem`)).rows;
    assert.deepEqual(linhas, [{ codigo_origem: 'tema-01-fc01', ativo: false }, { codigo_origem: 'tema-01-fc01-v2', ativo: true }]);
    assert.equal(await contar('SELECT count(*)::int AS n FROM tbprogresso_flashcard'), 1);
    // Temas ausentes do lote não são afetados.
    assert.equal(await contar(`SELECT count(*)::int AS n FROM tbflashcard f JOIN tbtema t ON t.id=f.idtema
        WHERE t.ordem<>1 AND NOT f.ativo`), 0);
    // Voltar ao arquivo anterior reativa a versão antiga e desativa a nova.
    assert.deepEqual(await importar(original.filter(cartao => cartao.tema === 1)), { inseridos: 0, existentes: 10, desativados: 1 });
    assert.equal(await contar("SELECT count(*)::int AS n FROM tbflashcard WHERE codigo_origem='tema-01-fc01' AND ativo"), 1);
});

test('GET /api/flashcards exige sessão e isola o domínio de cada candidato', opcoes, async () => {
    const cartoes = importador.carregar();
    await importar(cartoes);
    assert.equal((await resumo()).status, 401);
    const um = await criarCandidato('52998224725', 'um@example.test');
    const dois = await criarCandidato('11144477735', 'dois@example.test');
    // Candidato um: 2 cartões na caixa 3 e 1 na caixa 1 do tema 1; 1 na caixa 2 do tema 2.
    await banco.query(`INSERT INTO tbprogresso_flashcard (idcandidato, idflashcard, caixa)
        SELECT $1, id, CASE codigo_origem WHEN 'tema-01-fc03' THEN 1 WHEN 'tema-02-fc01' THEN 2 ELSE 3 END
        FROM tbflashcard WHERE codigo_origem IN ('tema-01-fc01', 'tema-01-fc02', 'tema-01-fc03', 'tema-02-fc01')`, [um.id]);
    // Progresso em cartão inativo não entra na contagem.
    await banco.query("UPDATE tbflashcard SET ativo=FALSE WHERE codigo_origem='tema-01-fc10'");
    await banco.query(`INSERT INTO tbprogresso_flashcard (idcandidato, idflashcard, caixa)
        SELECT $1, id, 3 FROM tbflashcard WHERE codigo_origem='tema-01-fc10'`, [um.id]);

    const r1 = await resumo(um.cookie);
    assert.equal(r1.status, 200);
    assert.equal(r1.corpo.temas.length, 12);
    assert.deepEqual(r1.corpo.temas[0], { ordem: 1, nome: 'Tema 1', total: 9, novos: 6, caixa1: 1, caixa2: 0, caixa3: 2, dominio: 22 });
    assert.deepEqual(r1.corpo.temas[1], { ordem: 2, nome: 'Tema 2', total: 10, novos: 9, caixa1: 0, caixa2: 1, caixa3: 0, dominio: 0 });
    // Os demais temas refletem o catálogo atual (temas sem arquivo ficam com total 0).
    for (const tema of r1.corpo.temas.slice(2)) {
        const naoRevisados = cartoes.filter(cartao => cartao.tema === tema.ordem).length;
        assert.deepEqual(tema, { ordem: tema.ordem, nome: 'Tema ' + tema.ordem, total: naoRevisados,
            novos: naoRevisados, caixa1: 0, caixa2: 0, caixa3: 0, dominio: 0 });
    }
    const total = cartoes.length - 1;
    assert.deepEqual(r1.corpo.geral, { total, novos: total - 4, caixa1: 1, caixa2: 1, caixa3: 2, dominio: Math.round(2 / total * 100) });

    const r2 = await resumo(dois.cookie);
    assert.equal(r2.status, 200);
    assert.deepEqual(r2.corpo.geral, { total, novos: total, caixa1: 0, caixa2: 0, caixa3: 0, dominio: 0 });
    // O cliente não consegue escolher outro candidato pela URL.
    const forjado = await fetch(base + '/api/flashcards?idcandidato=' + um.id, { headers: { Cookie: dois.cookie } });
    assert.deepEqual((await forjado.json()).geral, r2.corpo.geral);
});
