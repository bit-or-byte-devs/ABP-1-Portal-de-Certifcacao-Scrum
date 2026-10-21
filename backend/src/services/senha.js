// Hash de senha com scrypt, nativo do Node (sem dependência extra).
// Formato salvo em senha_hash: scrypt$<salt hex>$<hash hex>
const crypto = require("crypto");

const TAMANHO_CHAVE = 64;

function gerarHash(senha) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16);
        crypto.scrypt(senha, salt, TAMANHO_CHAVE, (erro, chave) => {
            if (erro) return reject(erro);
            resolve(`scrypt$${salt.toString("hex")}$${chave.toString("hex")}`);
        });
    });
}

// Usa o mesmo salt e scrypt do cadastro; não descriptografa a senha.
function verificarSenha(senha, hashSalvo) {
    if (typeof senha !== "string" || typeof hashSalvo !== "string") return Promise.resolve(false);
    const partes = hashSalvo.split("$");
    if (partes.length !== 3 || partes[0] !== "scrypt" ||
        !/^[a-f0-9]{32}$/i.test(partes[1]) || !/^[a-f0-9]{128}$/i.test(partes[2])) return Promise.resolve(false);
    const salt = Buffer.from(partes[1], "hex");
    const chaveSalva = Buffer.from(partes[2], "hex");
    return new Promise((resolve, reject) => {
        crypto.scrypt(senha, salt, TAMANHO_CHAVE, (erro, chave) => {
            if (erro) return reject(erro);
            // Os buffers têm o mesmo tamanho; a comparação evita diferenças de tempo.
            resolve(crypto.timingSafeEqual(chave, chaveSalva));
        });
    });
}
module.exports = { gerarHash, verificarSenha };
