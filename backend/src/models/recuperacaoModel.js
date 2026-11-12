const pool = require("../config/db");
const { VALIDADE_MINUTOS, protegerCodigo, conferirCodigo, protegerLimite } = require("../services/codigoRecuperacao");
const { gerarHash } = require("../services/senha");

async function transacao(operacao) {
    const cliente = await pool.connect();
    try {
        await cliente.query("BEGIN");
        const resultado = await operacao(cliente);
        await cliente.query("COMMIT");
        return resultado;
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally { cliente.release(); }
}
async function reservarLimite(tipo, valor, maximo, segundos) {
    // UPSERT atômico, inclusive com dois servidores ou pedidos simultâneos.
    const resultado = await pool.query(
        `INSERT INTO tblimite_recuperacao (chave, quantidade, reinicia_em)
         VALUES ($1, 1, clock_timestamp() + $3 * INTERVAL '1 second')
         ON CONFLICT (chave) DO UPDATE SET
           quantidade = CASE WHEN tblimite_recuperacao.reinicia_em <= clock_timestamp()
                        THEN 1 ELSE tblimite_recuperacao.quantidade + 1 END,
           reinicia_em = CASE WHEN tblimite_recuperacao.reinicia_em <= clock_timestamp()
                        THEN clock_timestamp() + $3 * INTERVAL '1 second'
                        ELSE tblimite_recuperacao.reinicia_em END
         WHERE tblimite_recuperacao.reinicia_em <= clock_timestamp()
            OR tblimite_recuperacao.quantidade < $2
         RETURNING chave`, [protegerLimite(tipo, valor), maximo, segundos]
    );
    return resultado.rowCount === 1;
}
// O e-mail chega normalizado (aparado e minúsculo); é único pelo índice uq_candidato_email.
async function criarSolicitacao(email, solicitacaoId, codigo) {
    return transacao(async cliente => {
        // Trava o candidato também para organizar reenvios e trocas concorrentes.
        const resultado = await cliente.query(
            "SELECT id, email FROM tbcandidato WHERE lower(email) = $1 FOR UPDATE", [email]
        );
        const candidato = resultado.rows[0];
        if (!candidato) return null;
        await cliente.query(
            `INSERT INTO tbrecuperacao_senha (candidato_id, solicitacao_id, codigo_hmac, expira_em)
             VALUES ($1, $2, $3, clock_timestamp() + $4 * INTERVAL '1 minute')
             ON CONFLICT (candidato_id) DO UPDATE SET
               solicitacao_id = EXCLUDED.solicitacao_id, codigo_hmac = EXCLUDED.codigo_hmac,
               expira_em = EXCLUDED.expira_em, tentativas = 0,
               enviada = FALSE, invalidada = FALSE, consumida_em = NULL`,
            [candidato.id, solicitacaoId, protegerCodigo(candidato.id, solicitacaoId, codigo), VALIDADE_MINUTOS]
        );
        return { email: candidato.email };
    });
}
async function concluirEnvio(solicitacaoId, enviada) {
    // Nunca ativa um pedido mais novo que já substituiu este.
    await pool.query(
        "UPDATE tbrecuperacao_senha SET enviada = $2, invalidada = NOT $2 WHERE solicitacao_id = $1",
        [solicitacaoId, enviada]
    );
}
// Conferência única para /verificar e /redefinir: as duas rotas somam erros no mesmo
// campo tentativas do pedido, então não existe contador separado.
async function conferirPedido(cliente, email, codigo) {
    // Sempre trava candidato primeiro, como no reenvio, para evitar deadlocks.
    const conta = await cliente.query("SELECT id FROM tbcandidato WHERE lower(email) = $1 FOR UPDATE", [email]);
    if (!conta.rows[0]) return { resultado: "invalido" };
    const candidatoId = conta.rows[0].id;
    // Só o pedido atual do candidato vale; um novo pedido substitui o anterior.
    const consulta = await cliente.query(
        `SELECT *, expira_em <= clock_timestamp() AS expirado
         FROM tbrecuperacao_senha WHERE candidato_id = $1 FOR UPDATE`,
        [candidatoId]
    );
    const pedido = consulta.rows[0];
    if (!pedido || !pedido.enviada || pedido.invalidada || pedido.consumida_em) return { resultado: "invalido" };
    if (pedido.tentativas >= 5) return { resultado: "tentativas" };
    if (pedido.expirado) return { resultado: "expirado" };
    if (!conferirCodigo(candidatoId, pedido.solicitacao_id, codigo, pedido.codigo_hmac)) {
        // O erro é gravado no COMMIT da transação, mesmo sem trocar a senha.
        await cliente.query("UPDATE tbrecuperacao_senha SET tentativas = tentativas + 1 WHERE candidato_id = $1", [candidatoId]);
        return { resultado: pedido.tentativas + 1 >= 5 ? "tentativas" : "invalido" };
    }
    return { resultado: "valido", candidatoId };
}
// Confere sem consumir: o código continua valendo para o /redefinir.
async function verificarCodigo(email, codigo) {
    return transacao(async cliente => (await conferirPedido(cliente, email, codigo)).resultado);
}
async function redefinirSenha(email, codigo, senha) {
    return transacao(async cliente => {
        // Confere de novo e consome na mesma operação; a verificação anterior não basta.
        const { resultado, candidatoId } = await conferirPedido(cliente, email, codigo);
        if (resultado !== "valido") return resultado;
        const senhaHash = await gerarHash(senha);
        // Senha, versão das sessões e consumo do código fazem parte do mesmo COMMIT.
        await cliente.query(
            "UPDATE tbcandidato SET senha_hash = $2, versao_sessao = versao_sessao + 1 WHERE id = $1",
            [candidatoId, senhaHash]
        );
        await cliente.query("UPDATE tbrecuperacao_senha SET consumida_em = clock_timestamp() WHERE candidato_id = $1", [candidatoId]);
        return "sucesso";
    });
}
module.exports = { reservarLimite, criarSolicitacao, concluirEnvio, verificarCodigo, redefinirSenha };
