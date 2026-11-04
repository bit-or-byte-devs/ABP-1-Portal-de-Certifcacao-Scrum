const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const raiz = path.resolve(__dirname, '../..');
const diretorioPadrao = path.join(raiz, 'database/temas');

function texto(valor) { return typeof valor === 'string' && valor.trim().length > 0; }

function validarPartes(conteudo, contexto) {
    if (texto(conteudo)) return;
    if (!Array.isArray(conteudo) || !conteudo.length) throw new Error(`Conteúdo inválido: ${contexto}`);
    for (const parte of conteudo) {
        if (!parte || !['texto', 'destaque', 'link'].includes(parte.tipo) || !texto(parte.texto))
            throw new Error(`Parte inválida: ${contexto}`);
        if (parte.tipo === 'link' && (!texto(parte.url) || !parte.url.startsWith('https://')))
            throw new Error(`Link inválido: ${contexto}`);
    }
}

function validarImagem(imagem, contexto) {
    if (!imagem || !texto(imagem.caminho) || !texto(imagem.texto_alternativo) ||
        !imagem.caminho.startsWith('/imagens/temas/')) throw new Error(`Imagem inválida: ${contexto}`);
    const base = path.join(raiz, 'frontend/imagens');
    const absoluto = path.resolve(path.join(raiz, 'frontend'), '.' + imagem.caminho);
    const relativo = path.relative(base, absoluto);
    if (relativo.startsWith('..') || path.isAbsolute(relativo) || !fs.existsSync(absoluto) ||
        !fs.statSync(absoluto).isFile()) throw new Error(`Imagem ausente ou fora de frontend/imagens: ${contexto}`);
}

function validarBloco(bloco, contexto) {
    if (!bloco || !texto(bloco.tipo)) throw new Error(`Bloco inválido: ${contexto}`);
    if (bloco.tipo === 'paragrafo' || bloco.tipo === 'referencia')
        return validarPartes(bloco.conteudo, contexto);
    if (bloco.tipo === 'lista') {
        if (typeof bloco.ordenada !== 'boolean' || !Array.isArray(bloco.itens) || !bloco.itens.length)
            throw new Error(`Lista inválida: ${contexto}`);
        bloco.itens.forEach((item, indice) => validarPartes(item, `${contexto}, item ${indice + 1}`));
        return;
    }
    if (bloco.tipo === 'imagem') return validarImagem(bloco, contexto);
    if (bloco.tipo === 'galeria') {
        if (!texto(bloco.rotulo) || !Array.isArray(bloco.imagens) || !bloco.imagens.length)
            throw new Error(`Galeria inválida: ${contexto}`);
        bloco.imagens.forEach((imagem, indice) => validarImagem(imagem, `${contexto}, imagem ${indice + 1}`));
        return;
    }
    throw new Error(`Tipo de bloco desconhecido: ${bloco.tipo}`);
}

function carregar(diretorio = diretorioPadrao) {
    const arquivos = fs.readdirSync(diretorio).filter(nome => nome.endsWith('.json')).sort();
    const esperados = Array.from({ length: 12 }, (_, indice) => `tema-${String(indice + 1).padStart(2, '0')}.json`);
    if (JSON.stringify(arquivos) !== JSON.stringify(esperados))
        throw new Error('A pasta de temas deve conter exatamente tema-01.json até tema-12.json.');
    const codigos = new Set();
    return arquivos.map((nome, indice) => {
        const tema = JSON.parse(fs.readFileSync(path.join(diretorio, nome), 'utf8'));
        const ordem = indice + 1;
        if (tema.versao_schema !== 1 || tema.tema !== ordem || tema.codigo !== `tema-${String(ordem).padStart(2, '0')}` ||
            !texto(tema.nome) || !texto(tema.descricao) || !texto(tema.fonte) ||
            !Array.isArray(tema.introducao) || !tema.introducao.length ||
            !Array.isArray(tema.secoes) || !tema.secoes.length) throw new Error(`Tema inválido: ${nome}`);
        tema.introducao.forEach((bloco, blocoIndice) => validarBloco(bloco, `${nome}, introdução ${blocoIndice + 1}`));
        tema.secoes.forEach((secao, secaoIndice) => {
            const codigo = `${tema.codigo}-s${String(secaoIndice + 1).padStart(2, '0')}`;
            if (secao.codigo !== codigo || codigos.has(codigo) || secao.ordem !== secaoIndice + 1 ||
                !texto(secao.titulo) || ![3, 4].includes(secao.nivel) || !Array.isArray(secao.blocos))
                throw new Error(`Seção inválida: ${codigo}`);
            codigos.add(codigo);
            secao.blocos.forEach((bloco, blocoIndice) => validarBloco(bloco, `${codigo}, bloco ${blocoIndice + 1}`));
        });
        return tema;
    });
}

function imagensDosBlocos(blocos) {
    return blocos.flatMap(bloco => bloco.tipo === 'imagem' ? [bloco] : bloco.tipo === 'galeria' ? bloco.imagens : []);
}

function materiaisDoTema(tema) {
    const materiais = [{
        codigo: `${tema.codigo}-introducao`, titulo: 'Introdução', tipo: 'introducao',
        ordem: 0, nivel: null, conteudo: tema.introducao,
    }, ...tema.secoes.map(secao => ({
        codigo: secao.codigo, titulo: secao.titulo, tipo: 'secao', ordem: secao.ordem,
        nivel: secao.nivel, conteudo: secao.blocos,
    }))];
    return materiais.map(material => ({
        ...material,
        hash: crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex'),
    }));
}

