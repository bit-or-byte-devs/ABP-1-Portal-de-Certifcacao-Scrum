const DURACAO_QUESTAO_SEGUNDOS = 150;
const TOLERANCIA_REDE_SEGUNDOS = 2;

async function encerrarQuestoesVencidasDaCertificacao(db, idcertificacao) {
    // A mesma ordem de bloqueio das rotas evita disputa entre resposta e varredura.
    // O chamador mantém encerramento e recálculo na mesma transação.
    const { rows } = await db.query(`WITH certificacoes AS MATERIALIZED (
        SELECT c.id FROM tbcertificacao c
        WHERE ($1::integer IS NULL OR c.id=$1)
        AND EXISTS (SELECT 1 FROM tbresposta r WHERE r.idcertificacao=c.id
            AND r.situacao='em_andamento'
            AND clock_timestamp() > r.data_hora_exibicao + ($2::integer + $3::integer) * INTERVAL '1 second')
        ORDER BY c.id FOR UPDATE OF c
    )
    UPDATE tbresposta r SET situacao='tempo_esgotado', acertou=FALSE,
        idalternativa=NULL, data_hora_resposta=NULL,
        data_hora_encerramento=r.data_hora_exibicao + $2 * INTERVAL '1 second'
    FROM certificacoes c WHERE r.idcertificacao=c.id AND r.situacao='em_andamento'
        AND clock_timestamp() > r.data_hora_exibicao + ($2::integer + $3::integer) * INTERVAL '1 second'
    RETURNING r.idcertificacao`, [idcertificacao, DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS]);
    return [...new Set(rows.map(resposta => resposta.idcertificacao))];
}

async function interromperQuestoesEmAndamento(db, idcertificacao) {
    // O chamador trava a certificação e encerra as vencidas antes desta consulta.
    const { rowCount } = await db.query(`UPDATE tbresposta SET situacao='interrompida', acertou=FALSE,
        idalternativa=NULL, data_hora_resposta=NULL, data_hora_encerramento=CURRENT_TIMESTAMP
        WHERE idcertificacao=$1 AND situacao='em_andamento'
        AND clock_timestamp() <= data_hora_exibicao + ($2::integer + $3::integer) * INTERVAL '1 second'`,
    [idcertificacao, DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS]);
    return rowCount;
}

async function encerrarQuestoesVencidas(db) {
    return encerrarQuestoesVencidasDaCertificacao(db, null);
}

module.exports = {
    DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS,
    encerrarQuestoesVencidas, encerrarQuestoesVencidasDaCertificacao, interromperQuestoesEmAndamento,
};
