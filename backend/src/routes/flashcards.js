const express = require('express');
const pool = require('../config/db');
const { exigirSessao, exigirJson } = require('../middlewares/autenticacao');
const { proximaCaixa } = require('../services/leitner');

const router = express.Router();
router.use(exigirSessao);

const MODOS = ['tema', 'revisao', 'aleatorio'];
const CODIGO = /^tema-\d{2}-fc\d{2}(?:-v\d+)?$/;
const LIMITE_PADRAO = 20, LIMITE_MINIMO = 5, LIMITE_MAXIMO = 40;

// Colunas comuns às três sessões; a ordem de cada modo vem no ORDER BY.
const SELECAO_SESSAO = `SELECT f.codigo_origem AS codigo, t.ordem, t.nome, f.frente, f.verso, f.explicacao, f.fonte,
        i.arquivo_ou_url AS caminho, i.texto_alternativo AS alt, p.caixa
    FROM tbflashcard f
    JOIN tbtema t ON t.id=f.idtema
    LEFT JOIN tbimagem i ON i.id=f.idimagem
    LEFT JOIN tbprogresso_flashcard p ON p.idflashcard=f.id AND p.idcandidato=$1`;
const CONSULTAS_SESSAO = {
    // Caixa 1, caixa 2, novos e caixa 3; aleatório dentro de cada grupo.
    tema: `${SELECAO_SESSAO}
        WHERE f.ativo AND t.ordem = ANY($2::int[])
        ORDER BY CASE WHEN p.caixa=1 THEN 0 WHEN p.caixa=2 THEN 1 WHEN p.caixa IS NULL THEN 2 ELSE 3 END, random()
        LIMIT $3`,
    // Só os errados: caixa 1 (última resposta "Não sabia"). Novos, caixa 2 e caixa 3 ficam de fora;
    // a caixa 2 é priorizada no modo tema, logo depois da caixa 1.
    revisao: `${SELECAO_SESSAO}
        WHERE f.ativo AND p.caixa = 1 AND (cardinality($2::int[]) = 0 OR t.ordem = ANY($2::int[]))
        ORDER BY random()
        LIMIT $3`,
    aleatorio: `${SELECAO_SESSAO}
        WHERE f.ativo
        ORDER BY random()
        LIMIT $2`,
};

function lerTemas(valor) {
    if (valor === undefined || valor === '') return [];
    if (typeof valor !== 'string' || !/^\d{1,2}(?:,\d{1,2})*$/.test(valor)) return null;
    const temas = valor.split(',').map(Number);
    if (temas.some(tema => tema < 1 || tema > 12) || new Set(temas).size !== temas.length) return null;
    return temas;
}

function lerLimite(valor) {
    if (valor === undefined) return LIMITE_PADRAO;
    if (typeof valor !== 'string' || !/^\d{1,2}$/.test(valor)) return null;
    const limite = Number(valor);
    return limite >= LIMITE_MINIMO && limite <= LIMITE_MAXIMO ? limite : null;
}

// Monta a sessão de estudo. O candidato vem sempre da sessão, nunca da URL.
router.get('/sessao', async (req, res) => {
    const { modo } = req.query;
    if (typeof modo !== 'string' || !MODOS.includes(modo))
        return res.status(400).json({ mensagem: 'Modo inválido. Use tema, revisao ou aleatorio.' });
    const temas = modo === 'aleatorio' ? [] : lerTemas(req.query.temas);
    if (temas === null)
        return res.status(400).json({ mensagem: 'Temas inválidos. Informe ordens de 1 a 12, separadas por vírgula e sem repetição.' });
    if (modo === 'tema' && !temas.length)
        return res.status(400).json({ mensagem: 'Escolha ao menos um tema.' });
    const limite = lerLimite(req.query.limite);
    if (limite === null)
        return res.status(400).json({ mensagem: `Limite inválido. Use um número inteiro de ${LIMITE_MINIMO} a ${LIMITE_MAXIMO}.` });
    try {
        const parametros = modo === 'aleatorio' ? [req.candidato.id, limite] : [req.candidato.id, temas, limite];
        const { rows } = await pool.query(CONSULTAS_SESSAO[modo], parametros);
        res.json({
            modo,
            cartoes: rows.map(linha => ({
                codigo: linha.codigo,
                tema: { ordem: linha.ordem, nome: linha.nome },
                frente: linha.frente, verso: linha.verso, explicacao: linha.explicacao, fonte: linha.fonte,
                imagem: linha.caminho ? { caminho: linha.caminho, alt: linha.alt } : null,
                caixa: linha.caixa,
            })),
        });
    } catch { res.status(503).json({ mensagem: 'Não foi possível montar a sessão de flashcards.' }); }
});

