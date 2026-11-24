const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const raiz = path.resolve(__dirname, '../..');
const CARTOES_POR_TEMA = 10;
const CODIGO = /^tema-\d{2}-fc\d{2}(?:-v\d+)?$/;
// Chave própria: não disputa o bloqueio usado pelo importador de questões.
const CHAVE_BLOQUEIO = 71423009;

function texto(valor) { return typeof valor === 'string' && valor.trim().length > 0; }

function validarImagem(imagem, codigo) {
    if (imagem === null) return null;
    if (!imagem || !texto(imagem.caminho) || !texto(imagem.alt)) throw new Error(`Imagem inválida: ${codigo}`);
    const absoluto = path.resolve(raiz, '.' + imagem.caminho);
    const relativo = path.relative(path.join(raiz, 'imagens'), absoluto);
    if (!imagem.caminho.startsWith('/imagens/') || relativo.startsWith('..') || path.isAbsolute(relativo) ||
        !fs.existsSync(absoluto) || !fs.statSync(absoluto).isFile())
        throw new Error(`Imagem ausente ou fora de imagens/: ${codigo}`);
    return { caminho: imagem.caminho, alt: imagem.alt.trim(), credito: texto(imagem.credito) ? imagem.credito.trim() : null };
}

function carregar(diretorio = path.join(raiz, 'database/flashcards'), { exigirTodos = false } = {}) {
    const codigos = new Set();
    const temas = new Set();
    const arquivos = fs.readdirSync(diretorio).filter(nome => nome.endsWith('.json')).sort();
    if (!arquivos.length) throw new Error('Nenhum arquivo de flashcards encontrado.');
    const cartoes = arquivos.flatMap(nome => {
        const dados = JSON.parse(fs.readFileSync(path.join(diretorio, nome), 'utf8'));
        if (!Number.isInteger(dados.tema) || dados.tema < 1 || dados.tema > 12 ||
            !texto(dados.fonte) || !Array.isArray(dados.flashcards))
            throw new Error(`Arquivo inválido: ${nome}`);
        if (temas.has(dados.tema)) throw new Error(`Tema ${dados.tema} repetido em mais de um arquivo: ${nome}`);
        temas.add(dados.tema);
        if (dados.flashcards.length !== CARTOES_POR_TEMA)
            throw new Error(`O arquivo ${nome} deve ter exatamente ${CARTOES_POR_TEMA} flashcards (tem ${dados.flashcards.length}).`);
        const prefixo = `tema-${String(dados.tema).padStart(2, '0')}-`;
        return dados.flashcards.map(cartao => {
            const codigo = cartao?.codigo;
            if (typeof codigo !== 'string' || !CODIGO.test(codigo) || !codigo.startsWith(prefixo))
                throw new Error(`Código fora do padrão em ${nome}: ${codigo}`);
            if (codigos.has(codigo)) throw new Error(`Flashcard duplicado: ${codigo}`);
            codigos.add(codigo);
            for (const campo of ['frente', 'verso', 'explicacao', 'fonte'])
                if (!texto(cartao[campo])) throw new Error(`Campo ${campo} vazio ou ausente: ${codigo}`);
            if (cartao.fonte.trim().length > 255) throw new Error(`Fonte com mais de 255 caracteres: ${codigo}`);
            // Conteúdo normalizado: espaços nas pontas não alteram o hash.
            const conteudo = {
                tema: dados.tema, codigo,
                frente: cartao.frente.trim(), verso: cartao.verso.trim(),
                explicacao: cartao.explicacao.trim(), fonte: cartao.fonte.trim(),
                imagem: validarImagem(cartao.imagem ?? null, codigo),
            };
            return { ...conteudo, hash: crypto.createHash('sha256').update(JSON.stringify(conteudo)).digest('hex') };
        });
    });
    if (exigirTodos) {
        const ausentes = Array.from({ length: 12 }, (_, i) => i + 1).filter(tema => !temas.has(tema));
        if (ausentes.length) throw new Error(`Faltam flashcards dos temas: ${ausentes.join(', ')}.`);
    }
    return cartoes;
}

