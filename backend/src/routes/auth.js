const express = require("express");
const { login, usuarioLogado, logout } = require("../controllers/authController");
const { exigirSessao, exigirJson } = require("../middlewares/autenticacao");
const router = express.Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.post("/login", exigirJson, login);
router.get("/usuario", exigirSessao, usuarioLogado);
router.post("/logout", exigirJson, logout);
module.exports = router;
