const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const habilitado = process.env.TEST_EXAME_POSTGRES === "true";
const opcoes = { skip: !habilitado };
let administrador;
let banco;
let servidor;
let base;
let senhaHash;
let schemaCriado = false;
const schema = "teste_exame_" + crypto.randomBytes(8).toString("hex");
const opcoesPostgresAnteriores = process.env.PGOPTIONS;

before(async () => {
    if (!habilitado) return;
    require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.RECUPERACAO_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.NODE_ENV = "development";
    administrador = new Pool({
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        connectionTimeoutMillis: 3000,
    });
    assert.match(schema, /^teste_exame_[a-f0-9]{16}$/);
    await administrador.query(`CREATE SCHEMA "${schema}"`);
    schemaCriado = true;
    // O próprio pool da aplicação acessa um schema isolado, sem substituir módulos.
    process.env.PGOPTIONS = "-c search_path=" + schema;
    banco = require("../src/config/db");
    await banco.query(fs.readFileSync(path.join(__dirname, "../../database/ddl/schema.sql"), "utf8"));
    senhaHash = await require("../src/services/senha").gerarHash("Exame12345");
    servidor = require("../src/app").listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    base = "http://127.0.0.1:" + servidor.address().port;
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
    if (habilitado) await banco.query("TRUNCATE tbcandidato, tbtema, tbimagem CASCADE");
});

async function solicitar(rota, cookie, corpo) {
    const resposta = await fetch(base + rota, {
        method: corpo === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
    });
    return { status: resposta.status, corpo: await resposta.json(), cabecalhos: resposta.headers };
}

async function criarCandidato(cpf = "52998224725") {
    await banco.query(`INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash)
        VALUES ($1, 'Candidato de teste', 'exame@example.test', $2)`, [cpf, senhaHash]);
    const login = await solicitar("/api/auth/login", null, { cpf, senha: "Exame12345" });
    assert.equal(login.status, 200);
    return login.cabecalhos.get("set-cookie").split(";")[0];
}

async function criarTema(ordem) {
    const tema = await banco.query("INSERT INTO tbtema (nome, descricao, ordem) VALUES ($1, 'Descrição', $2) RETURNING id", ["Tema " + ordem, ordem]);
    const imagem = await banco.query("INSERT INTO tbimagem (arquivo_ou_url, texto_alternativo) VALUES ('/imagens/teste.png', 'Imagem de teste') RETURNING id");
    const alternativas = await banco.query(`WITH q AS (
            INSERT INTO tbquestao (idtema, idimagem, enunciado, justificativa)
            VALUES ($1, $2, 'Enunciado de teste', 'Justificativa de teste') RETURNING id
        ), inseridas AS (
            INSERT INTO tbalternativa (idquestao, letra, texto, correta)
            SELECT q.id, letra, 'Alternativa ' || letra, letra = 'A'
            FROM q CROSS JOIN unnest(ARRAY['A','B','C','D']::text[]) AS letra
            RETURNING id, letra, texto
        )
        SELECT id, letra, texto FROM inseridas`, [tema.rows[0].id, imagem.rows[0].id]);
    return alternativas.rows;
}

async function criarQuestaoValida(db, codigo, incluirAlternativas = true) {
    let tema = await db.query('SELECT id FROM tbtema WHERE ordem=1');
    if (tema.rowCount === 0) {
        tema = await db.query("INSERT INTO tbtema (nome, descricao, ordem) VALUES ($1, $2, 1) RETURNING id",
            ['Tema US14', 'Tema usado pelos testes da US14']);
    }
    const questao = await db.query(`INSERT INTO tbquestao (idtema, codigo_origem, enunciado, justificativa)
        VALUES ($1, $2, $3, 'Justificativa') RETURNING id`, [tema.rows[0].id, codigo, codigo]);
    if (incluirAlternativas) {
        await db.query(`INSERT INTO tbalternativa (idquestao, letra, texto, correta)
            SELECT $1, letra, 'Alternativa ' || letra, letra = 'A'
            FROM unnest(ARRAY['A','B','C','D']::text[]) letra`, [questao.rows[0].id]);
    }
    return questao.rows[0].id;
}

