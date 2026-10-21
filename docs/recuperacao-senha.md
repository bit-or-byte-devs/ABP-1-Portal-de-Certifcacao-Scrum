# Recuperação de senha por código

A implementação foi feita em feature/login-backend, mantendo o trabalho local
anterior de cadastro, login e menu. A página e o CSS foram reaproveitados de
origin/feature/recuperarsenha-HTMLeCSS, sem checkout ou merge dessa branch.

## 1. Prepare o banco

No pgAdmin, selecione o banco usado pelo backend, abra o Query Tool e execute
inteiro o arquivo `database/migrations/001_recuperacao_senha.sql`.

Se você tiver psql instalado, também pode executar na raiz do projeto:

```powershell
psql -h localhost -p 5432 -U SEU_USUARIO -d SEU_BANCO -W -v ON_ERROR_STOP=1 -f database/migrations/001_recuperacao_senha.sql
```

Ajuste host e porta conforme o .env. -W pede a senha do banco sem escrevê-la no
comando. A migração adiciona uma coluna e duas tabelas, preservando candidatos,
senhas e demais dados. Ela pode ser executada novamente. Não substitua seu
schema nem apague tabelas. A migração real não foi aplicada automaticamente.

- `tbcandidato.versao_sessao`: número que muda ao redefinir a senha.
- `tbrecuperacao_senha`: guarda uma solicitação atual por candidato, com HMAC,
  validade, tentativas, situação do envio e data de consumo.
- `tblimite_recuperacao`: limita frequência, usando chaves HMAC para não guardar
  CPF ou IP diretamente nessa tabela.

O e-mail não tem UNIQUE no schema atual; duas pessoas podem compartilhar um
endereço. Por isso pedimos CPF e e-mail juntos. A regra de cadastro foi mantida.

## 2. Dependências e ambiente

```powershell
cd backend
npm install
```

Nodemailer já foi adicionado às dependências. Preserve backend/.env e seus
valores existentes de PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD.
Use .env.example somente como referência: não sobrescreva seu arquivo local.

Execute o comando abaixo duas vezes para gerar dois segredos independentes:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use um resultado como SESSION_SECRET (se você ainda não tiver configurado) e
outro como RECUPERACAO_SECRET. Eles precisam ser diferentes. Os segredos não
aparecem no exemplo do Git e .env já é ignorado. Não cole senhas ou segredos
em issues, commits, screenshots ou no frontend.

### Teste local sem envio real

Adicione ao backend/.env:

```dotenv
NODE_ENV=development
RECUPERACAO_MODO=console
RECUPERACAO_SECRET=cole_o_segredo_independente
```

Nesse modo, o código aparece apenas no terminal do servidor, junto do ID do
pedido. Não aparece na resposta da API. A conta precisa existir e CPF/e-mail
precisam corresponder. Console não é um fallback automático: SMTP com falha
retorna erro. O modo console é recusado fora de development.

### Envio por SMTP

```dotenv
RECUPERACAO_MODO=smtp
SMTP_HOST=host_fornecido_pelo_seu_provedor
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario_fornecido_pelo_provedor
SMTP_PASSWORD=senha_smtp_ou_senha_de_aplicativo
SMTP_FROM=Portal Scrum <remetente_autorizado@seu-dominio.com>
```

Use os valores do seu provedor. O remetente deve ser um endereço autorizado
por ele; alguns provedores exigem verificar o domínio. Na porta 587 usamos
STARTTLS obrigatório (SMTP_SECURE=false). Na porta 465 use SMTP_SECURE=true,
que inicia a conexão com TLS. Não desative a verificação do certificado.
Alguns provedores exigem uma senha específica de aplicativo ou de SMTP.

A aceitação pelo servidor SMTP não garante chegada à caixa de entrada: confirme
também spam, autorização do remetente e configurações do domínio com o provedor.
Em produção use NODE_ENV=production e HTTPS, conforme o guia do login.

## 3. Inicie

```powershell
npm start
```

Abra http://localhost:3000/pages/login.html (ou a porta configurada) e clique
Esqueci minha senha. Aplique a migração antes de iniciar esta versão: o login
agora consulta versao_sessao. Sessões anteriores à atualização exigem novo login.

## 4. Entenda o fluxo

1. A página pede CPF e e-mail. O navegador valida os campos e envia JSON para
   POST /api/auth/recuperacao/solicitar.
2. O controller verifica configuração e limites. São permitidas até 10
   solicitações por IP em 10 minutos, uma por CPF por minuto e cinco por CPF
   por hora. Esses limites também valem para contas inexistentes.
3. O model consulta CPF e e-mail com parâmetros SQL. Se houver uma conta,
   cria o pedido. crypto.randomInt gera de 0 a 999999 e padStart mantém seis
   dígitos, inclusive zeros à esquerda.
4. O código não é salvo puro: HMAC-SHA256 mistura segredo, candidato, pedido e
   código. Apenas esse resultado fica no banco. O código vale por 10 minutos,
   contados desde a criação. Um novo pedido substitui o anterior.
5. O serviço envia um texto em português via SMTP. Apenas depois de o SMTP
   aceitar o envio o pedido fica utilizável. Se falhar, o pedido é invalidado
   e a API retorna 503, sem simular sucesso nem registrar o código em produção.
6. Para dados existentes e inexistentes, a resposta normal é exatamente:
   “Se houver uma conta com esse e-mail, enviaremos um código de recuperação.”
   Ambas retornam um ID aleatório; o ID não prova que uma conta existe.
7. A página libera a etapa de código, nova senha e confirmação. O botão de
   reenvio conta 60 segundos. Se atingir o limite por hora/IP, esperar um minuto
   pode não ser suficiente: o servidor mantém o bloqueio até a janela acabar.
