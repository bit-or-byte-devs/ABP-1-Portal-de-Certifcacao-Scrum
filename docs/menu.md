# Menu do candidato: menu principal e perfil

## Preparar e executar

Configure e inicie o backend conforme [docs/login.md](./login.md). O PostgreSQL
deve estar ativo e a sessão do candidato precisa ser criada pelo login ou pelo
cadastro.

Com o servidor em execução, abra http://localhost:3000/pages/menu.html (ou a
porta configurada no `.env`). Acesse pelo Express para que a página e a API
usem a mesma origem. Sem sessão, o servidor redireciona `/pages/menu.html` para
o login.

## Organização da tela

O menu principal também é a tela de perfil, organizada em duas colunas sobre
um fundo de céu estrelado:

- **Perfil (coluna esquerda, `#perfil`):** mascote, nome do candidato, a
  constelação dos 12 temas, a legenda "N de 12 temas estudados" e o resumo da
  certificação: Exame (temas do exame respondidos) e Acertos ("Sai ao
  concluir" até o fim do exame; depois, "X% (aprovado)" ou "X% (não
  aprovado)", com o `percentual_acertos` da API). No desktop a coluna fica
  fixa (`sticky`) enquanto a página rola.
- **Ações (coluna direita):** saudação "Olá {nome}!!", aviso de erro (quando
  houver), botão principal do exame e os atalhos Estudar os temas, Fazer o
  exame e Ver certificados.

Abaixo de 960 px as colunas são empilhadas, com as ações primeiro e o perfil
depois. Abaixo de 600 px os atalhos ficam em uma coluna e os botões do topo
perdem o ícone.

O botão **Perfil** do topo rola até a coluna de perfil, dá foco a ela e aplica
um pulso de destaque de 1,2 s. Abrir `menu.html#perfil` aplica o mesmo
destaque. A página `perfil.html` apenas redireciona para `menu.html#perfil`,
então os botões Perfil das outras páginas continuam funcionando. Ela continua
na lista de páginas privadas do `backend/src/app.js`.

O rodapé desta página traz a marca, os créditos da equipe e os links de
contato, Privacidade e LGPD (`privacidade.html`) e Termos de Uso
(`termos.html`).

## O que faz cada arquivo

| Arquivo | Papel |
| --- | --- |
| `frontend/pages/menu.html` | Estrutura da tela. Carrega `menu-principal.css` e, no fim do `<body>`, `ceu-estrelado.js`, `constelacao.js` e `menu.js`, nessa ordem. |
| `frontend/css/menu-principal.css` | Identidade visual da tela. Importa os tokens de `global.css` e declara a fonte Space Grotesk variável (pesos 300 a 700). |
| `frontend/js/menu.js` | Sessão, carregamento do progresso, botão principal, trava de Certificados, botão Perfil e Sair. |
| `frontend/js/constelacao.js` | Expõe `Constelacao.desenhar(svg, temas, aoDestacar)` e desenha os 12 temas como estrelas ligadas na ordem de estudo. |
| `frontend/js/ceu-estrelado.js` | Fundo animado reutilizável: cria sozinho um `<canvas>` atrás do conteúdo. |
| `frontend/assets/fonts/` | Arquivos `.woff2` da Space Grotesk (pacote `@fontsource-variable/space-grotesk`) e a licença OFL. |
| `frontend/assets/images/borb-logo.png` | Mascote recortado de `imagens/BorB(sem fundo_corpo).png`, com 192 px de altura. |
| `frontend/pages/perfil.html` | Redirecionamento para `menu.html#perfil`. |

### Constelação

Cada tema é uma estrela de quatro pontas ligada ao tema seguinte:

- **100% estudado:** estrela acesa (clara, com halo verde);
- **parcial:** estrela verde-azulada que cresce com o percentual, com um anel
  de progresso que começa no topo;
- **0%:** estrela pequena apagada.

A linha entre os temas N e N+1 fica verde quando o tema N está em 100% e o N+1
já foi iniciado; nos outros casos fica tracejada. Cada estrela é um link para
`estudos.html?tema=N`. Ao passar o mouse ou focar com Tab, a legenda mostra
"Tema N, nome: X% estudado" e volta ao texto padrão depois. As estrelas
aparecem em sequência só no primeiro desenho.

### Céu estrelado

Estrelas fixas que cintilam e **exatamente 8 estrelas cadentes a cada 60 s**.
O ciclo é dividido em 8 fatias de 7,5 s, com uma estrela por fatia, cada uma
vindo de uma direção diferente e atravessando a tela inteira. Os valores ficam
no objeto `CONFIG`, no início do arquivo. Com a aba oculta a animação pausa e,
ao voltar, começa um ciclo novo. Com `prefers-reduced-motion: reduce` ficam só
as estrelas paradas.

## Carregamento dos dados

1. `GET /api/auth/usuario` (`cache: "no-store"`). HTTP 401 leva ao login. Erro
   de rede mostra "Sem conexão com o servidor. Verifique a internet e
   recarregue a página."
2. Em seguida, em paralelo (`Promise.allSettled`), `GET /api/estudos` e
   `GET /api/exames/progresso`. Se apenas uma falhar, o resto da tela funciona
   e o aviso diz "Parte do seu progresso não carregou. Recarregue a página para
   tentar de novo."

Temas com `percentual === 100` contam como estudados ("N de 12" na legenda e
"N/12" no atalho). Temas do exame com `estado === "concluido"` contam como
respondidos ("N de 12 temas" no perfil e "N/12" no atalho).

## Botão principal do exame

Montado a partir de `/api/exames/progresso`, na ordem de prioridade abaixo:

| Situação | Rótulo | Detalhe | Destino |
| --- | --- | --- | --- |
| Certificação concluída | Ver resultado | "X% de acertos, aprovado" ou "X% de acertos, não aprovado" | `certificados.html` |
| Algum tema `em_andamento` | Retomar exame | "O tema N, nome, tem uma questão aberta" | `exames.html` |
| Nenhum tema respondido | Iniciar exame | "Próximo: tema N, nome" | `exame.html?tema=N` |
| Exame em curso | Continuar exame | "Próximo: tema N, nome" | `exame.html?tema=N` |
| Sem próximo tema ou falha na API | Ir para o exame | texto de apoio | `exames.html` |

Com uma questão aberta, o botão **nunca** leva a `exame.html`, porque reabrir o
tema encerraria a questão como errada. A página `exames.html` trata a
interrupção. O percentual de acertos vem de `percentual_acertos` e é formatado
com `toLocaleString("pt-BR", { maximumFractionDigits: 1 })`, por exemplo
"8,3% de acertos, não aprovado". A tela não usa `nota_final`.

## Bloqueio de Certificados

O atalho Ver certificados começa com a classe `is-bloqueado` e
`aria-disabled="true"`: borda tracejada, ícone em cinza e cadeado. Enquanto
`certificacao_concluida` for falso, o clique é cancelado (`preventDefault`) e a
descrição mostra "Libera ao concluir o exame: faltam N temas" (ou "falta 1
tema"). Quando a certificação é concluída, a classe e o atributo são removidos
e a descrição passa a "Consulte o resultado da sua certificação".

## Segurança e sessão

- O nome do candidato e os nomes dos temas entram na tela só com
  `textContent` ou `setAttribute`, sem interpretação como HTML.
- O botão Sair envia `POST /api/auth/logout` em JSON e só redireciona quando o
  servidor confirma. Se falhar, mostra um aviso e reabilita o botão.
- O evento `pageshow` refaz todas as consultas quando o navegador restaura a
  página pelo botão Voltar, então uma sessão encerrada volta ao login.
- `/pages/menu.html` e `/pages/perfil.html` são páginas privadas no servidor.
  A sessão e as regras de autenticação ficam no backend; o menu não usa dados
  do `sessionStorage` como prova de login.

## Limites atuais

- `privacidade.html` e `termos.html` serão criadas em outra branch. Até lá, os
  links do rodapé levam a páginas inexistentes.
- O rodapé novo existe só nesta página; as outras telas mantêm o rodapé antigo.

## Roteiro de verificação manual

O teste automatizado de sessão, proteção do menu e logout está descrito em
[docs/login.md](./login.md).

1. Abra `/pages/menu.html` sem sessão: deve voltar ao login.
2. Faça login e confirme o nome na saudação e no perfil.
3. Confira se a constelação corresponde ao progresso em Temas (acesa, parcial
   com anel, apagada) e se as linhas acendem entre temas concluídos.
4. Passe o mouse e navegue com Tab pelas estrelas: a legenda mostra o tema e
   volta ao texto padrão depois. O foco deve ficar visível.
5. Confira o rótulo, o detalhe e o destino do botão principal em cada situação
   da tabela.
6. Com a certificação incompleta, clique em Ver certificados: nada acontece e
   a descrição informa quantos temas faltam.
7. Clique em Perfil no topo: a página rola até o perfil e ele pulsa. Abra
   `/pages/perfil.html` e confirme o redirecionamento.
8. Clique em Sair e confirme o redirecionamento ao login. Use Voltar: deve
   continuar no login.
9. Reduza a janela para 390 px: uma coluna, ações primeiro, nada cortado.
10. Observe o fundo por um minuto: 8 estrelas cadentes, cada uma de um lado.
    Com "reduzir movimento" ativado no sistema, nenhuma estrela cadente.
11. Confira o console do navegador: nenhum erro.
