const DURACAO_QUESTAO_SEGUNDOS = 150;
const TOLERANCIA_REDE_SEGUNDOS = 2;
// A página aberta renova a questão a cada INTERVALO; sem sinal além do LIMITE, ela é interrompida.
const INTERVALO_SINAL_SEGUNDOS = 5;
const LIMITE_SEM_SINAL_SEGUNDOS = 15;

// Prazo final, abandono (último sinal + limite) e a condição de encerramento, sobre a linha r.
const PRAZO = "r.data_hora_exibicao + $2 * INTERVAL '1 second'";
const ABANDONO = "r.data_hora_ultimo_sinal + $4 * INTERVAL '1 second'";
const VENCIDA = `((${ABANDONO} < ${PRAZO} AND clock_timestamp() > ${ABANDONO})
    OR clock_timestamp() > ${PRAZO} + $3 * INTERVAL '1 second')`;

// Regra única de encerramento automático, usada por todos os pontos de entrada.
// Com idcertificacao nulo, reconcilia todas as certificações (varredura periódica).
// Abandono antes do prazo: interrompida no instante do abandono.
// Senão, prazo vencido além da tolerância: tempo esgotado no horário final.
async function reconciliarQuestoesAbertas(db, idcertificacao) {
    // A mesma ordem de bloqueio das rotas evita disputa entre resposta, sinal e varredura.
    // O chamador mantém encerramento e recálculo na mesma transação. A condição é repetida
    // no UPDATE para ser reavaliada sobre a linha atual caso um sinal tenha chegado na espera.
    const { rows } = await db.query(`WITH certificacoes AS MATERIALIZED (
        SELECT c.id FROM tbcertificacao c
        WHERE ($1::integer IS NULL OR c.id=$1)
        AND EXISTS (SELECT 1 FROM tbresposta r WHERE r.idcertificacao=c.id
            AND r.situacao='em_andamento' AND ${VENCIDA})
        ORDER BY c.id FOR UPDATE OF c
    )
    UPDATE tbresposta r SET
        situacao=CASE WHEN ${ABANDONO} < ${PRAZO} THEN 'interrompida' ELSE 'tempo_esgotado' END,
        acertou=FALSE, idalternativa=NULL, data_hora_resposta=NULL,
        data_hora_encerramento=LEAST(${ABANDONO}, ${PRAZO})
    FROM certificacoes c WHERE r.idcertificacao=c.id AND r.situacao='em_andamento' AND ${VENCIDA}
    RETURNING r.idcertificacao`,
    [idcertificacao, DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS, LIMITE_SEM_SINAL_SEGUNDOS]);
    return [...new Set(rows.map(resposta => resposta.idcertificacao))];
}

// Interrupção explícita: iniciar outro tema ou reabrir o mesmo, logout e aviso da página.
// Com idresposta, interrompe só aquela questão (se ainda estiver aberta).
async function interromperQuestoesEmAndamento(db, idcertificacao, idresposta = null) {
    // O chamador trava a certificação e reconcilia antes desta consulta.
    // Prazo de 150 s já vencido (dentro da tolerância): continua sendo tempo esgotado.
    const { rowCount } = await db.query(`UPDATE tbresposta SET acertou=FALSE,
        idalternativa=NULL, data_hora_resposta=NULL,
        situacao=CASE WHEN clock_timestamp() > data_hora_exibicao + $2 * INTERVAL '1 second'
            THEN 'tempo_esgotado' ELSE 'interrompida' END,
        data_hora_encerramento=LEAST(clock_timestamp(), data_hora_exibicao + $2 * INTERVAL '1 second')
        WHERE idcertificacao=$1 AND situacao='em_andamento' AND ($3::integer IS NULL OR id=$3)`,
    [idcertificacao, DURACAO_QUESTAO_SEGUNDOS, idresposta]);
    return rowCount;
}

async function encerrarQuestoesVencidas(db) {
    return reconciliarQuestoesAbertas(db, null);
}

module.exports = {
    DURACAO_QUESTAO_SEGUNDOS, TOLERANCIA_REDE_SEGUNDOS, INTERVALO_SINAL_SEGUNDOS, LIMITE_SEM_SINAL_SEGUNDOS,
    reconciliarQuestoesAbertas, encerrarQuestoesVencidas, interromperQuestoesEmAndamento,
};
