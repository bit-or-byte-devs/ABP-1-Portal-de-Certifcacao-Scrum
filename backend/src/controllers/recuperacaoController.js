const crypto = require("crypto");
const model = require("../models/recuperacaoModel");
const emailService = require("../services/emailRecuperacao");
const { VALIDADE_MINUTOS, obterSegredo, gerarCodigo, solicitacoesLivres } = require("../services/codigoRecuperacao");
const MENSAGEM = "Se houver uma conta com esse e-mail, enviaremos um código de recuperação.";
function falhar(res) {
    return res.status(503).json({ mensagem: "Não foi possível concluir a recuperação. Tente novamente mais tarde." });
}
// Mesmo critério do cadastro: e-mail aparado e minúsculo.
function lerEmail(valor) {
    const email = typeof valor === "string" ? valor.trim().toLowerCase() : "";
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
// Não aguarda o transporte: a resposta não pode depender de a conta existir nem do envio.
function enviarEmSegundoPlano(email, codigo, solicitacaoId) {
    emailService.enviarCodigo(email, codigo, solicitacaoId)
        .then(() => model.concluirEnvio(solicitacaoId, true))
        .catch(() => {
            // Sem código, e-mail ou detalhes do transporte no log.
            console.error("Falha no envio do código de recuperação de senha.");
            return model.concluirEnvio(solicitacaoId, false);
        })
        .catch(() => console.error("Falha ao registrar o resultado do envio de recuperação de senha."));
}
async function solicitarCodigo(req, res) {
    const email = lerEmail((req.body || {}).email);
    if (!email) return res.status(400).json({ mensagem: "Informe um e-mail válido." });
    try {
        obterSegredo();
        emailService.configuracao();
        const liberarSolicitacoes = solicitacoesLivres();
        if (!liberarSolicitacoes && (!await model.reservarLimite("envio-ip", req.ip, 10, 600) ||
            !await model.reservarLimite("email-minuto", email, 1, 60) ||
            !await model.reservarLimite("email-hora", email, 5, 3600))) {
            res.set("Retry-After", "60");
            return res.status(429).json({ mensagem: "Limite de solicitações atingido. Aguarde antes de tentar novamente.", aguardarSegundos: 60 });
        }
        const solicitacaoId = crypto.randomUUID();
        const codigo = gerarCodigo();
        const candidato = await model.criarSolicitacao(email, solicitacaoId, codigo);
        if (candidato) enviarEmSegundoPlano(candidato.email, codigo, solicitacaoId);
        // Mesmo status e mesmo corpo para conta existente, inexistente ou falha de envio.
        return res.status(202).json({ mensagem: MENSAGEM, expiraEmMinutos: VALIDADE_MINUTOS, aguardarSegundos: liberarSolicitacoes ? 0 : 60 });
    } catch {
        console.error("Falha ao processar solicitação de recuperação.");
        return falhar(res);
    }
}
// Mesmas respostas no /verificar e no /redefinir para código inválido, expirado ou já utilizado.
const ERROS_CODIGO = {
    invalido: "Código inválido ou já utilizado. Confira os dados ou solicite outro código.",
    expirado: "Código expirado. Solicite outro código.",
    tentativas: "Limite de cinco tentativas atingido. Solicite outro código.",
};
function lerEmailECodigo(corpo) {
    const email = lerEmail(corpo.email);
    const codigo = typeof corpo.codigo === "string" && /^\d{6}$/.test(corpo.codigo) ? corpo.codigo : "";
    return email && codigo ? { email, codigo } : null;
}
function recusarEmailECodigo(res) {
    return res.status(400).json({ mensagem: "Informe o e-mail e o código de seis dígitos recebido." });
}
// Limite por IP das validações, o mesmo nas duas rotas.
async function reservarValidacao(req, res) {
    if (await model.reservarLimite("validacao-ip", req.ip, 30, 600)) return true;
    res.status(429).json({ mensagem: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." });
    return false;
}
async function verificarCodigo(req, res) {
    const dados = lerEmailECodigo(req.body || {});
    if (!dados) return recusarEmailECodigo(res);
    try {
        if (!await reservarValidacao(req, res)) return;
        const resultado = await model.verificarCodigo(dados.email, dados.codigo);
        if (resultado !== "valido") return res.status(400).json({ mensagem: ERROS_CODIGO[resultado] });
        return res.json({ mensagem: "Código confirmado. Defina a nova senha." });
    } catch {
        console.error("Falha ao verificar código de recuperação.");
        return falhar(res);
    }
}
async function redefinirSenha(req, res) {
    const corpo = req.body || {};
    const dados = lerEmailECodigo(corpo);
    if (!dados) return recusarEmailECodigo(res);
    const { senha, confirmarSenha } = corpo;
    if (typeof senha !== "string" || senha.length < 8 || senha.length > 1024 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
        return res.status(400).json({ mensagem: "A senha deve ter de 8 a 1024 caracteres, incluindo letras e números." });
    }
    if (senha !== confirmarSenha) return res.status(400).json({ mensagem: "As senhas não coincidem." });
    try {
        if (!await reservarValidacao(req, res)) return;
        const resultado = await model.redefinirSenha(dados.email, dados.codigo, senha);
        if (resultado !== "sucesso") return res.status(400).json({ mensagem: ERROS_CODIGO[resultado] });
        return res.json({ mensagem: "Senha alterada com sucesso. Entre novamente com sua nova senha." });
    } catch {
        console.error("Falha ao redefinir senha.");
        return falhar(res);
    }
}
module.exports = { solicitarCodigo, verificarCodigo, redefinirSenha };
