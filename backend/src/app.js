const express = require("express");
const temasRoutes = require("./routes/temas");
const candidatosRoutes = require("./routes/candidatos");

const app = express();

app.use(express.json());
app.use("/temas", temasRoutes);
app.use("/api/candidatos", candidatosRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Portal de Certificação funcionando!"
    });
});

module.exports = app;