# Recuperação de senha

## Objetivo

Este documento descreve o fluxo de recuperação de senha do Portal de Certificação Scrum. O candidato solicita um código usando somente o e-mail cadastrado, confirma o código e define uma nova senha na mesma página: `frontend/pages/recuperar_senha.html`.

O fluxo não informa se o e-mail possui uma conta no portal. Isso reduz a possibilidade de descoberta de contas por tentativa de endereços.

## Fluxo do candidato

1. Na etapa **E-mail**, o candidato informa o e-mail cadastrado. A interface envia uma solicitação para `POST /api/auth/recuperacao/solicitar`.
2. A API devolve uma mensagem genérica, independentemente de o e-mail existir ou não. Quando há uma conta, o sistema gera e envia um código de seis dígitos.
3. Na etapa **Código**, o candidato informa os seis dígitos recebidos. A página chama `POST /api/auth/recuperacao/verificar`.
4. Com o código válido, a etapa **Nova senha** é liberada. O candidato informa e confirma a nova senha, que é enviada para `POST /api/auth/recuperacao/redefinir`.
5. Após a alteração, o código é consumido, as sessões anteriores são invalidadas e o candidato é redirecionado para o login. Ele deve entrar novamente usando a nova senha.

O reenvio gera um novo pedido e invalida o código anterior. A página não grava e-mail nem código em URL, `localStorage` ou `sessionStorage`.

## Endpoints

Todas as rotas aceitam `POST` com corpo JSON e retornam cabeçalho `Cache-Control: no-store`.

| Endpoint | Corpo esperado | Resultado principal |
| --- | --- | --- |
| `POST /api/auth/recuperacao/solicitar` | `email` | Retorna `202` e a mesma mensagem genérica para e-mails existentes ou inexistentes. |
| `POST /api/auth/recuperacao/verificar` | `email`, `codigo` | Confirma um código válido sem consumi-lo, liberando a definição da senha. |
| `POST /api/auth/recuperacao/redefinir` | `email`, `codigo`, `senha`, `confirmarSenha` | Atualiza a senha e consome o código em uma única transação. |

O código precisa ter exatamente seis dígitos. Um código inválido, expirado, já utilizado ou substituído é recusado. Cinco tentativas incorretas bloqueiam o pedido; o contador é compartilhado entre as rotas de verificação e redefinição.

## Regras e segurança

- O código vale por 10 minutos, pode ser usado uma única vez e o reenvio invalida o anterior.
- O código não é salvo em texto puro: o banco armazena somente um HMAC ligado ao candidato e à solicitação, e a comparação é feita de forma segura.
- A solicitação usa uma resposta genérica para não revelar a existência de uma conta. Falhas de entrega também não expõem essa informação.
- Há limites por IP e por e-mail para solicitações e validações. A resposta de limite informa quando é necessário aguardar antes de tentar novamente.
- A senha deve ter entre 8 e 1024 caracteres e conter letras e números. A confirmação precisa ser idêntica à senha informada.
- A troca da senha, o consumo do código e o aumento da versão de sessão são atômicos. Isso impede reutilização por requisições concorrentes e invalida sessões abertas antes da redefinição.
- Dados de recuperação e respostas sensíveis não devem ser armazenados em cache. Não registre códigos, senhas, hashes ou credenciais de e-mail.

## Banco de dados

As migrações relacionadas ao fluxo estão em `database/migrations/`:

- `001_recuperacao_senha.sql` adiciona a versão de sessão ao candidato e cria as tabelas de pedidos de recuperação e de limites.
- `008_email_unico.sql` normaliza os e-mails existentes e cria o índice único sem diferenciar maiúsculas e minúsculas. Se houver duplicidade prévia, a migração interrompe a execução para que os dados sejam resolvidos antes da criação do índice.

O cadastro e a recuperação normalizam o e-mail com remoção de espaços nas extremidades e conversão para minúsculas. Assim, o banco recusa cadastros com o mesmo e-mail, mesmo que a capitalização seja diferente.

## Configuração do envio

Em produção, o código é enviado por SMTP. Configure no ambiente o modo de recuperação, o segredo próprio da recuperação e as variáveis `SMTP_*` documentadas em `.env.example`; não inclua esses valores no repositório, em issues ou em logs.

O modo `console` existe somente para desenvolvimento e exige `NODE_ENV=development`. Ele escreve o código no log local e não envia e-mail. Não é um fallback para falha de SMTP e é recusado fora do ambiente de desenvolvimento. Na inicialização, o serviço valida a configuração SMTP; se ela estiver incompleta ou indisponível, o restante do portal continua funcionando, mas códigos não serão entregues até a correção da configuração.

Use segredos independentes para sessão e recuperação. O segredo da recuperação deve permanecer somente no ambiente de execução e ter o tamanho mínimo exigido pela aplicação.

## Arquivos principais

- `frontend/pages/recuperar_senha.html`: página única com as três etapas.
- `frontend/js/recuperar-senha.js`: validações da interface, comunicação com a API, reenvio e redirecionamento ao login.
- `frontend/css/recuperarsenha.css`: estilos da página de recuperação.
- `backend/src/routes/recuperacao.js`: definição das três rotas HTTP.
- `backend/src/controllers/recuperacaoController.js`: validação de entrada, respostas públicas e coordenação do fluxo.
- `backend/src/models/recuperacaoModel.js`: persistência, limites e transações da recuperação.
- `backend/src/services/codigoRecuperacao.js`: geração, HMAC e validade do código.
- `backend/src/services/emailRecuperacao.js`: entrega por SMTP ou console em desenvolvimento.

As páginas antigas de verificação e redefinição não fazem parte do fluxo: toda a experiência está concentrada em `recuperar_senha.html`.

## Testes

Os testes automatizados cobrem os componentes e o fluxo HTTP, incluindo:

- geração e proteção do código, validade, expiração, uso único e tentativas;
- solicitação genérica, reenvio, limites e códigos inválidos;
- redefinição, recusa da senha antiga, login com a nova senha e invalidação de sessões anteriores;
- transporte SMTP simulado, modo `console` de desenvolvimento e falhas de configuração ou entrega;
- cenário PostgreSQL isolado, criado apenas para o teste e removido ao final, incluindo as migrações e a regra de e-mail único.

Execute os testes a partir de `backend/` com `npm test`. O cenário PostgreSQL é opcional e depende da variável de ambiente específica de teste e de uma conexão PostgreSQL autorizada; ele não deve ser apontado para dados de produção.

## Cuidados de produção

- Use HTTPS e proteja os segredos de sessão, recuperação e SMTP no ambiente de implantação.
- Mantenha o envio real em SMTP e não habilite o modo `console` em produção.
- Monitore falhas de configuração e de entrega por seus códigos técnicos, sem registrar e-mail, código, senha ou credenciais.
- Aplique as migrações antes de liberar o fluxo e trate duplicidades de e-mail apontadas pela migração de unicidade.
- Verifique periodicamente os limites, a entrega das mensagens e a política de retenção dos dados operacionais do banco.
