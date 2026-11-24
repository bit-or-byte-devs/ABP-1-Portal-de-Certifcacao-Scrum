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

// ---------- F2/F3: sessão de estudo, registro Leitner e revisão ----------

// E-mails únicos por candidato, para não colidir com o índice uq_candidato_email.
function emailUnico() { return 'flash-' + crypto.randomBytes(6).toString('hex') + '@example.test'; }

async function sessao(cookie, consulta) {
    const resposta = await fetch(base + '/api/flashcards/sessao?' + consulta, { headers: cookie ? { Cookie: cookie } : {} });
    return { status: resposta.status, corpo: await resposta.json() };
}

async function responder(cookie, codigo, corpo, tipo = 'application/json') {
    const resposta = await fetch(base + '/api/flashcards/' + codigo + '/resultado', {
        method: 'POST',
        headers: { 'Content-Type': tipo, ...(cookie ? { Cookie: cookie } : {}) },
        body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
    });
    return { status: resposta.status, corpo: await resposta.json() };
}

async function definirProgresso(idcandidato, caixas) {
    for (const [codigo, caixa] of Object.entries(caixas))
        await banco.query(`INSERT INTO tbprogresso_flashcard (idcandidato, idflashcard, caixa)
            SELECT $1, id, $2 FROM tbflashcard WHERE codigo_origem=$3`, [idcandidato, caixa, codigo]);
}

async function progresso(idcandidato, codigo) {
    return (await banco.query(`SELECT p.caixa, p.acertos, p.erros FROM tbprogresso_flashcard p
        JOIN tbflashcard f ON f.id=p.idflashcard WHERE p.idcandidato=$1 AND f.codigo_origem=$2`, [idcandidato, codigo])).rows[0];
}

// Tema 1: caixa 1 (fc02, fc04), caixa 2 (fc03, fc05), caixa 3 (fc01), novos (fc06 a fc10). Tema 2: fc01 na caixa 1.
const PROGRESSO_BASE = {
    'tema-01-fc01': 3, 'tema-01-fc02': 1, 'tema-01-fc03': 2, 'tema-01-fc04': 1, 'tema-01-fc05': 2, 'tema-02-fc01': 1,
};

test('sessão por tema: grupos na ordem caixa 1, caixa 2, novos, caixa 3; filtro de temas e limite', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    await definirProgresso(um.id, PROGRESSO_BASE);

    const completa = await sessao(um.cookie, 'modo=tema&temas=1&limite=40');
    assert.equal(completa.status, 200);
    assert.equal(completa.corpo.modo, 'tema');
    assert.equal(completa.corpo.cartoes.length, 10);
    assert.deepEqual(completa.corpo.cartoes.map(c => c.caixa), [1, 1, 2, 2, null, null, null, null, null, 3]);
    assert.deepEqual(new Set(completa.corpo.cartoes.slice(0, 2).map(c => c.codigo)), new Set(['tema-01-fc02', 'tema-01-fc04']));
    const exemplo = completa.corpo.cartoes[0];
    assert.deepEqual(Object.keys(exemplo).sort(), ['caixa', 'codigo', 'explicacao', 'fonte', 'frente', 'imagem', 'tema', 'verso']);
    assert.deepEqual(exemplo.tema, { ordem: 1, nome: 'Tema 1' });
    assert.equal(exemplo.imagem, null);

    const doisTemas = await sessao(um.cookie, 'modo=tema&temas=2,1&limite=40');
    assert.equal(doisTemas.corpo.cartoes.length, 20);
    assert.ok(doisTemas.corpo.cartoes.every(c => [1, 2].includes(c.tema.ordem)));
    assert.deepEqual(doisTemas.corpo.cartoes.slice(0, 3).map(c => c.caixa), [1, 1, 1]);

    const limitada = await sessao(um.cookie, 'modo=tema&temas=1&limite=5');
    assert.deepEqual(limitada.corpo.cartoes.map(c => c.caixa), [1, 1, 2, 2, null]);
    assert.equal((await sessao(um.cookie, 'modo=tema&temas=3')).corpo.cartoes.length, 10, 'limite padrão 20 com 10 cartões no tema');
    assert.equal((await sessao(um.cookie, 'modo=tema&temas=1,2,3')).corpo.cartoes.length, 20, 'limite padrão é 20');

    // Cartão inativo não entra em nenhuma sessão.
    await banco.query("UPDATE tbflashcard SET ativo=FALSE WHERE codigo_origem='tema-01-fc06'");
    const semInativo = await sessao(um.cookie, 'modo=tema&temas=1&limite=40');
    assert.equal(semInativo.corpo.cartoes.length, 9);
    assert.ok(!semInativo.corpo.cartoes.some(c => c.codigo === 'tema-01-fc06'));
});

