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
// Normaliza antes de servir arquivos para que aliases também exijam sessão.
const paginasPrivadas = new Set(["menu.html", "temas.html", "estudos.html", "exames.html", "exame.html", "certificados.html", "perfil.html"]);
app.use((req, res, next) => {
    try {
        const caminho = path.posix.normalize(decodeURIComponent(req.path).replace(/\\/g, "/"))
            .split("/").map(parte => parte.replace(/[. ]+$/, "")).join("/").toLowerCase();
        const arquivo = caminho.replace(/\/$/, "").replace(/^\/pages\//, "");
        if (paginasPrivadas.has(arquivo) && caminho.startsWith("/pages/")) {
            if (req.path !== "/pages/" + arquivo) return res.redirect("/pages/" + arquivo);
            return protegerMenu(req, res, next);
        }
    } catch { return res.sendStatus(400); }
    next();
});
app.use("/api/estudos", require("./routes/estudos"));
app.use("/api/exames", require("./routes/exames"));
app.use("/imagens", express.static(path.join(__dirname, "../../imagens")));
app.use(express.static(path.join(__dirname, "../../frontend")));
app.use("/temas", temasRoutes);
app.use("/api/candidatos", candidatosRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Portal de Certificação funcionando!"
    });
});

module.exports = app;