async function iniciar(cookie, ordem = 1) {
    const resposta = await solicitar(`/api/exames/${ordem}/iniciar`, cookie, {});
    assert.equal(resposta.status, 200);
    return resposta.corpo;
}

async function recuarExibicao(id, segundos) {
    await banco.query("UPDATE tbresposta SET data_hora_exibicao=clock_timestamp() - $2 * INTERVAL '1 second' WHERE id=$1", [id, segundos]);
}

async function lerResposta(id) {
    return (await banco.query("SELECT * FROM tbresposta WHERE id=$1", [id])).rows[0];
}

test("Prazo: aceita aos 151 s e encerra com 409 aos 153 s", opcoes, async () => {
    const alternativas = await criarTema(1);
    await criarTema(2);
    const cookie = await criarCandidato();
    const primeira = await iniciar(cookie);
    await recuarExibicao(primeira.id, 151);
    const aceita = await solicitar(`/api/exames/respostas/${primeira.id}`, cookie, { alternativa: alternativas[0].id });
    assert.equal(aceita.status, 200);
    assert.equal(aceita.corpo.situacao, "respondida");
    assert.equal(aceita.corpo.acertou, true);
    assert.equal(aceita.corpo.proximo_tema, 2);
    assert.equal((await lerResposta(primeira.id)).situacao, "respondida");
    const segunda = await iniciar(cookie, 2);
    await recuarExibicao(segunda.id, 153);
    const recusada = await solicitar(`/api/exames/respostas/${segunda.id}`, cookie, { alternativa: segunda.alternativas[0].id });
    assert.equal(recusada.status, 409);
    assert.equal(recusada.corpo.situacao, "tempo_esgotado");
    assert.equal(recusada.corpo.acertou, false);
    assert.match(recusada.corpo.mensagem, /Tempo esgotado/);
    assert.ok(recusada.corpo.alternativa_correta);
    assert.equal(recusada.corpo.proximo_tema, null);
    const encerrada = await lerResposta(segunda.id);
    assert.equal(encerrada.situacao, "tempo_esgotado");
    assert.equal(encerrada.acertou, false);
    assert.equal(encerrada.idalternativa, null);
    assert.equal(encerrada.data_hora_resposta, null);
    assert.equal((await solicitar(`/api/exames/respostas/${segunda.id}`, cookie, { alternativa: segunda.alternativas[0].id })).status, 409);
});

test("Gabarito: oculto em andamento e disponível após o encerramento", opcoes, async () => {
    const alternativas = await criarTema(1);
    await criarTema(2);
    const cookie = await criarCandidato();
    const questao = await iniciar(cookie, 2);
    assert.equal(Object.hasOwn(questao, "alternativa_correta"), false);
    assert.ok(questao.segundos_restantes > 149 && questao.segundos_restantes <= 150);
    assert.equal(questao.justificativa, null);
    assert.ok(questao.alternativas.every(alternativa => !Object.hasOwn(alternativa, "correta")));
    const consulta = await solicitar(`/api/exames/respostas/${questao.id}`, cookie);
    assert.equal(consulta.status, 200);
    assert.equal(Object.hasOwn(consulta.corpo, "alternativa_correta"), false);
    await recuarExibicao(questao.id, 153);
    const encerrada = await solicitar(`/api/exames/respostas/${questao.id}`, cookie);
    assert.equal(encerrada.status, 200);
    assert.equal(encerrada.corpo.situacao, "tempo_esgotado");
    assert.deepEqual(encerrada.corpo.alternativa_correta, questao.alternativas[0]);
    assert.equal(encerrada.corpo.justificativa, "Justificativa de teste");
    assert.equal(encerrada.corpo.proximo_tema, 1); // Retorna à menor ordem pendente.
    assert.deepEqual((await iniciar(cookie, 2)).alternativa_correta, questao.alternativas[0]);
    const respondida = await iniciar(cookie);
    const resultado = await solicitar(`/api/exames/respostas/${respondida.id}`, cookie, { alternativa: alternativas[0].id });
    assert.equal(resultado.status, 200);
    assert.deepEqual(resultado.corpo.alternativa_correta, alternativas[0]);
    const repetida = await solicitar(`/api/exames/respostas/${respondida.id}`, cookie, { alternativa: alternativas[1].id });
    assert.equal(repetida.status, 409);
    assert.equal(repetida.corpo.situacao, "respondida");
    assert.deepEqual(repetida.corpo.alternativa_correta, alternativas[0]);
});