test('sessão aleatória usa todos os temas ativos e ignora o parâmetro temas', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    await banco.query("UPDATE tbflashcard SET ativo=FALSE WHERE codigo_origem LIKE 'tema-12-%'");
    const vistos = new Set();
    for (let i = 0; i < 5; i++) {
        const r = await sessao(um.cookie, 'modo=aleatorio&temas=nao-validado&limite=40');
        assert.equal(r.status, 200);
        assert.equal(r.corpo.cartoes.length, 40);
        r.corpo.cartoes.forEach(c => vistos.add(c.tema.ordem));
    }
    assert.ok(vistos.size > 3, 'cartões de vários temas');
    assert.ok(!vistos.has(12), 'tema 12 está inativo');
    assert.equal((await sessao(um.cookie, 'modo=aleatorio')).corpo.cartoes.length, 20);
});

test('revisão traz só a caixa 1 do próprio candidato, com e sem filtro, e vazia sem erros', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    const dois = await criarCandidato('11144477735', emailUnico());
    await definirProgresso(um.id, PROGRESSO_BASE);
    await definirProgresso(dois.id, { 'tema-03-fc01': 3, 'tema-03-fc02': 2 });

    // Caixa 1: tema-01-fc02, tema-01-fc04 e tema-02-fc01. Fora: novos, caixa 2 (fc03, fc05) e caixa 3 (fc01).
    const todas = await sessao(um.cookie, 'modo=revisao&limite=40');
    assert.equal(todas.status, 200);
    assert.deepEqual(todas.corpo.cartoes.map(c => c.caixa), [1, 1, 1]);
    assert.deepEqual(todas.corpo.cartoes.map(c => c.codigo).sort(), ['tema-01-fc02', 'tema-01-fc04', 'tema-02-fc01']);

    const filtrada = await sessao(um.cookie, 'modo=revisao&temas=2');
    assert.deepEqual(filtrada.corpo.cartoes.map(c => c.codigo), ['tema-02-fc01']);
    assert.deepEqual((await sessao(um.cookie, 'modo=revisao&temas=5')).corpo, { modo: 'revisao', cartoes: [] });

    // O candidato dois não vê os erros do um; caixa 2 e caixa 3 não entram na revisão.
    assert.deepEqual((await sessao(dois.cookie, 'modo=revisao')).corpo, { modo: 'revisao', cartoes: [] });
    const temaDois = await sessao(dois.cookie, 'modo=tema&temas=1&limite=40');
    assert.ok(temaDois.corpo.cartoes.every(c => c.caixa === null));
});

test('revisão acompanha as respostas: novo com "Sabia" não entra e errado com "Sabia" sai', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    const revisao = async () => (await sessao(um.cookie, 'modo=revisao')).corpo.cartoes.map(c => c.codigo).sort();

    assert.equal((await responder(um.cookie, 'tema-06-fc01', { sabia: true })).corpo.caixa, 2);
    assert.deepEqual(await revisao(), [], 'novo respondido "Sabia" vai para a caixa 2 e não entra na revisão');

    assert.equal((await responder(um.cookie, 'tema-06-fc02', { sabia: false })).corpo.caixa, 1);
    assert.deepEqual(await revisao(), ['tema-06-fc02']);

    assert.equal((await responder(um.cookie, 'tema-06-fc02', { sabia: true })).corpo.caixa, 2);
    assert.deepEqual(await revisao(), [], '"Não sabia" e depois "Sabia" sai da revisão');

    // Errar de novo um cartão da caixa 2 o traz de volta.
    assert.equal((await responder(um.cookie, 'tema-06-fc01', { sabia: false })).corpo.caixa, 1);
    assert.deepEqual(await revisao(), ['tema-06-fc01']);
});

test('sessão: parâmetros inválidos respondem 400 e sem sessão 401', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    assert.equal((await sessao(null, 'modo=tema&temas=1')).status, 401);
    for (const consulta of [
        '', 'modo=', 'modo=TEMA', 'modo=outro', 'modo=tema&modo=revisao',
        'modo=tema', 'modo=tema&temas=', 'modo=tema&temas=0', 'modo=tema&temas=13', 'modo=tema&temas=1,1',
        'modo=tema&temas=1,,2', 'modo=tema&temas=a', 'modo=tema&temas=1&temas=2', 'modo=revisao&temas=99',
        'modo=tema&temas=1&limite=4', 'modo=tema&temas=1&limite=41', 'modo=tema&temas=1&limite=2.5',
        'modo=tema&temas=1&limite=abc', 'modo=aleatorio&limite=-5', 'modo=aleatorio&limite=',
    ]) {
        const r = await sessao(um.cookie, consulta);
        assert.equal(r.status, 400, consulta);
        assert.equal(typeof r.corpo.mensagem, 'string', consulta);
    }
});

