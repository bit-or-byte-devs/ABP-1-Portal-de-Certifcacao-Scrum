const crypto = require("node:crypto");
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

function isValidCpf(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calculateDigit = (length) => {
        const sum = cpf
            .slice(0, length)
            .split("")
            .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
        const remainder = (sum * 10) % 11;
        return String(remainder === 10 ? 0 : remainder);
    };

    return calculateDigit(9) === cpf[9]
        && calculateDigit(10) === cpf[10];
}

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
}

router.post("/", async (req, res) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const senha = typeof body.senha === "string" ? body.senha : "";

    if (!nome || nome.length > 150) {
        return res.status(400).json({ mensagem: "Informe um nome válido." });
    }

    if (!isValidCpf(cpf)) {
        return res.status(400).json({ mensagem: "Informe um CPF válido." });
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ mensagem: "Informe um e-mail válido." });
    }

    if (senha.length < 8) {
        return res.status(400).json({ mensagem: "A senha deve ter pelo menos 8 caracteres." });
    }

    if (body.aceiteTermos !== true) {
        return res.status(400).json({ mensagem: "É preciso aceitar os termos para criar a conta." });
    }

    try {
        const senhaHash = await hashPassword(senha);
        const resultado = await pool.query(
            `INSERT INTO tbcandidato
                (cpf, nome_completo, email, senha_hash, data_aceite_termos)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING id`,
            [cpf, nome, email, senhaHash]
        );

        return res.status(201).json({
            mensagem: "Conta criada com sucesso.",
            id: resultado.rows[0].id
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ mensagem: "Já existe uma conta com este CPF." });
        }

        console.error("Erro ao criar candidato:", error.message);
        return res.status(500).json({ mensagem: "Não foi possível criar sua conta." });
    }
});

module.exports = router;
