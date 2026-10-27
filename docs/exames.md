# Exames: guia de estudo

## Preparar e executar

Configure e inicie o projeto conforme [docs/cadastro.md](./cadastro.md). Abra
http://localhost:3000/pages/exames.html pelo servidor (ou use a porta
configurada no `.env`). Também é possível chegar à página pelo botão “Iniciar
exame” do modal de cadastro.

## O que faz cada parte

- `frontend/pages/exames.html`: apresenta o cabeçalho com os botões Perfil e
  Log Out, o link “Voltar” para `menu.html` e uma lista de 12 temas. Cada cartão
  mostra o título, uma breve descrição, o progresso inicial de 0% e um botão
  “Iniciar exame”.
- `frontend/css/menu-temas.css`: fornece os estilos compartilhados da página
  de exames e da página de temas.
- `frontend/js/menu-temas.js`: permite expandir ou recolher os cartões como um
  acordeão; ao abrir um cartão, fecha os outros. Clicar em “Iniciar exame”
  mostra um alerta com o nome do exame.
- `frontend/js/logout.js`: envia `POST /api/auth/logout`. Quando o servidor
  confirma a saída, redireciona para `login.html`; se houver falha, mostra um
  alerta e reabilita o botão.

## Temas apresentados

1. Fundamentos da Agilidade
2. Manifesto Ágil
3. Introdução ao Scrum
4. Papéis do Scrum
5. Eventos do Scrum
6. Artefatos do Scrum
7. User Stories
8. Gestão do Product Backlog
9. Kanban
10. Planejamento Ágil
11. Métricas Ágeis
12. Qualidade em Projetos Ágeis

## Limites atuais da página

- Os cartões mostram 0% como valor fixo; a página não salva nem atualiza o
  progresso.
- “Iniciar exame” apenas exibe uma mensagem de alerta com o título do cartão.
  Não inicia uma prova, carrega questões ou registra resultados.
- Perfil aparece como botão, mas não possui ação implementada nesta página.

## Como verificar

1. Abra `/pages/exames.html` pelo servidor e confirme que os 12 cartões e os
   progressos iniciais aparecem.
2. Clique em um cartão fora do botão “Iniciar exame”: ele deve expandir ou
   recolher, e abrir outro cartão deve fechar o anterior.
3. Clique em “Iniciar exame” e confirme que o alerta apresenta o nome do tema,
   sem iniciar uma prova.
4. Use “Voltar” e confirme que a navegação abre `/pages/menu.html`.
5. Clique em Log Out e confirme o redirecionamento para o login quando o
   servidor confirmar a saída.
