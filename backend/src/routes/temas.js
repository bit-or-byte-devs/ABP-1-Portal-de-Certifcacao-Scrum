const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nome, descricao, ordem
            FROM tbtema
            ORDER BY ordem
        `);

        res.json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao consultar temas:", erro.message);

        res.status(500).json({
            mensagem: "Não foi possível consultar os temas.",
        });
    }
});

module.exports = router;