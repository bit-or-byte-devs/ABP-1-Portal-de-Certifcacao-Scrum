/* Cadastro de candidatos */

"use strict";

const candidatoModel = require("../models/candidatoModel");
const { gerarHash } = require("../services/senha");

const MSG_CPF_DUPLICADO = "Este CPF já possui cadastro.";

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

// Confere os dois dígitos verificadores (mesma regra do form.js)
function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[t])) return false;
  }
  return true;
}

function validar(dados) {
  const nome = String(dados.nome || "").trim();
  const email = String(dados.email || "").trim();
  const senha = typeof dados.senha === "string" ? dados.senha : "";

  if (!nome || nome.length > 150) return "Informe o nome completo.";
  if (nome.split(/\s+/).length < 2) return "Informe nome e sobrenome.";
  if (!cpfValido(somenteDigitos(dados.cpf))) return "Informe um CPF válido.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail válido.";
  if (senha.length > 1024) return "A senha deve ter no máximo 1024 caracteres.";
  if (senha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return "A senha deve ter letras e números.";
  if (dados.aceiteTermos !== true) return "É preciso aceitar os termos para criar a conta.";
  return "";
}

async function cadastrar(req, res) {
  const dados = req.body || {};
  const erro = validar(dados);
  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  try {
    await candidatoModel.criar({
      cpf: somenteDigitos(dados.cpf),
      nome: String(dados.nome).trim(),
      email: String(dados.email).trim(),
      senhaHash: await gerarHash(dados.senha),
    });

    return res.status(201).json({ mensagem: "Cadastro realizado com sucesso." });
  } catch (erroCadastro) {
    // O model converte a violação do UNIQUE de CPF (23505) neste erro
    if (erroCadastro instanceof candidatoModel.CpfJaCadastradoError) {
      return res.status(409).json({ mensagem: MSG_CPF_DUPLICADO });
    }

    // Só o código vai para o log
    console.error("Erro ao cadastrar candidato:", erroCadastro.code || erroCadastro.message);
    return res.status(500).json({ mensagem: "Não foi possível concluir o cadastro." });
  }
}

module.exports = { cadastrar };