const session = require("express-session");
const NOME_COOKIE = "portal.sid";
const OPCOES_COOKIE = {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", path: "/",
};
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("Configure SESSION_SECRET no .env com pelo menos 32 caracteres aleatórios.");
}
// O armazenamento padrão em memória serve somente para desenvolvimento.
const sessao = session({
    name: NOME_COOKIE, secret: process.env.SESSION_SECRET,
    resave: false, saveUninitialized: false,
    cookie: { ...OPCOES_COOKIE, maxAge: 2 * 60 * 60 * 1000 },
});
module.exports = { sessao, NOME_COOKIE, OPCOES_COOKIE };