8. POST /api/auth/recuperacao/redefinir valida código, senha e confirmação. A
   senha exige de 8 a 1024 caracteres, letras e números, como no cadastro.
   Espaços da senha são preservados; nome e e-mail continuam sendo aparados.
9. O model abre uma transação e trava candidato e pedido com FOR UPDATE. Um
   erro de código aumenta as tentativas; cinco erros bloqueiam esse pedido.
   Pedidos expirados, substituídos, consumidos ou não enviados não são aceitos.
10. Se o código conferir, gerarHash cria a nova senha no formato scrypt já usado.
    A atualização da senha, incremento de versao_sessao e consumo do código
    fazem parte do mesmo COMMIT. Se alguma operação falhar, ROLLBACK desfaz tudo.
    Requisições simultâneas não conseguem usar o mesmo pedido duas vezes.
11. O middleware compara a versão da sessão com a do banco em todo acesso
    protegido. Sessões antigas perdem acesso, mesmo em outros navegadores.
    Os dados em memória são destruídos quando a sessão antiga volta a ser usada.
12. A página mostra sucesso e volta ao login após 2,5 segundos. Não autentica
    automaticamente; o usuário precisa entrar com a nova senha.

As APIs de recuperação não retornam senha, hash, código ou credenciais SMTP.
As falhas internas usam mensagens genéricas. O envio SMTP é síncrono para
podermos informar falhas: o tempo da resposta pode variar conforme o provedor.

## 5. Arquivos desta implementação

Criados:
- database/migrations/001_recuperacao_senha.sql: alteração não destrutiva do banco.
- backend/src/services/codigoRecuperacao.js: código, HMAC e comparação segura.
- backend/src/services/emailRecuperacao.js: SMTP e console restrito a development.
- backend/src/models/recuperacaoModel.js: limites persistentes e transações SQL.
- backend/src/controllers/recuperacaoController.js: entrada, mensagens e fluxo.
- backend/src/routes/recuperacao.js: dois endpoints de recuperação.
- frontend/pages/recuperar_senha.html: base visual reaproveitada e duas etapas.
- frontend/css/recuperarsenha.css: CSS da base com ajustes para a segunda etapa.
- frontend/js/recuperacao.js: validação, requisições, contador e redirecionamento.
- backend/tests/recuperacao.test.js: SMTP simulado e proteção dos códigos.
- backend/tests/recuperacao.postgres.test.js: testes reais em schema isolado.
- docs/recuperacao-senha.md: este guia.

Alterados nesta tarefa:
- backend/src/app.js: registra as rotas de recuperação.
- backend/src/models/candidatoModel.js: inclui a versão nas consultas internas.
- backend/src/controllers/authController.js: guarda a versão no login.
- backend/src/middlewares/autenticacao.js: verifica e invalida sessões antigas.
- backend/src/controllers/candidatoController.js: alinha o limite máximo de senha.
- frontend/js/form.js: preserva espaços e alinha o limite máximo de senha.
- frontend/pages/cadastro.html: limita a entrada de senha a 1024 caracteres.
- backend/tests/auth.test.js: adapta o teste de login à versão das sessões.
- backend/package.json e package-lock.json: incluem Nodemailer.
- .env.example: nomes de configurações sem credenciais reais.

O link de recuperação que já existia em login.html passou a ter uma página no
caminho esperado; nenhuma mudança adicional no link foi necessária.

## 6. Testes

Testes que não dependem de PostgreSQL ou SMTP:

```powershell
npm test
```

O teste PostgreSQL fica marcado como skipped por padrão. Para habilitá-lo:

```powershell
$env:TEST_RECUPERACAO_POSTGRES = 'true'
npm test
Remove-Item Env:TEST_RECUPERACAO_POSTGRES
```

Ele lê a conexão de backend/.env, cria um schema com nome aleatório, executa a
migração nesse schema, testa e remove apenas esse schema. Exige permissão para
criar schemas. Não altera seus candidatos nem usa seu SMTP. Não execute contra
uma infraestrutura em que você não tenha autorização para esses testes.

Verificados: recuperação correta, senha antiga recusada, HMAC e zeros iniciais,
código incorreto, expirado e reutilizado, cinco tentativas, reenvio, limites por
conta/IP, pedidos simultâneos, sessões anteriores bloqueadas, falha e rejeição
SMTP simuladas, console proibido em produção e rollback da troca de senha.

Testes manuais:
1. Em modo console, peça um código para uma conta de teste e use o código do
   terminal para trocar a senha. Confirme sucesso e retorno ao login.
2. Entre com a senha antiga (falha) e nova (sucesso).
3. Mantenha outro navegador logado antes da troca e atualize o menu depois:
   deve exigir login novamente.
4. Erre o código cinco vezes e confira a mensagem de bloqueio.
5. Espere 10 minutos e confira a mensagem de expiração.
6. Aguarde um minuto, peça outro código e confirme que o pedido antigo não vale.
7. Configure SMTP, confirme a entrega real e repita a troca pelo e-mail recebido.
8. Com configuração SMTP inválida, confira a mensagem de falha e ausência de
   códigos no terminal em produção.

A entrega real, aparência e interação no navegador dependem de verificação
manual; os testes automatizados de envio não enviaram e-mails externos.

Referências oficiais:
- https://nodemailer.com/smtp
- https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

## Liberação temporária de solicitações

Para testar sem limites de solicitação por conta/IP nem espera de reenvio, use
`RECUPERACAO_SOLICITACOES_LIVRES=true` junto de `NODE_ENV=development`.
O backend informa espera zero à página. Os cinco erros de código, validade,
uso único e limite de validações por IP permanecem ativos. Em produção essa
opção é ignorada. Para reativar os limites, defina false e reinicie o servidor.
