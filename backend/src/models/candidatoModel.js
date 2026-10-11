const pool = require("../config/db");

// Código do PostgreSQL para violação de UNIQUE.
const VIOLACAO_UNIQUE = "23505";

class CpfJaCadastradoError extends Error {}

// A garantia de CPF único é a constraint UNIQUE de tbcandidato.cpf.
// Não fazemos SELECT antes do INSERT: dois cadastros simultâneos
// passariam pelo SELECT e o banco é quem decide no fim.
async function criar({ cpf, nome, email, senhaHash }) {
    try {
        const resultado = await pool.query(
            `INSERT INTO tbcandidato
                (cpf, nome_completo, email, senha_hash, data_aceite_termos)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING id, cpf, nome_completo, email, data_cadastro`,
            [cpf, nome, email, senhaHash]
        );
        return resultado.rows[0];
    } catch (erro) {
        if (erro.code === VIOLACAO_UNIQUE && erro.constraint === "tbcandidato_cpf_key") {
            throw new CpfJaCadastradoError("CPF já cadastrado.");
        }
        throw erro;
    }
}

async function buscarPorCpf(cpf) {
    // O CPF ? um parâmetro, separado do código SQL.
    const resultado = await pool.query("SELECT id, senha_hash, versao_sessao FROM tbcandidato WHERE cpf = $1", [cpf]);
    return resultado.rows[0];
}
async function buscarPorId(id) {
    const resultado = await pool.query("SELECT id, nome_completo AS nome, versao_sessao FROM tbcandidato WHERE id = $1", [id]);
    return resultado.rows[0];
}
module.exports = { criar, CpfJaCadastradoError, buscarPorCpf, buscarPorId };