async function importar(db, cartoes) {
    let inseridos = 0, existentes = 0, desativados = 0;
    await db.query('BEGIN');
    try {
        // Impede que duas execuções simultâneas dupliquem cartões ou imagens.
        await db.query('SELECT pg_advisory_xact_lock($1)', [CHAVE_BLOQUEIO]);
        const idsTema = new Map();
        for (const cartao of cartoes) {
            const anterior = await db.query('SELECT hash_origem FROM tbflashcard WHERE codigo_origem=$1', [cartao.codigo]);
            if (anterior.rows.length) {
                if (anterior.rows[0].hash_origem !== cartao.hash)
                    throw new Error(`Conteúdo alterado em ${cartao.codigo}. Use um novo código de versão.`);
                existentes++;
                continue;
            }
            if (!idsTema.has(cartao.tema)) {
                const tema = await db.query('SELECT id FROM tbtema WHERE ordem=$1', [cartao.tema]);
                if (!tema.rows.length) throw new Error(`Tema ${cartao.tema} não cadastrado. Importe os temas antes.`);
                idsTema.set(cartao.tema, tema.rows[0].id);
            }
            let idimagem = null;
            if (cartao.imagem) {
                const imagem = await db.query('INSERT INTO tbimagem (arquivo_ou_url, texto_alternativo, credito) VALUES ($1,$2,$3) RETURNING id',
                    [cartao.imagem.caminho, cartao.imagem.alt, cartao.imagem.credito]);
                idimagem = imagem.rows[0].id;
            }
            await db.query(`INSERT INTO tbflashcard (idtema, idimagem, frente, verso, explicacao, fonte, codigo_origem, hash_origem)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [idsTema.get(cartao.tema), idimagem, cartao.frente, cartao.verso, cartao.explicacao, cartao.fonte, cartao.codigo, cartao.hash]);
            inseridos++;
        }

        // O arquivo do tema é a fonte da verdade sobre quais cartões estão ativos.
        // Versões antigas ficam inativas, nunca são apagadas, preservando o progresso.
        const porTema = new Map();
        for (const cartao of cartoes) porTema.set(cartao.tema, [...(porTema.get(cartao.tema) || []), cartao.codigo]);
        for (const [ordem, codigos] of porTema) {
            const saiu = await db.query(`UPDATE tbflashcard f SET ativo=FALSE FROM tbtema t
                WHERE f.idtema=t.id AND t.ordem=$1 AND f.ativo AND NOT (f.codigo_origem = ANY($2::varchar[]))
                RETURNING f.id`, [ordem, codigos]);
            desativados += saiu.rows.length;
            await db.query(`UPDATE tbflashcard f SET ativo=TRUE FROM tbtema t
                WHERE f.idtema=t.id AND t.ordem=$1 AND NOT f.ativo AND f.codigo_origem = ANY($2::varchar[])`, [ordem, codigos]);
        }
        await db.query('COMMIT');
        return { inseridos, existentes, desativados };
    } catch (erro) {
        await db.query('ROLLBACK');
        throw erro;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const permitidos = ['--validar', '--migrar', '--exigir-todos'];
    const exigirTodos = args.includes('--exigir-todos');
    const modos = args.filter(arg => arg !== '--exigir-todos');
    if (args.some(arg => !permitidos.includes(arg)) || modos.length > 1 || new Set(args).size !== args.length ||
        (exigirTodos && modos[0] === '--migrar'))
        throw new Error('Use --validar, --migrar ou nenhum argumento para importar (--exigir-todos pode acompanhar --validar ou a importação).');
    if (modos[0] === '--validar') {
        console.log(`${carregar(undefined, { exigirTodos }).length} flashcards validados; banco não modificado.`);
        return;
    }
    const cartoes = modos.length ? null : carregar(undefined, { exigirTodos });
    require('dotenv').config({ path: path.join(raiz, 'backend/.env'), quiet: true });
    const pool = require('../src/config/db');
    let db;
    try {
        db = await pool.connect();
        if (modos[0] === '--migrar') {
            await db.query(fs.readFileSync(path.join(raiz, 'database/migrations/009_flashcards.sql'), 'utf8'));
            console.log('Migração 009 de flashcards aplicada.');
        } else console.log(await importar(db, cartoes));
    } finally { db?.release(); await pool.end(); }
}

if (require.main === module) main().catch(erro => { console.error(erro.message); process.exitCode = 1; });
module.exports = { carregar, importar };
