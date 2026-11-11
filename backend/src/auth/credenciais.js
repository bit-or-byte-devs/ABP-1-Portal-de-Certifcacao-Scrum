const bcrypt = require('bcrypt');

function normalizarCpf(cpf) {
    return typeof cpf === 'string' ? cpf.replace(/[.\-\s]/g, '') : '';
}

function senhaValida(senha) {
    // bcrypt aceita ate 72 bytes; rejeitar evita truncar a senha silenciosamente.
    return typeof senha === 'string' && senha.length > 0 && Buffer.byteLength(senha, 'utf8') <= 72;
}

module.exports = { bcrypt, normalizarCpf, senhaValida, custoHash: 12 };
