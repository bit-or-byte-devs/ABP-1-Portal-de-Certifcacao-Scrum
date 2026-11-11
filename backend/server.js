const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const app = require("./src/app");

const pool = require("./src/config/db");
const { reconciliarQuestoesAbertas } = require("./src/services/encerramentoQuestao");
const { recalcularCertificacao } = require("./src/services/certificacao");
let varreduraEmAndamento = false;

async function varrerQuestoesVencidas() {
    if (varreduraEmAndamento) return;
    varreduraEmAndamento = true;
    let db;
    try {
        db = await pool.connect();
        await db.query("BEGIN");
        // Encerra por tempo esgotado e por falta de sinal (abandono), em todas as certificações.
        const certificacoes = await reconciliarQuestoesAbertas(db, null);
        for (const idcertificacao of certificacoes) await recalcularCertificacao(db, idcertificacao);
        await db.query("COMMIT");
    } catch (erro) {
        if (db) await db.query("ROLLBACK").catch(() => {});
        console.error("Não foi possível reconciliar as questões abertas:", erro);
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
