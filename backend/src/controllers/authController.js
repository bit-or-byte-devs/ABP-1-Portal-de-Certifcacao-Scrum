const candidatoModel = require("../models/candidatoModel");
const pool = require("../config/db");
const { reconciliarQuestoesAbertas, interromperQuestoesEmAndamento } = require("../services/encerramentoQuestao");
const { recalcularCertificacao } = require("../services/certificacao");
const { verificarSenha } = require("../services/senha");
const { NOME_COOKIE, OPCOES_COOKIE } = require("../config/sessao");
const MSG_CREDENCIAIS = "CPF ou senha incorretos";
// Também calcula scrypt para CPF inexistente, reduzindo diferenças de tempo.
const HASH_AUSENTE = "scrypt$" + "00".repeat(16) + "$" + "00".repeat(64);
async function login(req, res) {
    const dados = req.body || {};
    const cpf = typeof dados.cpf === "string" ? dados.cpf.replace(/\D/g, "") : "";
    const senha = typeof dados.senha === "string" ? dados.senha : "";
    if (!/^\d{11}$/.test(cpf) || !senha || senha.length > 1024) {
        return res.status(401).json({ mensagem: MSG_CREDENCIAIS });
    }
    try {
        const candidato = await candidatoModel.buscarPorCpf(cpf);
        const senhaCorreta = await verificarSenha(senha, candidato ? candidato.senha_hash : HASH_AUSENTE);
        if (!candidato || !senhaCorreta) return res.status(401).json({ mensagem: MSG_CREDENCIAIS });
        // Troca o ID da sessão para não reutilizar uma sessão anterior.
        req.session.regenerate((erro) => {
            if (erro) return falhar(res);
            req.session.candidatoId = candidato.id;
            req.session.versaoSessao = candidato.versao_sessao;
            // Salva antes de responder: o menu já deve encontrar a sessão.
            req.session.save((erroSalvar) => {
                if (erroSalvar) return falhar(res);
                return res.json({ mensagem: "Login realizado com sucesso." });
            });
        });
    } catch { return falhar(res); }
}
async function usuarioLogado(req, res) {
    try {
        const candidato = await candidatoModel.buscarPorId(req.session.candidatoId);
        if (!candidato) {
            return req.session.destroy((erro) => {
                if (erro) return falhar(res);
                res.clearCookie(NOME_COOKIE, OPCOES_COOKIE);
                return res.status(401).json({ mensagem: "Faça login para continuar." });
            });
        }
        return res.json({ id: candidato.id, nome: candidato.nome });
    } catch { return falhar(res); }
}
// Sair durante uma questão a encerra como interrompida (RF14).
async function interromperQuestaoDoCandidato(idcandidato, versaoSessao) {
    let db;
    try {
        db = await pool.connect(); await db.query("BEGIN");
        const { rows } = await db.query(`SELECT id FROM tbcandidato
            WHERE id=$1 AND versao_sessao=$2 FOR UPDATE`, [idcandidato, versaoSessao]);
        const certificacao = rows.length ? await db.query(
            "SELECT id FROM tbcertificacao WHERE idcandidato=$1 FOR UPDATE", [idcandidato]
        ) : { rows: [] };
        if (certificacao.rows.length) {
            const idcertificacao = certificacao.rows[0].id;
            const reconciliadas = await reconciliarQuestoesAbertas(db, idcertificacao);
            const interrompidas = await interromperQuestoesEmAndamento(db, idcertificacao);
            if (reconciliadas.length || interrompidas) await recalcularCertificacao(db, idcertificacao);
        }
        await db.query("COMMIT");
    } catch {
        if (db) await db.query("ROLLBACK").catch(() => {});
        // Sem sessão a página para de mandar sinal; o servidor interrompe sozinho em até 15 s.
        console.error("Não foi possível interromper a questão no logout.");
    } finally { db?.release(); }
}
async function logout(req, res) {
    if (req.session.candidatoId) await interromperQuestaoDoCandidato(req.session.candidatoId, req.session.versaoSessao);
    req.session.destroy((erro) => {
        if (erro) return falhar(res);
        res.clearCookie(NOME_COOKIE, OPCOES_COOKIE);
        return res.json({ mensagem: "Sessão encerrada." });
    });
}
function falhar(res) {
    return res.status(500).json({ mensagem: "Não foi possível concluir a solicitação. Tente novamente." });
}
module.exports = { login, usuarioLogado, logout };
