const express = require("express");
const path = require("path");
const temasRoutes = require("./routes/temas");
const candidatosRoutes = require("./routes/candidatos");

const authRoutes = require("./routes/auth");
const { sessao } = require("./config/sessao");
const { protegerMenu } = require("./middlewares/autenticacao");
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(sessao);
app.use("/api/auth", authRoutes);
app.use("/api/auth/recuperacao", require("./routes/recuperacao"));
// A rota protegida vem antes dos arquivos estáticos.
app.get("/pages/menu.html", protegerMenu, (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/pages/menu.html"));
});
// Serve o front pela mesma origem da API, para o fetch("/api/...") funcionar
// Impede que caminhos alternativos sirvam o menu como arquivo público.
app.use((req, res, next) => {
    try {
        const caminho = decodeURIComponent(req.path).replace(/\\/g, "/");
        const caminhoNormalizado = path.posix.normalize(caminho)
            .split("/")
            .map(parte => parte.replace(/[. ]+$/, ""))
            .join("/").toLowerCase();
        if (caminhoNormalizado === "/pages/menu.html") {
            return res.redirect("/pages/menu.html");
        }
    } catch { return res.sendStatus(400); }
    next();
});
app.use(express.static(path.join(__dirname, "../../frontend")));
app.use("/temas", temasRoutes);
app.use("/api/candidatos", candidatosRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Portal de Certificação funcionando!"
    });
});

module.exports = app;