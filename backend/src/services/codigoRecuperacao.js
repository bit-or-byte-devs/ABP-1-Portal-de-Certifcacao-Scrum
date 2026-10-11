const crypto = require("crypto");
function obterSegredo() {
    const segredo = process.env.RECUPERACAO_SECRET;
    if (!segredo || segredo.length < 32 || segredo === process.env.SESSION_SECRET) {
        throw new Error("Configure RECUPERACAO_SECRET com um segredo próprio de pelo menos 32 caracteres.");
    }
    return segredo;
}
function gerarCodigo() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}
function protegerCodigo(candidatoId, solicitacaoId, codigo) {
    // Vincula os dígitos ao candidato e ao pedido, além de proteger com o segredo.
    return crypto.createHmac("sha256", obterSegredo())
        .update(JSON.stringify(["codigo", candidatoId, solicitacaoId, codigo])).digest("hex");
}
function conferirCodigo(candidatoId, solicitacaoId, codigo, hmacSalvo) {
    if (typeof hmacSalvo !== "string" || !/^[a-f0-9]{64}$/.test(hmacSalvo)) return false;
    const esperado = Buffer.from(protegerCodigo(candidatoId, solicitacaoId, codigo), "hex");
    return crypto.timingSafeEqual(esperado, Buffer.from(hmacSalvo, "hex"));
}
function protegerLimite(tipo, valor) {
    return crypto.createHmac("sha256", obterSegredo())
        .update(JSON.stringify(["limite", tipo, valor])).digest("hex");
}
// Opção temporária de teste; nunca libera solicitações em produção.
function solicitacoesLivres() {
    return process.env.NODE_ENV === "development" && process.env.RECUPERACAO_SOLICITACOES_LIVRES === "true";
}
module.exports = { obterSegredo, gerarCodigo, protegerCodigo, conferirCodigo, protegerLimite, solicitacoesLivres };
