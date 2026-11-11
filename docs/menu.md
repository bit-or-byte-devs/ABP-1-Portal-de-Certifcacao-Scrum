# Menu do candidato: guia de estudo

## Preparar e executar

Configure e inicie o backend conforme [docs/login.md](./login.md). O PostgreSQL
deve estar ativo e a sessão do candidato precisa ser criada pelo login ou pelo
cadastro.

Com o servidor em execução, abra http://localhost:3000/pages/menu.html (ou a
porta configurada no `.env`). Acesse pelo Express para que a página e a API
usem a mesma origem.

## O que faz cada parte

- `frontend/pages/menu.html`: monta a navegação superior com a marca BorB e
  os botões Perfil e Log Out; apresenta a saudação, o aviso de estado e os
  cartões Temas, Certificados e Exames. Carrega `frontend/css/menu-temas.css`
  e, ao final da página, `frontend/js/menu.js`.
- `frontend/js/menu.js`: consulta `GET /api/auth/usuario` para carregar o
  candidato. Se a sessão não existir (HTTP 401), redireciona para o login.
  Para outros erros de consulta, exibe uma mensagem genérica no aviso do menu.
- A saudação usa `textContent` para inserir o nome como texto, sem interpretá-lo
  como HTML.
- O botão Log Out envia `POST /api/auth/logout` em JSON. Só redireciona ao login
  quando o servidor confirma o logout; se a solicitação falhar, mostra um aviso
  e reabilita o botão para permitir nova tentativa.
- O evento `pageshow` consulta novamente o usuário, inclusive quando o
  navegador restaura a página pelo botão Voltar.
- Os cartões Temas, Certificados e Exames são links para `temas.html`,
  `certificados.html` e `exames.html`, respectivamente. Os destinos são páginas
  do frontend; o menu não carrega o conteúdo delas.

## Caminho dos dados

Abrir o menu → `GET /api/auth/usuario` → verificação da sessão no servidor →
nome do candidato inserido na saudação. Se a API responder 401, o navegador
volta ao login. Ao sair, o fluxo é `POST /api/auth/logout` → destruição da
sessão no servidor → redirecionamento para o login.

O nome recebido é mostrado como texto. A sessão e as regras de autenticação são
gerenciadas pelo backend; o menu não usa dados do `sessionStorage` como prova
de login.

## Limites atuais da página

- Perfil é apresentado como botão, mas não possui ação implementada em
  `menu.js`.
- O JavaScript inclui uma mensagem “Em breve” para elementos marcados com
  `data-em-breve`, mas o HTML atual não contém elementos com esse atributo.
- O cartão Certificados informa que a validação estará disponível em breve; os
  cartões Temas e Exames navegam para suas respectivas páginas.

## Como verificar

O teste de sessão, proteção do menu e logout está descrito em
[docs/login.md](./login.md). Para conferir a página manualmente:

1. Inicie o backend e faça login com um candidato cadastrado.
2. Confirme que `/pages/menu.html` mostra a saudação com o nome do candidato.
3. Atualize o menu e confirme que a sessão continua válida.
4. Clique em Temas, Certificados e Exames e confirme que cada link abre a página
   indicada no HTML.
5. Volte ao menu, clique em Perfil e confirme que o botão ainda não executa uma
   ação.
6. Clique em Log Out e confirme o redirecionamento ao login.
7. Tente abrir `/pages/menu.html` sem sessão: a consulta deve responder 401 e
   redirecionar ao login.
