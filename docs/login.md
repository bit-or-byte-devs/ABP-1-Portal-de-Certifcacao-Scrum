# Login e menu: guia de estudo

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
Não publique o segredo: .env já está ignorado pelo Git e .env.example contém
somente um campo vazio. Com a recuperação de senha, aplique também database/migrations/001_recuperacao_senha.sql; veja docs/recuperacao-senha.md.

```powershell
npm start
```

Abra http://localhost:3000/pages/login.html (ou a porta configurada no .env).
O PostgreSQL precisa estar ativo com a tabela tbcandidato do projeto. Acesse
as páginas pelo Express para que o formulário e a API usem a mesma origem.

## O que faz cada parte

- services/senha.js: gerarHash continua atendendo o cadastro. verificarSenha
  separa o salt e a chave do formato salvo, calcula scrypt novamente e compara
  os buffers com timingSafeEqual. Hash não é uma senha criptografada que possa
  ser descriptografada. Formatos inválidos são recusados antes da comparação.
- models/candidatoModel.js: buscarPorCpf consulta ID e hash para autenticar;
  buscarPorId consulta ID e nome para o menu. O parâmetro $1 mantém o valor
  recebido separado do código SQL.
- controllers/authController.js: login confere as credenciais, renova a sessão
  e guarda candidatoId e versaoSessao, usada para invalidar logins após troca de senha. usuarioLogado retorna apenas ID e nome. logout
  destrói a sessão e limpa o cookie. Erros internos não expõem detalhes do banco.
- routes/auth.js: liga POST /api/auth/login, GET /api/auth/usuario e
  POST /api/auth/logout às funções do controller.
- config/sessao.js: configura express-session, segredo do ambiente e cookie.
  HttpOnly impede leitura pelo JavaScript, SameSite=Lax limita envio entre sites
  e Secure exige HTTPS em produção. A duração máxima é duas horas.
- middlewares/autenticacao.js: exigirSessao retorna 401 para API sem login;
  protegerMenu redireciona para login. exigirJson limita os POSTs a JSON,
  dificultando envios por formulários externos; não habilitamos CORS.
- app.js: instala a sessão e registra a rota protegida do menu antes dos arquivos
  estáticos. Caminhos alternativos do menu também são interceptados.
- pages/login.html e js/form.js: acrescentam o destino do login bem-sucedido e
  apresentam “CPF ou senha incorretos” para 401. O cadastro mantém sua validação,
  notificação, tratamento de CPF duplicado e redirecionamento para login.
- pages/menu.html, css/menu.css e js/menu.js: reutilizam fontes e cores do login,
  consultam o candidato, apresentam o nome com textContent, mostram “Em breve”
  e enviam o logout. textContent não interpreta o nome como HTML.
- tests/auth.test.js: usa o runner nativo do Node, servidor HTTP e sessões reais,
  mas simula pool.query para não alterar o PostgreSQL.

## Caminho dos dados

Formulário → POST em JSON → rota → controller → consulta parametrizada ao banco
→ comparação scrypt → nova sessão no servidor → cookie com ID da sessão
→ redirecionamento ao menu → GET /api/auth/usuario → nome na página.

O navegador não recebe senha nem senha_hash nas respostas. O cookie contém o
identificador da sessão, não os dados completos do candidato. O sessionStorage
já existente serve só para preencher CPF após cadastro; não comprova login.
O logout é confirmado pelo servidor antes de redirecionar o navegador.

## Limites da configuração

O armazenamento padrão MemoryStore serve para desenvolvimento: as sessões
ficam na memória do processo e somem ao reiniciar. Produção exige armazenamento
apropriado de sessões, HTTPS e limitação de tentativas de login. Quando
NODE_ENV=production, o cookie usa Secure. Se a hospedagem terminar HTTPS num
proxy, configure trust proxy conforme a infraestrutura utilizada.

Respostas de autenticação e menu usam Cache-Control: no-store. Ao restaurar o
menu pelo botão Voltar, o script confere a sessão novamente.

## Como verificar

```powershell
npm test
```

O teste cobre senha certa/errada, hash inválido, SQL com parâmetros, credenciais
incorretas, cookie HttpOnly/SameSite, consulta sem sessão, menu protegido e
caminhos alternativos, atualização com a mesma sessão, renovação do ID de sessão,
erro do banco sem expor detalhes, logout e candidato removido. Não substitui o
teste no navegador nem confirma a conexão com seu PostgreSQL.

Roteiro manual:

1. Cadastre um candidato e confirme a notificação e o CPF preenchido no login.
2. Entre com CPF e senha corretos: deve abrir o menu com o nome cadastrado.
3. Digite uma senha errada: deve aparecer “CPF ou senha incorretos”.
4. Use um CPF válido que não esteja cadastrado: deve aparecer a mesma mensagem.
   Um CPF inválido é bloqueado primeiro pela validação existente no frontend.
5. Em janela anônima, abra /pages/menu.html: deve redirecionar ao login.
   GET /api/auth/usuario sem cookie deve retornar 401.
6. Atualize o menu: deve manter o candidato durante a validade da sessão.
7. Clique Área de estudos e Iniciar certificação: ambos devem mostrar “Em breve”.
8. Clique Sair: deve voltar ao login. Abra o menu de novo e confirme o bloqueio.
9. Use Voltar após sair: o menu deve consultar a sessão e voltar ao login.
10. Reinicie o servidor: as sessões em memória se perdem e exigem novo login.

Referências oficiais consultadas:
- https://expressjs.com/en/resources/middleware/session/
- https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