test("Varredura: respeita tolerância, horário final e conclusão da 12ª questão", opcoes, async () => {
    for (let ordem = 1; ordem <= 12; ordem++) await criarTema(ordem);
    const cookie = await criarCandidato();
    for (let ordem = 1; ordem <= 11; ordem++) {
        const questao = await iniciar(cookie, ordem);
        const alternativa = questao.alternativas[ordem === 1 ? 0 : 1].id;
        assert.equal((await solicitar(`/api/exames/respostas/${questao.id}`, cookie, { alternativa })).status, 200);
    }
    const ultima = await iniciar(cookie, 12);
    const outroCookie = await criarCandidato("11144477735");
    const vencida = await iniciar(outroCookie, 1);
    // Prepara duas pendências sem chamar iniciar, que agora interrompe a anterior.
    const noPrazo = (await banco.query(`INSERT INTO tbresposta (idcertificacao, idtema, idquestao)
        SELECT r.idcertificacao, q.idtema, q.id FROM tbresposta r
        JOIN tbquestao q ON q.idtema=(SELECT id FROM tbtema WHERE ordem=2)
        WHERE r.id=$1 RETURNING id`, [vencida.id])).rows[0];
    await recuarExibicao(ultima.id, 153);
    await recuarExibicao(vencida.id, 153);
    await recuarExibicao(noPrazo.id, 151);
    const { encerrarQuestoesVencidas } = require("../src/services/encerramentoQuestao");
    const { recalcularCertificacao } = require("../src/services/certificacao");
    const db = await banco.connect();
    try {
        await db.query("BEGIN");
        const certificacoes = await encerrarQuestoesVencidas(db);
        assert.equal(certificacoes.length, 2);
        for (const idcertificacao of certificacoes) await recalcularCertificacao(db, idcertificacao);
        await db.query("COMMIT");
    } catch (erro) { await db.query("ROLLBACK"); throw erro; }
    finally { db.release(); }
    for (const id of [ultima.id, vencida.id]) {
        const resposta = await lerResposta(id);
        assert.equal(resposta.situacao, "tempo_esgotado");
        assert.equal(resposta.acertou, false);
        assert.equal(resposta.idalternativa, null);
        assert.equal(resposta.data_hora_resposta, null);
        const horario = await banco.query("SELECT data_hora_encerramento = data_hora_exibicao + INTERVAL '150 seconds' AS correto FROM tbresposta WHERE id=$1", [id]);
        assert.equal(horario.rows[0].correto, true);
    }
    assert.equal((await lerResposta(noPrazo.id)).situacao, "em_andamento");
    const encerrada = await lerResposta(ultima.id);
    const certificacao = (await banco.query("SELECT * FROM tbcertificacao WHERE id=$1", [encerrada.idcertificacao])).rows[0];
    assert.equal(certificacao.status, "concluida");
    assert.equal(certificacao.total_acertos, 1);
    assert.equal(Number(certificacao.nota_final), 8.33);
    assert.equal(Number(certificacao.percentual_acertos), 8.33);
    assert.ok(certificacao.data_conclusao);
    const resultado = await solicitar(`/api/exames/respostas/${ultima.id}`, cookie);
    assert.equal(resultado.corpo.proximo_tema, null);
    assert.ok(resultado.corpo.alternativa_correta);
});

