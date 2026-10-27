const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const raiz = path.resolve(__dirname, '../..');
function texto(valor) { return typeof valor === 'string' && valor.trim().length > 0; }
function carregar(diretorio = path.join(raiz, 'database/questoes')) {
    const codigos = new Set();
    const arquivos = fs.readdirSync(diretorio).filter(n => n.endsWith('.json')).sort();
    if (!arquivos.length) throw new Error('Nenhum arquivo de questões encontrado.');
    return arquivos.flatMap(nome => {
        const dados = JSON.parse(fs.readFileSync(path.join(diretorio, nome), 'utf8'));
        if (!Number.isInteger(dados.tema) || dados.tema < 1 || dados.tema > 12 ||
            !texto(dados.fonte) || !Array.isArray(dados.questoes) || !dados.questoes.length)
            throw new Error(`Arquivo inválido: ${nome}`);
        return dados.questoes.map(q => {
            if (!/^tema-\d{2}-q\d{2}(?:-v\d+)?$/.test(q.codigo) || codigos.has(q.codigo) ||
                !q.codigo.startsWith(`tema-${String(dados.tema).padStart(2, '0')}-`) ||
                !texto(q.enunciado) || !texto(q.justificativa)) throw new Error(`Questão inválida ou duplicada: ${q.codigo}`);
            codigos.add(q.codigo);
            if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4 ||
                q.alternativas.map(a => a.letra).sort().join('') !== 'ABCD' ||
                q.alternativas.some(a => !texto(a.texto) || typeof a.correta !== 'boolean') ||
                q.alternativas.filter(a => a.correta).length !== 1) throw new Error(`Alternativas inválidas: ${q.codigo}`);
            if (q.imagem !== null) {
                if (!q.imagem || !texto(q.imagem.caminho) || !texto(q.imagem.alt)) throw new Error(`Imagem inválida: ${q.codigo}`);
                const absoluto = path.resolve(raiz, '.' + q.imagem.caminho);
                const relativo = path.relative(path.join(raiz, 'imagens'), absoluto);
                if (!q.imagem.caminho.startsWith('/imagens/') || relativo.startsWith('..') || path.isAbsolute(relativo) ||
                    !fs.existsSync(absoluto) || !fs.statSync(absoluto).isFile()) throw new Error(`Imagem ausente ou fora de imagens/: ${q.codigo}`);
            }
            const questao = { tema: dados.tema, codigo: q.codigo, enunciado: q.enunciado, justificativa: q.justificativa,
                imagem: q.imagem, alternativas: [...q.alternativas].sort((a,b) => a.letra.localeCompare(b.letra)) };
            return { ...questao, hash: crypto.createHash('sha256').update(JSON.stringify(questao)).digest('hex') };
        });
    });
}
async function importar(db, questoes, { vincularImagens = false } = {}) {
    let imagensVinculadas = 0;
    let inseridas = 0, existentes = 0;
    await db.query('BEGIN');
    try {
        // Impede que duas execuções deste importador dupliquem imagens ou questões.
        await db.query("SELECT pg_advisory_xact_lock(71423003)");
        for (const q of questoes) {
            const anterior = await db.query('SELECT hash_origem FROM tbquestao WHERE codigo_origem=$1', [q.codigo]);
            if (anterior.rows.length) {
                if (anterior.rows[0].hash_origem !== q.hash) {
                    const { hash, ...conteudo } = q;
                    const hashSemImagem = crypto.createHash('sha256').update(JSON.stringify({ ...conteudo, imagem: null })).digest('hex');
                    if (!vincularImagens || !q.imagem || anterior.rows[0].hash_origem !== hashSemImagem)
                        throw new Error(`Conteúdo alterado em ${q.codigo}. Preserve a questão antiga e use um novo código de versão.`);
                    // Só permite adicionar a imagem a uma questão cujo conteúdo original é idêntico.
                    const atual = await db.query('SELECT id, idimagem FROM tbquestao WHERE codigo_origem=$1 FOR UPDATE', [q.codigo]);
                    if (atual.rows[0].idimagem !== null) throw new Error(`Questão já possui outra imagem: ${q.codigo}`);
                    const img = await db.query('INSERT INTO tbimagem (arquivo_ou_url, texto_alternativo, credito) VALUES ($1,$2,$3) RETURNING id', [q.imagem.caminho, q.imagem.alt, q.imagem.credito || null]);
                    await db.query('UPDATE tbquestao SET idimagem=$1, hash_origem=$2 WHERE id=$3', [img.rows[0].id, q.hash, atual.rows[0].id]);
                    imagensVinculadas++;
                }
                existentes++; continue;
            }
            const tema = await db.query('SELECT id FROM tbtema WHERE ordem=$1', [q.tema]);
            if (!tema.rows.length) throw new Error(`Tema ${q.tema} não cadastrado. Execute o seed de temas antes.`);
            let imagem = null;
            if (q.imagem) {
                const r = await db.query('INSERT INTO tbimagem (arquivo_ou_url, texto_alternativo, credito) VALUES ($1,$2,$3) RETURNING id', [q.imagem.caminho, q.imagem.alt, q.imagem.credito || null]);
                imagem = r.rows[0].id;
            }
            const r = await db.query(`INSERT INTO tbquestao (idtema,idimagem,enunciado,justificativa,codigo_origem,hash_origem)
                VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [tema.rows[0].id, imagem, q.enunciado, q.justificativa, q.codigo, q.hash]);
            for (const a of q.alternativas) await db.query('INSERT INTO tbalternativa (idquestao,letra,texto,correta) VALUES ($1,$2,$3,$4)', [r.rows[0].id,a.letra,a.texto,a.correta]);
            inseridas++;
        }
        await db.query('COMMIT');
        return { inseridas, existentes, ...(vincularImagens ? { imagensVinculadas } : {}) };
    } catch (erro) { await db.query('ROLLBACK'); throw erro; }
}
async function main() {
    const args = process.argv.slice(2);
    if (args.some(a => !['--validar','--migrar','--vincular-imagens'].includes(a)) || args.length > 1) throw new Error('Use --validar, --migrar, --vincular-imagens ou nenhum argumento para importar.');
    if (args.includes('--validar')) { console.log(`${carregar().length} questões validadas; banco não modificado.`); return; }
    require('dotenv').config({ path: path.join(raiz, 'backend/.env'), quiet: true });
    const pool = require('../src/config/db');
    let db;
    try {
        db = await pool.connect();
        if (args.includes('--migrar')) {
            await db.query(fs.readFileSync(path.join(raiz, 'database/migrations/003_carga_questoes.sql'), 'utf8'));
            console.log('Migração de questões aplicada.');
        } else console.log(await importar(db, carregar(), { vincularImagens: args.includes('--vincular-imagens') }));
    } finally { db?.release(); await pool.end(); }
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { carregar, importar };
