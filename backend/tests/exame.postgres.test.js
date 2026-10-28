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
    const questao = await banco.query(`INSERT INTO tbquestao (idtema, idimagem, enunciado, justificativa)
        VALUES ($1, $2, 'Enunciado de teste', 'Justificativa de teste') RETURNING id`, [tema.rows[0].id, imagem.rows[0].id]);
    const alternativas = await banco.query(`INSERT INTO tbalternativa (idquestao, letra, texto, correta)
        SELECT $1, letra, 'Alternativa ' || letra, letra='A' FROM unnest(ARRAY['A','B','C','D']) letra
        RETURNING id, letra, texto`, [questao.rows[0].id]);
    return alternativas.rows;
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