test("Dono da resposta: GET de outro candidato devolve 404", opcoes, async () => {
    await criarTema(1);
    const cookie = await criarCandidato();
    const outroCookie = await criarCandidato("11144477735");
    const questao = await iniciar(cookie);
    await recuarExibicao(questao.id, 153);
    const resposta = await solicitar(`/api/exames/respostas/${questao.id}`, outroCookie);
    assert.equal(resposta.status, 404);
    assert.deepEqual(resposta.corpo, { mensagem: "Resposta não encontrada." });
    assert.equal((await lerResposta(questao.id)).situacao, "em_andamento");
});


test("Interrupção: reiniciar encerra pendências e preserva o tempo esgotado", opcoes, async () => {
    for (let ordem = 1; ordem <= 3; ordem++) await criarTema(ordem);
    const cookie = await criarCandidato();
    const primeira = await iniciar(cookie);
    const repetida = await iniciar(cookie);
    assert.equal(repetida.id, primeira.id);
    assert.equal(repetida.situacao, "interrompida");
    assert.deepEqual(repetida.alternativa_correta, primeira.alternativas[0]);
    const segunda = await iniciar(cookie, 2);
    const terceira = await iniciar(cookie, 3);
    assert.equal(terceira.situacao, "em_andamento");
    for (const questao of [primeira, segunda]) {
        const encerrada = await lerResposta(questao.id);
        assert.equal(encerrada.situacao, "interrompida");
        assert.equal(encerrada.acertou, false);
        assert.equal(encerrada.idalternativa, null);
        assert.equal(encerrada.data_hora_resposta, null);
        assert.ok(encerrada.data_hora_encerramento);
        const recusada = await solicitar(`/api/exames/respostas/${questao.id}`, cookie, { alternativa: questao.alternativas[0].id });
        assert.equal(recusada.status, 409);
        assert.equal(recusada.corpo.situacao, "interrompida");
        assert.deepEqual(recusada.corpo.alternativa_correta, questao.alternativas[0]);
    }
    await recuarExibicao(terceira.id, 153);
    const vencida = await iniciar(cookie, 3);
    assert.equal(vencida.id, terceira.id);
    assert.equal(vencida.situacao, "tempo_esgotado");
    assert.deepEqual(vencida.alternativa_correta, terceira.alternativas[0]);
    assert.equal((await iniciar(cookie)).id, primeira.id);
    const certificacao = (await banco.query("SELECT * FROM tbcertificacao")).rows[0];
    assert.equal(certificacao.total_acertos, 0);
    assert.equal(Number(certificacao.percentual_acertos), 0);
    assert.equal(certificacao.status, "em_andamento");
    assert.equal((await banco.query("SELECT count(*)::integer AS total FROM tbresposta")).rows[0].total, 3);
});