// Registra a resposta do candidato e move o cartão entre as caixas.
router.post('/:codigo/resultado', exigirJson, async (req, res) => {
    const { codigo } = req.params;
    if (!CODIGO.test(codigo)) return res.status(400).json({ mensagem: 'Código de flashcard inválido.' });
    const sabia = req.body?.sabia;
    if (typeof sabia !== 'boolean') return res.status(400).json({ mensagem: 'Informe sabia como verdadeiro ou falso.' });
    let db;
    try {
        db = await pool.connect();
        await db.query('BEGIN');
        const cartao = await db.query('SELECT id, idtema FROM tbflashcard WHERE codigo_origem=$1 AND ativo', [codigo]);
        if (!cartao.rows.length) {
            await db.query('ROLLBACK');
            return res.status(404).json({ mensagem: 'Flashcard não encontrado.' });
        }
        const { id, idtema } = cartao.rows[0];
        // Serializa respostas simultâneas do mesmo candidato para o mesmo cartão.
        await db.query('SELECT pg_advisory_xact_lock($1, $2)', [req.candidato.id, id]);
        const atual = await db.query('SELECT caixa FROM tbprogresso_flashcard WHERE idcandidato=$1 AND idflashcard=$2',
            [req.candidato.id, id]);
        const caixa = proximaCaixa(atual.rows[0]?.caixa ?? null, sabia);
        const { rows } = await db.query(`INSERT INTO tbprogresso_flashcard (idcandidato, idflashcard, caixa, acertos, erros, ultima_revisao)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (idcandidato, idflashcard) DO UPDATE SET caixa=EXCLUDED.caixa,
                acertos=tbprogresso_flashcard.acertos + EXCLUDED.acertos,
                erros=tbprogresso_flashcard.erros + EXCLUDED.erros,
                ultima_revisao=CURRENT_TIMESTAMP
            RETURNING caixa, acertos, erros`, [req.candidato.id, id, caixa, sabia ? 1 : 0, sabia ? 0 : 1]);
        const dominio = await db.query(`SELECT count(f.id)::int AS total, count(p.idflashcard) FILTER (WHERE p.caixa=3)::int AS caixa3
            FROM tbflashcard f
            LEFT JOIN tbprogresso_flashcard p ON p.idflashcard=f.id AND p.idcandidato=$1
            WHERE f.idtema=$2 AND f.ativo`, [req.candidato.id, idtema]);
        await db.query('COMMIT');
        const { total, caixa3 } = dominio.rows[0];
        res.json({ ...rows[0], dominioTema: total ? Math.round(caixa3 / total * 100) : 0 });
    } catch {
        await db?.query('ROLLBACK').catch(() => {});
        res.status(503).json({ mensagem: 'Não foi possível registrar a resposta. Tente novamente.' });
    } finally { db?.release(); }
});

function resumir({ total, novos, caixa1, caixa2, caixa3 }) {
    return { total, novos, caixa1, caixa2, caixa3, dominio: total ? Math.round(caixa3 / total * 100) : 0 };
}

// Resumo de domínio por tema: só cartões ativos e só o progresso do candidato da sessão.
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT t.ordem, t.nome,
                count(f.id)::int AS total,
                count(f.id) FILTER (WHERE p.idflashcard IS NULL)::int AS novos,
                count(p.idflashcard) FILTER (WHERE p.caixa=1)::int AS caixa1,
                count(p.idflashcard) FILTER (WHERE p.caixa=2)::int AS caixa2,
                count(p.idflashcard) FILTER (WHERE p.caixa=3)::int AS caixa3
            FROM tbtema t
            LEFT JOIN tbflashcard f ON f.idtema=t.id AND f.ativo
            LEFT JOIN tbprogresso_flashcard p ON p.idflashcard=f.id AND p.idcandidato=$1
            GROUP BY t.id ORDER BY t.ordem`, [req.candidato.id]);
        const temas = rows.map(({ ordem, nome, ...totais }) => ({ ordem, nome, ...resumir(totais) }));
        const somar = campo => temas.reduce((soma, tema) => soma + tema[campo], 0);
        const geral = resumir({ total: somar('total'), novos: somar('novos'),
            caixa1: somar('caixa1'), caixa2: somar('caixa2'), caixa3: somar('caixa3') });
        res.json({ temas, geral });
    } catch { res.status(503).json({ mensagem: 'Não foi possível carregar os flashcards.' }); }
});

module.exports = router;
