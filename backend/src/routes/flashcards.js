const express = require('express');
const pool = require('../config/db');
const { exigirSessao } = require('../middlewares/autenticacao');

const router = express.Router();
router.use(exigirSessao);

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