test("Progresso: preserva questões abertas, encerra vencidas e não cria certificação", opcoes, async () => {
    for (let ordem = 1; ordem <= 12; ordem++) await criarTema(ordem);
    const cookie = await criarCandidato();
    const primeira = await iniciar(cookie);
    assert.equal((await solicitar(`/api/exames/respostas/${primeira.id}`, cookie,
        { alternativa: primeira.alternativas[0].id })).status, 200);
    const segunda = await iniciar(cookie, 2);
    await recuarExibicao(segunda.id, 153);
    const terceira = await iniciar(cookie, 3);
    const progresso = await solicitar("/api/exames/progresso", cookie);
    assert.equal(progresso.status, 200);
    assert.equal(progresso.corpo.total_acertos, 1);
    assert.equal(Number(progresso.corpo.percentual_acertos), 8.33);
    assert.equal(Number(progresso.corpo.nota_final), 8.33);
    assert.equal(progresso.corpo.aprovado, false);
    assert.deepEqual(progresso.corpo, {
        temas: Array.from({ length: 12 }, (_, indice) => ({ ordem: indice + 1, nome: "Tema " + (indice + 1),
            estado: indice < 2 ? "concluido" : indice === 2 ? "em_andamento" : "pendente" })),
        proximo_tema: 4, certificacao_concluida: false,
        total_acertos: 1, percentual_acertos: 8.33, nota_final: 8.33, aprovado: false,
    });
    assert.equal((await lerResposta(segunda.id)).situacao, "tempo_esgotado");
    assert.equal((await lerResposta(terceira.id)).situacao, "em_andamento");
    await recuarExibicao(terceira.id, 153);
    const atualizado = await solicitar("/api/exames/progresso", cookie);
    assert.equal(atualizado.status, 200);
    assert.equal(atualizado.corpo.temas[2].estado, "concluido");
    assert.equal(atualizado.corpo.proximo_tema, 4);
    assert.equal((await lerResposta(terceira.id)).situacao, "tempo_esgotado");

    const outroCookie = await criarCandidato("11144477735");
    const semCertificacao = await solicitar("/api/exames/progresso", outroCookie);
    assert.equal(semCertificacao.status, 200);
    assert.deepEqual(semCertificacao.corpo, {
        temas: Array.from({ length: 12 }, (_, indice) => ({ ordem: indice + 1, nome: "Tema " + (indice + 1), estado: "pendente" })),
        proximo_tema: 1, certificacao_concluida: false,
        total_acertos: 0, percentual_acertos: 0, nota_final: 0, aprovado: false,
    });
    const quantidade = await banco.query(`SELECT count(*)::integer AS total FROM tbcertificacao c
        JOIN tbcandidato candidato ON candidato.id=c.idcandidato WHERE candidato.cpf='11144477735'`);
    assert.equal(quantidade.rows[0].total, 0);
    assert.equal((await solicitar("/api/exames/progresso")).status, 401);

    // As interrupções também concluem temas; com o último aberto não há tema novo para continuar.
    for (let ordem = 4; ordem <= 12; ordem++) await iniciar(cookie, ordem);
    const semPendentes = await solicitar("/api/exames/progresso", cookie);
    assert.equal(semPendentes.corpo.proximo_tema, null);
    assert.equal(semPendentes.corpo.certificacao_concluida, false);
    assert.equal(semPendentes.corpo.temas[11].estado, "em_andamento");
    await iniciar(cookie, 12);
    const concluida = await solicitar("/api/exames/progresso", cookie);
    assert.equal(concluida.corpo.certificacao_concluida, true);
    assert.equal(concluida.corpo.proximo_tema, null);
    assert.ok(concluida.corpo.temas.every(tema => tema.estado === "concluido"));
    assert.equal(concluida.corpo.total_acertos, 12);
    assert.equal(Number(concluida.corpo.percentual_acertos), 100);
    assert.equal(Number(concluida.corpo.nota_final), 100);
    assert.equal(concluida.corpo.aprovado, true);
});


