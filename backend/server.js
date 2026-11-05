require("dotenv").config();

const app = require("./src/app");

const pool = require("./src/config/db");
const { encerrarQuestoesVencidas } = require("./src/services/encerramentoQuestao");
const { recalcularCertificacao } = require("./src/services/certificacao");
let varreduraEmAndamento = false;

async function varrerQuestoesVencidas() {
    if (varreduraEmAndamento) return;
    varreduraEmAndamento = true;
    let db;
    try {
        db = await pool.connect();
        await db.query("BEGIN");
        const certificacoes = await encerrarQuestoesVencidas(db);
        for (const idcertificacao of certificacoes) await recalcularCertificacao(db, idcertificacao);
        await db.query("COMMIT");
    } catch (erro) {
        if (db) await db.query("ROLLBACK").catch(() => {});
        console.error("Não foi possível encerrar as questões vencidas:", erro);
    } finally {
        db?.release();
        varreduraEmAndamento = false;
    }
}

varrerQuestoesVencidas();
setInterval(varrerQuestoesVencidas, 15000).unref();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}/pages/index.html`);
});
