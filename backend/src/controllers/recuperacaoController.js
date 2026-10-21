const crypto = require("crypto");
const model = require("../models/recuperacaoModel");
const emailService = require("../services/emailRecuperacao");
const { obterSegredo, gerarCodigo, solicitacoesLivres } = require("../services/codigoRecuperacao");
const MENSAGEM = "Se houver uma conta com esse e-mail, enviaremos um código de recuperação.";
function falhar(res) {
    return res.status(503).json({ mensagem: "Não foi possível concluir a recuperação. Tente novamente mais tarde." });
}
async function solicitarCodigo(req, res) {
    const dados = req.body || {};
    const cpf = typeof dados.cpf === "string" ? dados.cpf.replace(/\D/g, "") : "";
    const email = typeof dados.email === "string" ? dados.email.trim().toLowerCase() : "";
    if (!/^\d{11}$/.test(cpf) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ mensagem: "Informe CPF e e-mail válidos." });
    }
    const solicitacaoId = crypto.randomUUID();
    try {
        obterSegredo();
        emailService.configuracao();
        const liberarSolicitacoes = solicitacoesLivres();
        if (!liberarSolicitacoes && (!await model.reservarLimite("envio-ip", req.ip, 10, 600) ||
            !await model.reservarLimite("conta-minuto", cpf, 1, 60) ||
            !await model.reservarLimite("conta-hora", cpf, 5, 3600))) {
            res.set("Retry-After", "60");
            return res.status(429).json({ mensagem: "Limite de solicitações atingido. Aguarde antes de tentar novamente.", aguardarSegundos: 60 });
        }
        const codigo = gerarCodigo();
        const candidato = await model.criarSolicitacao(cpf, email, solicitacaoId, codigo);
        if (candidato) {
            try {
                await emailService.enviarCodigo(candidato.email, codigo, solicitacaoId);
                await model.concluirEnvio(solicitacaoId, true);
            } catch {
                await model.concluirEnvio(solicitacaoId, false);
                console.error("Falha no envio de recuperação de senha.");
                return falhar(res);
            }
        }
        // Retorna um ID aleatório também para dados que não correspondem a uma conta.
        return res.status(202).json({ mensagem: MENSAGEM, solicitacaoId, aguardarSegundos: liberarSolicitacoes ? 0 : 60 });
    } catch {
        console.error("Falha ao processar solicitação de recuperação.");
        return falhar(res);
    }
}
async function redefinirSenha(req, res) {
    const { solicitacaoId, codigo, senha, confirmarSenha } = req.body || {};
    if (typeof solicitacaoId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(solicitacaoId) ||
        typeof codigo !== "string" || !/^\d{6}$/.test(codigo)) {
        return res.status(400).json({ mensagem: "Informe um código de seis dígitos e solicite a recuperação nesta página." });
    }
    if (typeof senha !== "string" || senha.length < 8 || senha.length > 1024 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
        return res.status(400).json({ mensagem: "A senha deve ter de 8 a 1024 caracteres, incluindo letras e números." });
    }
    if (senha !== confirmarSenha) return res.status(400).json({ mensagem: "As senhas não coincidem." });
    try {
        if (!await model.reservarLimite("validacao-ip", req.ip, 30, 600)) {
            return res.status(429).json({ mensagem: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." });
        }
        const resultado = await model.redefinirSenha(solicitacaoId, codigo, senha);
        const erros = {
            invalido: "Código inválido ou já utilizado. Confira os dados ou solicite outro código.",
            expirado: "Código expirado. Solicite outro código.",
            tentativas: "Limite de cinco tentativas atingido. Solicite outro código.",
        };
        if (resultado !== "sucesso") return res.status(400).json({ mensagem: erros[resultado] });
        return res.json({ mensagem: "Senha alterada com sucesso. Entre novamente com sua nova senha." });
    } catch {
        console.error("Falha ao redefinir senha.");
        return falhar(res);
    }
}
module.exports = { solicitarCodigo, redefinirSenha };