test('Integração das cargas: migrações repetíveis, temas estruturados e respostas preservadas', opcoes, async () => {
    const { carregar, importar } = require('../scripts/importar-questoes');
    const migracao = fs.readFileSync(path.join(__dirname, '../../database/migrations/003_carga_questoes.sql'), 'utf8');
    await banco.query(migracao);
    await banco.query(migracao);
    const migracaoAlternativas = fs.readFileSync(path.join(__dirname, '../../database/migrations/005_alternativas_questao.sql'), 'utf8');
    await banco.query(migracaoAlternativas);
    await banco.query(migracaoAlternativas);
    const temas = require('../scripts/importar-temas');
    const migracaoTemas = fs.readFileSync(path.join(__dirname, '../../database/migrations/004_conteudo_temas.sql'), 'utf8');
    await banco.query(fs.readFileSync(path.join(__dirname, '../../database/dml/seed.sql'), 'utf8'));
    await banco.query("ALTER TABLE tbprogresso_estudo ADD COLUMN subtitulos integer[] NOT NULL DEFAULT '{}'");
    const legado = await banco.query(`INSERT INTO tbcandidato (cpf,nome_completo,email,senha_hash)
        VALUES ('39053344705','Legado','legado@example.test',$1) RETURNING id`, [senhaHash]);
    const temaLegado = await banco.query('SELECT id FROM tbtema WHERE ordem=1');
    await banco.query(`INSERT INTO tbprogresso_estudo (idcandidato,idtema,subtitulos)
        VALUES ($1,$2,ARRAY[0,2])`, [legado.rows[0].id, temaLegado.rows[0].id]);
    await banco.query(migracaoTemas);
    await banco.query(migracaoTemas);
    assert.deepEqual((await banco.query('SELECT secoes FROM tbprogresso_estudo WHERE idcandidato=$1',
        [legado.rows[0].id])).rows[0].secoes, ['tema-01-s01', 'tema-01-s03']);
    const db = await banco.connect();
    try {
        assert.deepEqual(await importar(db, carregar()), { inseridas: 48, existentes: 0 });
        assert.deepEqual(await importar(db, carregar()), { inseridas: 0, existentes: 48 });
        assert.deepEqual(await temas.importar(db, temas.carregar()),
            { inseridos: 82, atualizados: 0, existentes: 0, removidos: 0 });
        assert.deepEqual(await temas.importar(db, temas.carregar()),
            { inseridos: 0, atualizados: 0, existentes: 82, removidos: 0 });
        assert.equal(Number((await db.query('SELECT count(*) FROM tbalternativa')).rows[0].count), 192);
        assert.equal(Number((await db.query("SELECT count(*) FROM tbmaterial WHERE tipo='secao'")).rows[0].count), 70);
    } finally { db.release(); }
    const cookie = await criarCandidato();
    const questao = await iniciar(cookie, 4);
    assert.match(questao.imagem, /^\/imagens\/questoes\//);
    assert.equal(questao.alternativas.length, 4);
    const consulta = await solicitar('/api/exames/respostas/' + questao.id, cookie);
    assert.equal(consulta.status, 200);
    const resultado = await solicitar('/api/exames/respostas/' + questao.id, cookie, { alternativa: questao.alternativas[0].id });
    assert.equal(resultado.status, 200);
    assert.equal(resultado.corpo.situacao, 'respondida');
    const cliente = await banco.connect();
    try { assert.deepEqual(await importar(cliente, carregar()), { inseridas: 0, existentes: 48 }); }
    finally { cliente.release(); }
    assert.equal((await lerResposta(questao.id)).situacao, 'respondida');
    for (const ordem of [7,8,9,10,11,12]) {
        const adicional = await iniciar(cookie, ordem);
        assert.equal(adicional.alternativas.length, 4);
        const enviada = await solicitar('/api/exames/respostas/' + adicional.id, cookie, { alternativa: adicional.alternativas[0].id });
        assert.equal(enviada.status, 200);
    }
    const comImagem = await iniciar(cookie, 1);
    const arquivo = await fetch(base + comImagem.imagem);
    assert.equal(arquivo.status, 200);
    assert.match(arquivo.headers.get('content-type'), /^image\//);
});

test('005_alternativas_questao recusa base inconsistente', opcoes, async () => {
    const migracao = fs.readFileSync(path.join(__dirname, '../../database/migrations/005_alternativas_questao.sql'), 'utf8');
    // Simula uma base antiga, anterior à regra, que já tem uma questão inválida.
    await banco.query('DROP TRIGGER tg_alternativas_questao ON tbalternativa');
    await banco.query('DROP TRIGGER tg_questao_alternativas ON tbquestao');
    const tema = await banco.query("INSERT INTO tbtema (nome, descricao, ordem) VALUES ('Tema inválido', 'Teste', 1) RETURNING id");
    const questao = await banco.query(`INSERT INTO tbquestao (idtema, codigo_origem, enunciado, justificativa)
        VALUES ($1, 'questao-invalida', 'Inválida', 'Inválida') RETURNING id`, [tema.rows[0].id]);
    await banco.query(`INSERT INTO tbalternativa (idquestao, letra, texto, correta)
        SELECT $1, letra, 'Alternativa ' || letra, false FROM unnest(ARRAY['A','B','C']::text[]) letra`, [questao.rows[0].id]);
    await assert.rejects(banco.query(migracao), erro =>
        /Questões sem exatamente 4 alternativas e 1 correta/.test(erro.message) &&
        erro.message.includes(String(questao.rows[0].id)) && erro.message.includes('questao-invalida'));
    // A migração recusada não recria os triggers; depois de limpar a base, ela passa.
    await banco.query('DELETE FROM tbalternativa WHERE idquestao=$1', [questao.rows[0].id]);
    await banco.query('DELETE FROM tbquestao WHERE id=$1', [questao.rows[0].id]);
    await banco.query(migracao);
    // Filtra pelo schema do teste: o schema principal do banco também tem esses triggers.
    const triggers = await banco.query(`SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
        WHERE c.relnamespace = current_schema()::regnamespace AND NOT t.tgisinternal
        AND t.tgname IN ('tg_alternativas_questao', 'tg_questao_alternativas')`);
    assert.deepEqual(triggers.rows.map(linha => linha.tgname).sort(),
        ['tg_alternativas_questao', 'tg_questao_alternativas']);
});


test('Banco garante exatamente 4 alternativas e 1 correta por questão', opcoes, async () => {
    async function criarQuestaoForaDaTransacao(codigo) {
        const cliente = await banco.connect();
        try {
            await cliente.query('BEGIN');
            const questao = await criarQuestaoValida(cliente, codigo);
            await cliente.query('COMMIT');
            return questao;
        } catch (erro) {
            await cliente.query('ROLLBACK').catch(() => {});
            throw erro;
        } finally { cliente.release(); }
    }

    async function rejeitarNoCommit(codigo, alteracao) {
        const questao = await criarQuestaoForaDaTransacao(codigo);
        const cliente = await banco.connect();
        try {
            await cliente.query('BEGIN');
            await alteracao(cliente, questao);
            await assert.rejects(cliente.query('COMMIT'), erro =>
                erro.code === '23514' && erro.constraint === 'ck_questao_alternativas');
            await cliente.query('ROLLBACK').catch(() => {});
            const estado = await banco.query(`SELECT count(*)::integer AS total,
                count(*) FILTER (WHERE correta)::integer AS corretas
                FROM tbalternativa WHERE idquestao=$1`, [questao]);
            assert.deepEqual(estado.rows[0], { total: 4, corretas: 1 });
        } finally { cliente.release(); }
    }

    // Questões novas inválidas: nada pode ficar gravado depois do COMMIT recusado.
    async function rejeitarQuestaoNova(codigo, letras, correta) {
        const cliente = await banco.connect();
        try {
            await cliente.query('BEGIN');
            const questao = await criarQuestaoValida(cliente, codigo, false);
            if (letras.length) await cliente.query(`INSERT INTO tbalternativa (idquestao, letra, texto, correta)
                SELECT $1, letra, 'Alternativa ' || letra, COALESCE(letra = $2, false) FROM unnest($3::text[]) letra`,
                [questao, correta, letras]);
            await assert.rejects(cliente.query('COMMIT'), erro =>
                erro.code === '23514' && erro.constraint === 'ck_questao_alternativas');
            const gravada = await banco.query('SELECT count(*)::integer AS total FROM tbquestao WHERE codigo_origem=$1', [codigo]);
            assert.equal(gravada.rows[0].total, 0);
        } finally { cliente.release(); }
    }

    await rejeitarQuestaoNova('questao-tres-alternativas', ['A', 'B', 'C'], 'A');
    await rejeitarQuestaoNova('questao-quatro-sem-correta', ['A', 'B', 'C', 'D'], null);
    await rejeitarQuestaoNova('questao-sem-alternativas', [], null);
    await rejeitarNoCommit('questao-sem-correta', async (cliente, questao) => {
        await cliente.query('UPDATE tbalternativa SET correta=false WHERE idquestao=$1', [questao]);
    });
    await rejeitarNoCommit('questao-delete-alternativa', async (cliente, questao) => {
        await cliente.query("DELETE FROM tbalternativa WHERE idquestao=$1 AND letra='D'", [questao]);
    });
    await rejeitarNoCommit('questao-retira-correta', async (cliente, questao) => {
        await cliente.query("UPDATE tbalternativa SET correta=false WHERE idquestao=$1 AND letra='A'", [questao]);
    });

    const origem = await criarQuestaoForaDaTransacao('questao-origem-movimento');
    const destino = await criarQuestaoForaDaTransacao('questao-destino-movimento');
    const clienteMovimento = await banco.connect();
    try {
        await clienteMovimento.query('BEGIN');
        // O destino fica válido (perde a D e recebe a D da origem); só a origem fica com 3.
        await clienteMovimento.query("DELETE FROM tbalternativa WHERE idquestao=$1 AND letra='D'", [destino]);
        await clienteMovimento.query("UPDATE tbalternativa SET idquestao=$1 WHERE idquestao=$2 AND letra='D'", [destino, origem]);
        await assert.rejects(clienteMovimento.query('COMMIT'), erro =>
            erro.code === '23514' && erro.message.includes(`questão ${origem} `));
        await clienteMovimento.query('ROLLBACK').catch(() => {});
        for (const questao of [origem, destino]) {
            const estado = await banco.query(`SELECT count(*)::integer AS total,
                count(*) FILTER (WHERE correta)::integer AS corretas
                FROM tbalternativa WHERE idquestao=$1`, [questao]);
            assert.deepEqual(estado.rows[0], { total: 4, corretas: 1 });
        }
    } finally { clienteMovimento.release(); }

    const questaoTroca = await criarQuestaoForaDaTransacao('questao-troca-gabarito');
    const clienteTroca = await banco.connect();
    try {
        await clienteTroca.query('BEGIN');
        await clienteTroca.query("UPDATE tbalternativa SET correta=false WHERE idquestao=$1 AND letra='A'", [questaoTroca]);
        await clienteTroca.query("UPDATE tbalternativa SET correta=true WHERE idquestao=$1 AND letra='B'", [questaoTroca]);
        await clienteTroca.query('COMMIT');
        const corretas = await banco.query('SELECT letra FROM tbalternativa WHERE idquestao=$1 AND correta', [questaoTroca]);
        assert.deepEqual(corretas.rows.map(linha => linha.letra), ['B']);
    } catch (erro) {
        await clienteTroca.query('ROLLBACK').catch(() => {});
        throw erro;
    } finally { clienteTroca.release(); }

    const questaoOrdem = await criarQuestaoForaDaTransacao('questao-gabarito-ordem-invalida');
    const clienteOrdem = await banco.connect();
    try {
        await clienteOrdem.query('BEGIN');
        await assert.rejects(
            clienteOrdem.query("UPDATE tbalternativa SET correta=true WHERE idquestao=$1 AND letra='B'", [questaoOrdem]),
            erro => erro.code === '23505'
        );
        await clienteOrdem.query('ROLLBACK');
        const estado = await banco.query(`SELECT letra FROM tbalternativa WHERE idquestao=$1 AND correta`, [questaoOrdem]);
        assert.deepEqual(estado.rows.map(linha => linha.letra), ['A']);
    } finally { clienteOrdem.release(); }
});
