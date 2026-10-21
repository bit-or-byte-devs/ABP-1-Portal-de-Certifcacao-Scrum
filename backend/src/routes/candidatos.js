/* Rotas de candidatos */

"use strict";

const express = require("express");
const { cadastrar } = require("../controllers/candidatoController");

const router = express.Router();

router.post("/", cadastrar);

module.exports = router;
