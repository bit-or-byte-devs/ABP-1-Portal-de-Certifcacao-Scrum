const fs = require('node:fs');
const path = require('node:path');
const temas = require('./importar-temas');
const questoes = require('./importar-questoes');
const flashcards = require('./importar-flashcards');

const raiz = path.resolve(__dirname, '../..');
const migracoes = [
    '001_recuperacao_senha.sql',
    '002_progresso_estudos.sql',
    '003_carga_questoes.sql',
    '004_conteudo_temas.sql',
    '005_alternativas_questao.sql',
    '006_sinal_questao.sql',
    '007_versionamento_questoes.sql',
    // Ordem da integração US24/US25: as duas 007 e depois a consolidação.
    '007_historico_questoes.sql',
    '008_consolidacao_historico.sql',
    '008_email_unico.sql',
    // Flashcards por último: só depende de tbtema, tbimagem e tbcandidato.
    '009_flashcards.sql',
];
const tabelasBase = [
    'tbcandidato', 'tbtema', 'tbimagem', 'tbmaterial',
    'tbmaterial_por_imagem', 'tbquestao', 'tbalternativa',
];

function validarCatalogos(log = console.log) {
    const catalogos = { temas: temas.carregar(), questoes: questoes.carregar(), flashcards: flashcards.carregar() };
    const secoes = catalogos.temas.reduce((total, tema) => total + tema.secoes.length, 0);
    log(`Catálogos validados: ${catalogos.temas.length} temas, ${secoes} seções e ${catalogos.questoes.length} questões.`);
    const temasComCartoes = new Set(catalogos.flashcards.map(cartao => cartao.tema)).size;
    log(`Flashcards validados: ${catalogos.flashcards.length} cartões em ${temasComCartoes} temas.`);
    return catalogos;
}

async function preparar(pool, { log = console.log } = {}) {
    // Valida todos os catálogos e imagens antes de qualquer alteração no banco.
    const catalogos = validarCatalogos(log);
    const db = await pool.connect();
    let etapa = 'conferência da estrutura inicial';
    try {
        const { rows } = await db.query(
            'SELECT nome FROM unnest($1::text[]) AS tabelas(nome) WHERE to_regclass(nome) IS NULL',
            [tabelasBase],
        );
        if (rows.length) {
            throw new Error('Tabelas ausentes: ' + rows.map(linha => linha.nome).join(', ') +
                '. Para um banco novo, execute database/ddl/schema.sql antes da preparação. ' +
                'Não reaplique o schema em um banco existente.');
        }

        // Cada arquivo SQL e cada importador controla sua própria transação.
        // Etapas concluídas permanecem gravadas se uma etapa posterior falhar.
        for (const arquivo of migracoes) {
            etapa = `migração ${arquivo}`;
            log(`Aplicando ${etapa}...`);
            await db.query(fs.readFileSync(path.join(raiz, 'database/migrations', arquivo), 'utf8'));
        }

        etapa = 'importação dos temas';
        log('Importando temas e materiais...');
        const resultadoTemas = await temas.importar(db, catalogos.temas);
        log(`Temas e materiais: ${JSON.stringify(resultadoTemas)}`);

        etapa = 'importação das questões';
        log('Importando questões e alternativas...');
        const resultadoQuestoes = await questoes.importar(db, catalogos.questoes);
        log(`Questões: ${JSON.stringify(resultadoQuestoes)}`);

        etapa = 'importação dos flashcards';
        log('Importando flashcards...');
        const resultadoFlashcards = await flashcards.importar(db, catalogos.flashcards);
        log(`Flashcards: ${JSON.stringify(resultadoFlashcards)}`);
        log('Preparação do banco concluída.');
        return { temas: resultadoTemas, questoes: resultadoQuestoes, flashcards: resultadoFlashcards };
    } catch (erro) {
        // Encerra também transações abertas por uma migração que tenha falhado.
        await db.query('ROLLBACK').catch(() => {});
        throw new Error(`Falha na ${etapa}: ${erro.message}`, { cause: erro });
    } finally {
        db.release();
    }
}

async function main() {
    const argumentos = process.argv.slice(2);
    if (argumentos.length > 1 || argumentos.some(argumento => argumento !== '--validar'))
        throw new Error('Use --validar ou nenhum argumento para preparar o banco.');
    if (argumentos.includes('--validar')) {
        validarCatalogos();
        console.log('Banco não acessado.');
        return;
    }

    require('dotenv').config({ path: path.join(raiz, 'backend/.env'), quiet: true });
    const pool = require('../src/config/db');
    try {
        await preparar(pool);
    } finally {
        await pool.end();
    }
}

if (require.main === module) main().catch(erro => {
    console.error(erro.message);
    process.exitCode = 1;
});
module.exports = { preparar };
