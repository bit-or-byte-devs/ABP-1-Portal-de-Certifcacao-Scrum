const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const pool = require('../src/config/db');
const { bcrypt, normalizarCpf, senhaValida, custoHash } = require('../src/auth/credenciais');

class ErroEntrada extends Error {}

function perguntarSenha(texto) {
    return new Promise((resolve, reject) => {
        stdout.write(texto);
        let senha = '';
        const modoAnterior = Boolean(stdin.isRaw);
        stdin.setRawMode(true);
        stdin.resume();
        function finalizar(erro) {
            stdin.removeListener('data', receber);
            stdin.setRawMode(modoAnterior);
            stdin.pause();
            stdout.write('\n');
            if (erro) reject(erro); else resolve(senha);
        }
        function receber(buffer) {
            for (const caractere of buffer.toString('utf8')) {
                if (caractere === '\u0003') return finalizar(new ErroEntrada('Operação cancelada. Nenhum candidato foi criado.'));
                if (caractere === '\r' || caractere === '\n') return finalizar();
                if (caractere === '\u007f' || caractere === '\b') {
                    senha = [...senha].slice(0, -1).join('');
                } else if (caractere >= ' ' && caractere !== '\u007f') {
                    senha += caractere;
                }
            }
        }
        stdin.on('data', receber);
    });
}

async function executar() {
    if (process.env.NODE_ENV !== 'development') throw new ErroEntrada('Defina NODE_ENV=development no backend/.env.');
    if (!stdin.isTTY || !stdout.isTTY) throw new ErroEntrada('Execute em um terminal interativo, sem redirecionar entradas.');
    const rl = readline.createInterface({ input: stdin, output: stdout });
    let nome, cpf, email;
    try {
        nome = (await rl.question('Nome completo: ')).trim();
        cpf = normalizarCpf(await rl.question('CPF: '));
        email = (await rl.question('E-mail: ')).trim();
    } finally {
        rl.close();
    }
    if (!nome || nome.length > 150) throw new ErroEntrada('Informe um nome de até 150 caracteres.');
    if (!/^\d{11}$/.test(cpf)) throw new ErroEntrada('Informe um CPF com 11 dígitos; pontos, hífen e espaços são aceitos.');
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ErroEntrada('Informe um e-mail válido de até 254 caracteres.');
    }
    const existente = await pool.query('SELECT id FROM tbcandidato WHERE cpf = $1', [cpf]);
    if (existente.rows.length) {
        stdout.write('CPF já cadastrado. Nenhum registro foi alterado.\n');
        return;
    }
    const senha = await perguntarSenha('Senha (entrada oculta): ');
    if (!senhaValida(senha) || senha.length < 8) throw new ErroEntrada('A senha precisa ter pelo menos 8 caracteres e no máximo 72 bytes. Os caracteres ficam ocultos durante a digitação.');
    const confirmacao = await perguntarSenha('Confirme a senha (entrada oculta): ');
    if (senha !== confirmacao) throw new ErroEntrada('A senha e a confirmação não coincidem. Execute novamente o script.');
    const hash = await bcrypt.hash(senha, custoHash);
    const resultado = await pool.query(
        `INSERT INTO tbcandidato (cpf, nome_completo, email, senha_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT (cpf) DO NOTHING RETURNING id`,
        [cpf, nome, email, hash]
    );
    stdout.write(resultado.rows.length ? 'Candidato de teste criado.\n' : 'CPF já cadastrado. Nenhum registro foi alterado.\n');
}

executar().catch((erro) => {
    // Somente mensagens de entrada controladas; nunca imprimir erros brutos do banco.
    const mensagensBanco = {
        '28P01': 'Falha na autenticação do PostgreSQL. Confira DB_USER e DB_PASSWORD no backend/.env.',
        '3D000': 'Banco de dados não encontrado. Confira DB_NAME.',
        '42P01': 'Tabela tbcandidato não encontrada no banco configurado.',
        '42501': 'Usuário do banco sem permissão para a tabela ou sua sequência de identidade.',
        '23502': 'O banco exige um campo obrigatório não preenchido pelo script. Confira o esquema instalado.',
        '23514': 'O registro foi rejeitado por uma restrição do banco. Confira o esquema instalado.',
        '23505': 'O registro já existe. Nenhum registro foi sobrescrito.',
        'ECONNREFUSED': 'PostgreSQL indisponível. Confira o serviço, DB_HOST e DB_PORT.',
        'ENOTFOUND': 'Servidor PostgreSQL não encontrado. Confira DB_HOST.',
    };
    const mensagem = erro instanceof ErroEntrada ? erro.message : mensagensBanco[erro.code];
    console.error(mensagem || 'Não foi possível criar o candidato. Confira a conexão, o esquema do banco e o terminal interativo.');
    process.exitCode = 1;
}).finally(() => pool.end());
