const express = require('express');
const { bcrypt, normalizarCpf, senhaValida, custoHash } = require('../auth/credenciais');
const exigirAutenticacao = require('../middleware/autenticacao');
const { nomeCookie, opcoesCookie } = require('../config/sessao');
const { randomBytes } = require('node:crypto');

function criarRotasLogin(pool, env = process.env) {
    const router = express.Router();
    // Uma comparacao tambem para CPF ausente reduz diferencas de tempo.
    const hashAusente = bcrypt.hash(randomBytes(32).toString('hex'), custoHash);
    router.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        next();
    });
    // Bloqueia requisicoes de outra origem; o frontend usa a mesma origem.
    router.use((req, res, next) => {
        const origem = req.get('origin');
        if (req.method === 'POST' && origem && origem !== `${req.protocol}://${req.get('host')}`) {
            return res.status(403).json({ mensagem: 'Origem não permitida' });
        }
        next();
    });

    router.post('/login', async (req, res, next) => {
        const cpf = normalizarCpf(req.body?.cpf);
        const senha = req.body?.senha;
        if (!/^\d{11}$/.test(cpf) || !senhaValida(senha)) {
            return res.status(400).json({ mensagem: 'Informe CPF com 11 dígitos e senha de até 72 bytes.' });
        }
        try {
            const resultado = await pool.query(
                'SELECT id, senha_hash FROM tbcandidato WHERE cpf = $1', [cpf]
            );
            const candidato = resultado.rows[0];
            const correta = await bcrypt.compare(senha, candidato ? candidato.senha_hash : await hashAusente);
            if (!candidato || !correta) {
                return res.status(401).json({ mensagem: 'CPF ou senha inválidos' });
            }
            // Renova o ID para impedir a reutilizacao da sessao anterior.
            req.session.regenerate((erro) => {
                if (erro) return next(erro);
                req.session.candidatoId = candidato.id;
                req.session.save((erroSalvar) => {
                    if (erroSalvar) return next(erroSalvar);
                    res.json({ mensagem: 'Login realizado com sucesso. A área do candidato ainda não está disponível.' });
                });
            });
        } catch (erro) {
            next(erro);
        }
    });

    router.get('/sessao', exigirAutenticacao, (req, res) => {
        res.json({ candidato: { id: req.session.candidatoId } });
    });

    router.post('/logout', (req, res, next) => {
        req.session.destroy((erro) => {
            if (erro) return next(erro);
            res.clearCookie(nomeCookie, opcoesCookie(env.NODE_ENV === 'production'));
            res.json({ mensagem: 'Sessão encerrada' });
        });
    });
    return router;
}

module.exports = criarRotasLogin;
