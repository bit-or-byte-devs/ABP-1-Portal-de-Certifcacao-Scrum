const candidatoModel = require("../models/candidatoModel");
const { NOME_COOKIE, OPCOES_COOKIE } = require("../config/sessao");
async function conferirSessao(req) {
    if (!req.session.candidatoId) return false;
    const candidato = await candidatoModel.buscarPorId(req.session.candidatoId);
    if (candidato && Number.isInteger(req.session.versaoSessao) &&
        candidato.versao_sessao === req.session.versaoSessao) {
        req.candidato = candidato;
        return true;
    }
    // Uma troca de senha aumenta a versão no banco; sessões antigas perdem acesso.
    await new Promise((resolve, reject) => req.session.destroy(erro => erro ? reject(erro) : resolve()));
    return false;
}
async function exigirSessao(req, res, next) {
    res.set("Cache-Control", "no-store");
    try {
        if (await conferirSessao(req)) return next();
        res.clearCookie(NOME_COOKIE, OPCOES_COOKIE);
        return res.status(401).json({ mensagem: "Faça login para continuar." });
    } catch { return res.status(503).json({ mensagem: "Não foi possível verificar a sessão." }); }
}
async function protegerMenu(req, res, next) {
    res.set("Cache-Control", "no-store");
    try {
        if (await conferirSessao(req)) return next();
        res.clearCookie(NOME_COOKIE, OPCOES_COOKIE);
        return res.redirect("/pages/login.html");
    } catch { return res.status(503).send("Não foi possível verificar a sessão. Tente novamente."); }
}
function exigirJson(req, res, next) {
    if (!req.is("application/json")) return res.status(415).json({ mensagem: "Envie os dados em JSON." });
    return next();
}
module.exports = { exigirSessao, protegerMenu, exigirJson };
