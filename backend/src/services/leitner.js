// Repetição espaçada Leitner em 3 caixas.
// Cartão novo (sem progresso) entra na caixa 2 se o candidato sabia e na 1 se não sabia.
// Depois disso, acertar sobe uma caixa (até a 3) e errar sempre volta para a 1.
function proximaCaixa(caixaAtual, sabia) {
    if (typeof sabia !== 'boolean') throw new TypeError('sabia deve ser booleano.');
    if (caixaAtual !== null && ![1, 2, 3].includes(caixaAtual))
        throw new TypeError('caixaAtual deve ser 1, 2, 3 ou null.');
    if (caixaAtual === null) return sabia ? 2 : 1;
    return sabia ? Math.min(caixaAtual + 1, 3) : 1;
}

module.exports = { proximaCaixa };
