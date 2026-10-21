const express = require("express");
const { solicitarCodigo, redefinirSenha } = require("../controllers/recuperacaoController");
const { exigirJson } = require("../middlewares/autenticacao");
const router = express.Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.post("/solicitar", exigirJson, solicitarCodigo);
router.post("/redefinir", exigirJson, redefinirSenha);
module.exports = router;
