function exigirAutenticacao(req, res, next) {
    if (!req.session.candidatoId) {
        return res.status(401).json({ mensagem: 'Autenticação necessária' });
    }
    next();
}

module.exports = exigirAutenticacao;
