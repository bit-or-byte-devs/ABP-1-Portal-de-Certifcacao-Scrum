# Pop-ups de cadastro: guia de estudo

## Preparar e executar

Configure e inicie o projeto conforme [docs/cadastro.md](./cadastro.md). Com o
servidor em execução, abra http://localhost:3000/pages/cadastro.html. O pop-up
integrado só é exibido depois que o cadastro é concluído com sucesso.

## O que faz cada parte

- `frontend/pages/cadastro.html`: contém o modal de sucesso `#successModal`,
  inicialmente oculto, com título, mensagem, mascote e as opções “Iniciar
  exame” e “Agora não, ir para o menu”. O diálogo identifica seu título e
  descrição com `aria-labelledby` e `aria-describedby`, e informa que é modal
  com `aria-modal`.
- `frontend/js/form.js`: valida e envia os dados do formulário ao backend.
  Apenas a resposta HTTP 201 conclui o cadastro e dispara o evento
  `cadastro:sucesso`; erros de validação ou envio não devem exibir o modal.
- `frontend/js/cadastro.js`: escuta `cadastro:sucesso`, mostra o modal, atualiza
  `aria-hidden` e move o foco para “Iniciar exame”. Esse botão navega para
  `exames.html`; “Agora não, ir para o menu” navega para `menu.html`.
  Clicar no fundo fora do diálogo ou pressionar Escape também segue para o menu.
  Durante a navegação pelo teclado, Tab alterna o foco entre os dois botões.
- `frontend/css/cadastro-modal.css`: apresenta o fundo escurecido e a caixa de
  confirmação, anima a entrada do modal e do mascote, oculta o mascote em telas
  estreitas e desativa as transições quando o sistema pede movimento reduzido.
  Também fornece destaque visual de foco para os botões.
- `frontend/pages/pop-up.html`, `frontend/js/pop-up.js` e
  `frontend/css/pop-up.css`: formam uma página independente de demonstração.
  Nela, o envio do formulário abre o pop-up sem chamar a API de cadastro;
  “Iniciar testes” mostra um `alert`, não navega para a página de exames.
  Portanto, esse exemplo não representa o fluxo real do cadastro atual.

## Caminho dos dados

Cadastro preenchido → validação e envio pelo `form.js` → resposta HTTP 201 →
evento `cadastro:sucesso` → modal mostrado pelo `cadastro.js` → escolha de
“Iniciar exame” para abrir `exames.html` ou de “Agora não” para abrir `menu.html`.

O modal não confirma o sucesso por conta própria: sua abertura depende do
resultado positivo recebido do backend. A página de demonstração
`pop-up.html` não envia dados ao backend.

## Como verificar

O fluxo de cadastro e seus testes estão descritos em
[docs/cadastro.md](./cadastro.md). Para conferir o pop-up manualmente:

1. Abra `/pages/cadastro.html` pelo servidor e envie dados inválidos. O modal
   de sucesso não deve aparecer.
2. Conclua um cadastro válido e confirme que a resposta de sucesso abre o modal
   e posiciona o foco no botão “Iniciar exame”.
3. Escolha “Iniciar exame” e confirme a navegação para `/pages/exames.html`.
4. Faça outro cadastro válido e escolha “Agora não, ir para o menu”; confirme a
   navegação para `/pages/menu.html`.
5. Em outro cadastro válido, clique no fundo fora do diálogo ou pressione
   Escape e confirme que o destino também é o menu.
6. Abra `/pages/pop-up.html` separadamente e confirme que o formulário apenas
   demonstra o modal; “Iniciar testes” exibe um alerta em vez de navegar.
