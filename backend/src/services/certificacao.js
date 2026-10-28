async function recalcularCertificacao(db, idcertificacao) {
    await db.query(`UPDATE tbcertificacao SET total_acertos=s.acertos,
        percentual_acertos=round(s.acertos * 100.0 / 12, 2), nota_final=round(s.acertos * 100.0 / 12, 2),
        status=CASE WHEN s.respondidas=12 THEN 'concluida' ELSE 'em_andamento' END,
        data_conclusao=CASE WHEN s.respondidas=12 THEN COALESCE(data_conclusao, CURRENT_TIMESTAMP) ELSE NULL END
        FROM (SELECT count(*) FILTER (WHERE acertou)::integer AS acertos,
            count(*) FILTER (WHERE situacao <> 'em_andamento') AS respondidas
            FROM tbresposta WHERE idcertificacao=$1) s WHERE id=$1`, [idcertificacao]);
}

async function buscarProximoTemaPendente(db, idcertificacao, ordemAtual) {
    const { rows } = await db.query(`SELECT t.ordem FROM tbtema t
        WHERE NOT EXISTS (SELECT 1 FROM tbresposta r WHERE r.idcertificacao=$1
            AND r.idtema=t.id AND r.situacao <> 'em_andamento')
        ORDER BY (t.ordem > $2) DESC, t.ordem LIMIT 1`, [idcertificacao, ordemAtual]);
    return rows[0]?.ordem ?? null;
}

module.exports = { recalcularCertificacao, buscarProximoTemaPendente };