async function importar(db, temas) {
    let inseridos = 0, atualizados = 0, existentes = 0;
    const codigosAtuais = temas.flatMap(tema => materiaisDoTema(tema).map(material => material.codigo));
    await db.query('BEGIN');
    try {
        await db.query('SELECT pg_advisory_xact_lock(71423004)');
        for (const tema of temas) {
            const cadastro = await db.query(`INSERT INTO tbtema (nome, descricao, ordem) VALUES ($1,$2,$3)
                ON CONFLICT (ordem) DO UPDATE SET nome=EXCLUDED.nome, descricao=EXCLUDED.descricao RETURNING id`,
            [tema.nome, tema.descricao, tema.tema]);
            const idtema = cadastro.rows[0].id;
            for (const material of materiaisDoTema(tema)) {
                const anterior = await db.query('SELECT id, hash_origem FROM tbmaterial WHERE codigo_origem=$1 FOR UPDATE', [material.codigo]);
                let idmaterial;
                if (!anterior.rows.length) {
                    const criado = await db.query(`INSERT INTO tbmaterial
                        (idtema,titulo,conteudo_ou_url,tipo,ordem,codigo_origem,hash_origem,nivel,conteudo)
                        VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,$8::jsonb) RETURNING id`,
                    [idtema, material.titulo, material.tipo, material.ordem, material.codigo,
                        material.hash, material.nivel, JSON.stringify(material.conteudo)]);
                    idmaterial = criado.rows[0].id; inseridos++;
                } else {
                    idmaterial = anterior.rows[0].id;
                    if (anterior.rows[0].hash_origem === material.hash) existentes++;
                    else {
                        await db.query(`UPDATE tbmaterial SET idtema=$1,titulo=$2,conteudo_ou_url=NULL,
                            tipo=$3,ordem=$4,hash_origem=$5,nivel=$6,conteudo=$7::jsonb WHERE id=$8`,
                        [idtema, material.titulo, material.tipo, material.ordem, material.hash,
                            material.nivel, JSON.stringify(material.conteudo), idmaterial]);
                        atualizados++;
                    }
                }
                await db.query('DELETE FROM tbmaterial_por_imagem WHERE idmaterial=$1', [idmaterial]);
                for (const imagem of imagensDosBlocos(material.conteudo)) {
                    const credito = imagem.credito || null;
                    let registro = await db.query(`SELECT id FROM tbimagem WHERE arquivo_ou_url=$1
                        AND texto_alternativo=$2 AND credito IS NOT DISTINCT FROM $3 ORDER BY id LIMIT 1`,
                    [imagem.caminho, imagem.texto_alternativo, credito]);
                    if (!registro.rows.length) registro = await db.query(`INSERT INTO tbimagem
                        (arquivo_ou_url,texto_alternativo,credito) VALUES ($1,$2,$3) RETURNING id`,
                    [imagem.caminho, imagem.texto_alternativo, credito]);
                    await db.query(`INSERT INTO tbmaterial_por_imagem (idmaterial,idimagem)
                        VALUES ($1,$2) ON CONFLICT DO NOTHING`, [idmaterial, registro.rows[0].id]);
                }
            }
        }
        await db.query(`DELETE FROM tbmaterial_por_imagem mpi USING tbmaterial m, tbtema t
            WHERE mpi.idmaterial=m.id AND m.idtema=t.id AND
            ((m.codigo_origem IS NULL AND m.tipo='html' AND m.conteudo_ou_url=('/api/estudos/' || t.ordem::text))
             OR (m.codigo_origem ~ '^tema-(0[1-9]|1[0-2])-(introducao|s[0-9]+)$'
                 AND NOT (m.codigo_origem = ANY($1::varchar[]))))`, [codigosAtuais]);
        const removidos = await db.query(`DELETE FROM tbmaterial m USING tbtema t WHERE m.idtema=t.id AND
            ((m.codigo_origem IS NULL AND m.tipo='html' AND m.conteudo_ou_url=('/api/estudos/' || t.ordem::text))
             OR (m.codigo_origem ~ '^tema-(0[1-9]|1[0-2])-(introducao|s[0-9]+)$'
                 AND NOT (m.codigo_origem = ANY($1::varchar[]))))`, [codigosAtuais]);
        await db.query('COMMIT');
        return { inseridos, atualizados, existentes, removidos: removidos.rowCount || 0 };
    } catch (erro) { await db.query('ROLLBACK'); throw erro; }
}

async function main() {
    const argumentos = process.argv.slice(2);
    if (argumentos.some(item => !['--validar', '--migrar'].includes(item)) || argumentos.length > 1)
        throw new Error('Use --validar, --migrar ou nenhum argumento para importar.');
    const temas = carregar();
    if (argumentos.includes('--validar')) {
        const secoes = temas.reduce((total, tema) => total + tema.secoes.length, 0);
        console.log(`${temas.length} temas e ${secoes} seções validados; banco não modificado.`); return;
    }
    require('dotenv').config({ path: path.join(raiz, 'backend/.env'), quiet: true });
    const pool = require('../src/config/db');
    let db;
    try {
        db = await pool.connect();
        if (argumentos.includes('--migrar')) {
            await db.query(fs.readFileSync(path.join(raiz, 'database/migrations/004_conteudo_temas.sql'), 'utf8'));
            console.log('Migração dos temas aplicada.');
        } else console.log(await importar(db, temas));
    } finally { db?.release(); await pool.end(); }
}

if (require.main === module) main().catch(erro => { console.error(erro.message); process.exitCode = 1; });
module.exports = { carregar, importar, materiaisDoTema };
