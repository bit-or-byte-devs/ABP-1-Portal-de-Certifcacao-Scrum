const express = require('express');
const pool = require('../config/db');
const { exigirSessao, exigirJson } = require('../middlewares/autenticacao');

const router = express.Router();
router.use(exigirSessao);

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT t.id, t.nome, t.descricao, t.ordem,
            COALESCE(p.secoes, '{}'::varchar[]) AS vistos,
            COALESCE(m.codigos, '{}'::varchar[]) AS codigos
            FROM tbtema t
            LEFT JOIN tbprogresso_estudo p ON p.idtema=t.id AND p.idcandidato=$1
            LEFT JOIN LATERAL (
                SELECT array_agg(material.codigo_origem ORDER BY material.ordem) AS codigos
                FROM tbmaterial material
                WHERE material.idtema=t.id AND material.tipo='secao' AND material.codigo_origem IS NOT NULL
            ) m ON TRUE ORDER BY t.ordem`, [req.candidato.id]);
        res.json(rows.map(({ codigos, ...tema }) => {
            const validos = new Set(codigos);
            const vistos = [...new Set(tema.vistos.filter(codigo => validos.has(codigo)))];
            return { ...tema, vistos, total: codigos.length,
                percentual: codigos.length ? Math.round(vistos.length / codigos.length * 100) : 0 };
        }));
    } catch { res.status(503).json({ mensagem: 'Não foi possível carregar os temas.' }); }
});

router.param('ordem', (req, res, next, valor) => {
    if (!/^(?:[1-9]|1[0-2])$/.test(valor)) return res.status(400).json({ mensagem: 'Tema inválido.' });
    req.ordem = Number(valor); next();
});

router.get('/:ordem', async (req, res) => {
    try {
        const { rows: temas } = await pool.query('SELECT id, nome, descricao, ordem FROM tbtema WHERE ordem=$1', [req.ordem]);
        if (!temas.length) return res.status(404).json({ mensagem: 'Tema não cadastrado.' });
        const { rows: materiais } = await pool.query(`SELECT codigo_origem AS codigo, titulo, tipo, ordem, nivel, conteudo
            FROM tbmaterial WHERE idtema=$1 AND codigo_origem IS NOT NULL ORDER BY ordem`, [temas[0].id]);
        const introducao = materiais.find(material => material.tipo === 'introducao');
        const secoes = materiais.filter(material => material.tipo === 'secao').map(material => ({
            codigo: material.codigo, titulo: material.titulo, ordem: material.ordem,
            nivel: material.nivel, blocos: material.conteudo,
        }));
        if (!introducao || !secoes.length)
            return res.status(404).json({ mensagem: 'O material deste tema ainda não foi importado.' });
        res.json({ ...temas[0], introducao: introducao.conteudo, secoes, total: secoes.length });
    } catch { res.status(503).json({ mensagem: 'Não foi possível carregar o material.' }); }
});

router.put('/:ordem/progresso', exigirJson, async (req, res) => {
    const recebidos = req.body?.vistos;
    const prefixo = `tema-${String(req.ordem).padStart(2, '0')}-s`;
    if (!Array.isArray(recebidos) || recebidos.some(codigo => typeof codigo !== 'string' ||
        !codigo.startsWith(prefixo) || !/^tema-\d{2}-s\d{2,}$/.test(codigo)))
        return res.status(400).json({ mensagem: 'Progresso inválido.' });
    const vistos = [...new Set(recebidos)];
    try {
        const { rows: catalogo } = await pool.query(`SELECT t.id,
            COALESCE(array_agg(m.codigo_origem ORDER BY m.ordem)
                FILTER (WHERE m.codigo_origem IS NOT NULL), '{}'::varchar[]) AS codigos
            FROM tbtema t LEFT JOIN tbmaterial m ON m.idtema=t.id AND m.tipo='secao'
            WHERE t.ordem=$1 GROUP BY t.id`, [req.ordem]);
        if (!catalogo.length) return res.status(404).json({ mensagem: 'Tema não cadastrado.' });
        const permitidos = new Set(catalogo[0].codigos);
        if (vistos.length > permitidos.size || vistos.some(codigo => !permitidos.has(codigo)))
            return res.status(400).json({ mensagem: 'Progresso inválido.' });
        const { rows } = await pool.query(`INSERT INTO tbprogresso_estudo (idcandidato, idtema, secoes)
            VALUES ($1,$2,$3::varchar[]) ON CONFLICT (idcandidato, idtema) DO UPDATE SET secoes=ARRAY(
                SELECT DISTINCT unnest(tbprogresso_estudo.secoes || EXCLUDED.secoes) ORDER BY 1
            ), atualizado_em=CURRENT_TIMESTAMP RETURNING secoes`,
        [req.candidato.id, catalogo[0].id, vistos]);
        res.json({ vistos: rows[0].secoes });
    } catch { res.status(503).json({ mensagem: 'Não foi possível salvar o progresso. Tente novamente.' }); }
});

module.exports = router;