test('resultado: transições Leitner pela rota, contadores e domínio do tema', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    const passos = [
        [true, { caixa: 2, acertos: 1, erros: 0, dominioTema: 0 }],
        [true, { caixa: 3, acertos: 2, erros: 0, dominioTema: 10 }],
        [true, { caixa: 3, acertos: 3, erros: 0, dominioTema: 10 }],
        [false, { caixa: 1, acertos: 3, erros: 1, dominioTema: 0 }],
        [true, { caixa: 2, acertos: 4, erros: 1, dominioTema: 0 }],
        [false, { caixa: 1, acertos: 4, erros: 2, dominioTema: 0 }],
    ];
    for (const [sabia, esperado] of passos) {
        const r = await responder(um.cookie, 'tema-04-fc01', { sabia });
        assert.equal(r.status, 200);
        assert.deepEqual(r.corpo, esperado);
    }
    assert.deepEqual(await responder(um.cookie, 'tema-04-fc02', { sabia: false }), { status: 200, corpo: { caixa: 1, acertos: 0, erros: 1, dominioTema: 0 } });
    assert.equal(await contar('SELECT count(*)::int AS n FROM tbprogresso_flashcard'), 2);
    // A revisão passa a trazer os dois cartões errados.
    assert.deepEqual((await sessao(um.cookie, 'modo=revisao')).corpo.cartoes.map(c => c.codigo).sort(), ['tema-04-fc01', 'tema-04-fc02']);
});

test('resultado: 400, 404, 415 e 401 sem alterar progresso', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    for (const codigo of ['abc', 'tema-1-fc01', 'tema-01-q01', 'tema-01-fc01-x'])
        assert.equal((await responder(um.cookie, codigo, { sabia: true })).status, 400, codigo);
    for (const corpo of [{}, { sabia: 'true' }, { sabia: 1 }, { sabia: null }, []])
        assert.equal((await responder(um.cookie, 'tema-01-fc01', corpo)).status, 400, JSON.stringify(corpo));
    assert.equal((await responder(um.cookie, 'tema-01-fc01', 'sabia=true', 'application/x-www-form-urlencoded')).status, 415);
    assert.equal((await responder(um.cookie, 'tema-01-fc99', { sabia: true })).status, 404);
    await banco.query("UPDATE tbflashcard SET ativo=FALSE WHERE codigo_origem='tema-01-fc01'");
    const inativo = await responder(um.cookie, 'tema-01-fc01', { sabia: true });
    assert.equal(inativo.status, 404);
    assert.equal(inativo.corpo.mensagem, 'Flashcard não encontrado.');
    assert.equal((await responder(null, 'tema-01-fc02', { sabia: true })).status, 401);
    assert.equal(await contar('SELECT count(*)::int AS n FROM tbprogresso_flashcard'), 0);
});

test('resultado: um candidato não vê nem altera o progresso do outro', opcoes, async () => {
    await importar(importador.carregar());
    const um = await criarCandidato('52998224725', emailUnico());
    const dois = await criarCandidato('11144477735', emailUnico());
    await definirProgresso(um.id, { 'tema-05-fc01': 3 });
    // Tentar indicar outro candidato no corpo ou na URL não tem efeito.
    const r = await fetch(base + '/api/flashcards/tema-05-fc01/resultado?idcandidato=' + um.id, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: dois.cookie },
        body: JSON.stringify({ sabia: false, idcandidato: um.id }),
    });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { caixa: 1, acertos: 0, erros: 1, dominioTema: 0 });
    assert.deepEqual(await progresso(um.id, 'tema-05-fc01'), { caixa: 3, acertos: 0, erros: 0 });
    assert.deepEqual(await progresso(dois.id, 'tema-05-fc01'), { caixa: 1, acertos: 0, erros: 1 });
    // A revisão de cada um reflete só o próprio progresso.
    assert.deepEqual((await sessao(um.cookie, 'modo=revisao')).corpo.cartoes, []);
    assert.deepEqual((await sessao(dois.cookie, 'modo=revisao')).corpo.cartoes.map(c => c.codigo), ['tema-05-fc01']);
    assert.equal((await resumo(um.cookie)).corpo.temas[4].caixa3, 1);
    assert.equal((await resumo(dois.cookie)).corpo.temas[4].caixa3, 0);
});
