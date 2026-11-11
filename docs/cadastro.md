# Cadastro: guia de estudo

## Preparar e executar

Na raiz do projeto:

```powershell
cd backend
npm install
```

Mantenha o arquivo backend/.env existente e as variáveis DB_HOST, DB_PORT,
DB_NAME, DB_USER e DB_PASSWORD. Se esse arquivo não existir, copie o modelo
com `Copy-Item ../.env.example .env`. Não sobrescreva um .env configurado.

Gere um segredo local com:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado em backend/.env como `SESSION_SECRET=valor_gerado`.
Use `NODE_ENV=development` para testar com HTTP local. O servidor exige pelo
menos 32 caracteres; o comando acima gera 32 bytes aleatórios em hexadecimal.
Não publique o segredo. O banco PostgreSQL precisa estar ativo e ter a tabela
tbcandidato criada pelo schema do projeto.

```powershell
npm start
```

Abra http://localhost:3000/pages/cadastro.html (ou a porta configurada no
.env). Acesse a página pelo Express para que o formulário e a API usem a mesma
origem.

## O que faz cada parte

- frontend/pages/cadastro.html: apresenta os campos de nome completo, CPF,
  e-mail, senha, confirmação de senha e aceite dos termos. Também oferece o
  acesso ao login e a confirmação após o cadastro.
- frontend/js/form.js: valida os campos no navegador, remove a pontuação do CPF,
  não envia a confirmação de senha e envia os demais dados em JSON para
  POST /api/candidatos. Só considera o cadastro concluído quando recebe HTTP
  201; trata CPF duplicado (409) e falhas de envio.
- frontend/js/cadastro.js: intercepta o sucesso para abrir o modal. A pessoa
  pode iniciar o exame, que navega para exames.html, ou ir ao menu do candidato.
  Também permite fechar o modal para seguir ao menu.
- backend/src/routes/candidatos.js: registra POST /api/candidatos e o conecta
  ao controller de candidatos.
- backend/src/controllers/candidatoController.js: valida novamente os dados no
  servidor, normaliza o CPF, gera o hash da senha, cria o candidato e inicia uma
  sessão. Retorna 201 no sucesso, 400 para dados inválidos, 409 para CPF já
  cadastrado e 500 com mensagem genérica quando ocorre uma falha inesperada.
- backend/src/models/candidatoModel.js: insere o candidato com parâmetros SQL.
  A constraint UNIQUE do banco impede CPFs repetidos, inclusive em cadastros
  simultâneos. A data de aceite dos termos é registrada no momento da inclusão.
- backend/src/services/senha.js: usa scrypt com salt aleatório para armazenar
  uma representação de hash; a senha original não é salva nem pode ser
  recuperada a partir do hash.
- backend/src/app.js e backend/src/config/sessao.js: montam o endpoint, servem
  as páginas e criam a sessão do candidato após o cadastro. O cookie é HttpOnly,
  SameSite=Lax e tem validade de duas horas; em produção também exige HTTPS.

## Regras de validação

- Nome obrigatório, com nome e sobrenome; o servidor aceita até 150 caracteres
  e o campo da página limita a 120.
- CPF obrigatório e válido, com os dígitos verificadores conferidos no
  navegador e novamente no servidor. A pontuação é removida antes do envio e
  o banco armazena os 11 dígitos.
- E-mail obrigatório e validado no navegador e no servidor.
- Senha obrigatória, com no mínimo 8 caracteres, pelo menos uma letra e um
  número, e limite de 1024 caracteres. A confirmação deve ser igual, mas não
  é enviada à API.
- O aceite dos Termos de Uso e da Política de Privacidade é obrigatório. A
  confirmação fica registrada em data_aceite_termos.

## Caminho dos dados

Formulário → validação no navegador → POST /api/candidatos em JSON → validação
no servidor → hash scrypt → INSERT parametrizado em tbcandidato → sessão
renovada e salva → HTTP 201 → modal de sucesso → menu do candidato ou página
de exames.

O CPF só é usado como dado de identificação; a senha original não é persistida.
O candidato recebe uma sessão autenticada ao concluir o cadastro, sem precisar
fazer login em seguida.

## Como verificar

Na pasta backend:

```powershell
npm test
```

O teste de autenticação também percorre o cadastro com uma resposta de banco
simulada: confere a senha armazenada como hash, o retorno de sucesso e a sessão
criada. Esse teste não altera nem confirma os dados do PostgreSQL local.

Roteiro manual:

1. Abra /pages/cadastro.html e tente enviar o formulário vazio: os campos
   obrigatórios devem indicar os erros.
2. Preencha nome e sobrenome, um CPF válido, um e-mail, uma senha de pelo menos
   8 caracteres contendo letras e números, confirme-a e aceite os termos.
3. Envie o cadastro: deve aparecer a confirmação de sucesso.
4. Escolha Agora não, ir para o menu: o menu deve abrir com a sessão criada.
5. Repita o cadastro com o mesmo CPF: o formulário deve informar que o CPF já
   possui cadastro, sem criar uma segunda conta.
6. Volte a abrir o menu; para confirmar que a sessão permite entrar, não deve
   ser necessário preencher novamente as credenciais.

