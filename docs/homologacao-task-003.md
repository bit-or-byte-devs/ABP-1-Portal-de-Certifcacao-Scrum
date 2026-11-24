# Homologação da TASK-003: flashcards com repetição espaçada

Issue #71, branch `task-003`. Este roteiro confere, passo a passo, os critérios de aceitação da issue e o comportamento descrito em [flashcards.md](flashcards.md). Os números esperados foram obtidos executando estes cenários em um ambiente de teste novo, com contas novas, e são os que apareceram na execução.

## O que a funcionalidade faz

Em resumo (o detalhe está em [flashcards.md](flashcards.md)):

- São 120 cartões, 10 por tema. O candidato vira o cartão e responde **Sabia** ou **Não sabia**.
- A tela mostra quatro estados: **Novos** (sem resposta), **Errados**, **Em aprendizado** e **Dominados**. Dominar exige dois acertos seguidos, em sessões diferentes.
- A cada resposta, a tela mostra a mudança de estado do cartão, como "Novo → Em aprendizado" ou "Em aprendizado → Dominado". O aluno não vê número de caixa.
- No banco, o estado é a caixa do cartão: Errados é a caixa 1, Em aprendizado é a 2 e Dominados é a 3. "Sabia" sobe uma caixa (máximo 3), "Não sabia" volta para a caixa 1, e um cartão novo com "Sabia" entra na caixa 2. Por isso as colunas de estado esperado, abaixo, falam em `caixa`.
- Há três modos: **Por tema**, **Aleatório geral** e **Revisar os que errei** (somente a caixa 1).
- Cada candidato vê e altera apenas o próprio progresso.

## Preparação

1. Na raiz do projeto, suba o ambiente e confira o log da preparação (PowerShell):

   ```powershell
   Copy-Item .env.example .env
   docker compose up -d --build
   docker compose logs preparar-banco
   ```

   O log deve conter `Flashcards validados: 120 cartões em 12 temas.`, `Aplicando migração 009_flashcards.sql...` e `Flashcards: {"inseridos":120,...}` (em uma segunda subida, `"existentes":120`).
2. Abra `http://localhost:3000/pages/index.html` (ou a porta definida em `APP_PORT`) e crie as duas contas de teste pela tela de cadastro:

   | | Nome | CPF (de teste, válido) | E-mail | Senha |
   | --- | --- | --- | --- | --- |
   | Conta A | Teste Homologação A | 529.982.247-25 | homologacao.a@example.test | Demo12345 |
   | Conta B | Teste Homologação B | 123.456.789-09 | homologacao.b@example.test | Demo12345 |

   Os dados são fictícios. Se o CPF ou o e-mail já existirem no seu banco, use outros.
3. Use a Conta A em um navegador e a Conta B em outro navegador (ou em uma janela anônima), para as duas sessões não se misturarem.
4. Deixe o DevTools (F12) à mão: a aba Console para os erros e a aba Network para o cenário de conexão.
5. Use contas novas. Os números esperados abaixo partem de candidatos sem nenhuma resposta.

### Comando de conferência

O mesmo comando vale no Windows (PowerShell) e no Linux ou macOS. Troque o e-mail pelo da conta conferida:

```powershell
docker compose exec db psql -U portal -d portal_certificacao -c "SELECT f.codigo_origem, p.caixa, p.acertos, p.erros FROM tbprogresso_flashcard p JOIN tbflashcard f ON f.id = p.idflashcard JOIN tbcandidato c ON c.id = p.idcandidato WHERE c.email = 'homologacao.a@example.test' ORDER BY f.codigo_origem;"
```

Para ver só quantos cartões há em cada caixa:

```powershell
docker compose exec db psql -U portal -d portal_certificacao -c "SELECT p.caixa, count(*) AS cartoes FROM tbprogresso_flashcard p JOIN tbcandidato c ON c.id = p.idcandidato WHERE c.email = 'homologacao.a@example.test' GROUP BY p.caixa ORDER BY p.caixa;"
```

Cartão **Novo** não tem linha em `tbprogresso_flashcard`. Nos cenários abaixo, "linha" quer dizer uma linha dessa tabela para o candidato.

Os cartões de cada grupo saem em ordem sorteada, então nunca anote o código de um cartão esperando que ele apareça numa posição fixa. O que é fixo é a contagem.

## Cenários

### 1. Carga do catálogo e acesso protegido

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Rode a consulta de contagem: `docker compose exec db psql -U portal -d portal_certificacao -c "SELECT t.ordem, count(*) AS cartoes FROM tbflashcard f JOIN tbtema t ON t.id = f.idtema WHERE f.ativo GROUP BY t.ordem ORDER BY t.ordem;"` | A saída tem 12 linhas, do tema 1 ao 12. | Cada tema com 10 cartões (120 no total). | |
| Em uma janela anônima, sem login, abra `http://localhost:3000/pages/flashcards.html`. | A página de login. | Redirecionamento (HTTP 302) para `login.html`. | |
| Na mesma janela, abra `http://localhost:3000/api/flashcards`. | `{"mensagem":"Faça login para continuar."}` | HTTP 401. | |

### 2. Menu e atalho na tela de estudos

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Entre com a Conta A e vá ao menu. | O atalho "Revisar com flashcards" mostra **0/120 dominados**. | Nenhuma linha para a Conta A. | |
| Clique em "Revisar com flashcards". | A tela "Flashcards", com "Seu domínio geral: 0 de 120 cartões dominados (0%)." | Sem mudança. | |
| Volte ao menu, abra "Estudar os temas", clique em "Iniciar tema" no tema 4 e, na tela de estudo, clique em "Revisar com flashcards". | A tela de flashcards abre com o **tema 4 já marcado** (o endereço termina em `flashcards.html?tema=4`) e "(1 selecionado)" no título dos temas. | Sem mudança. | |
| Troque o endereço para `flashcards.html?tema=99`. | Aviso: "Tema inválido no endereço." Nenhum tema marcado. | Sem mudança. | |

### 3. Seleção inicial de uma conta nova

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Abra `flashcards.html` sem parâmetros. | 12 temas, cada um com **10 Novos**, 0 Errados, 0 Em aprendizado e 0 Dominados, e 0% de domínio. | Sem mudança. | |
| Observe o botão "Começar". | Desabilitado, com "Marque ao menos um tema para começar." ao lado. | Sem mudança. | |
| Observe o modo "Revisar os que errei". | Desabilitado, com "Revisar os que errei: nenhum cartão errado ainda (Errados = 0 em todos os temas)." | Sem mudança. | |
| Abaixo de "Seu domínio geral", use a tecla Tab até chegar a "Entenda os estados dos cartões". | O recolhível está fechado e recebe um **contorno verde visível**. | Sem mudança. | |
| Pressione Enter. | A legenda abre com os quatro estados: **Novos** ("Cartões que você ainda não respondeu."), **Errados** ("A última resposta foi "Não sabia"."), **Em aprendizado** ("Você acertou uma vez e falta confirmar.") e **Dominados** ("Você acertou de novo, em outra sessão."), e a regra: "Um cartão é dominado depois de dois acertos em sessões diferentes. Errar devolve o cartão para Errados." | Sem mudança. | |
| Pressione Espaço. | A legenda fecha. | Sem mudança. | |

### 4. Primeira sessão por tema (Sabia e Não sabia)

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Deixe o modo "Por tema", marque o tema 1 (Fundamentos da Agilidade) e clique em "Começar". | "Por tema: 1. Fundamentos da Agilidade", "Cartão 1 de 10". Aparece só a **frente** (pergunta) e o botão "Virar". Não há botões Sabia nem Não sabia. | Nenhuma linha. | |
| Clique em "Virar". | O verso: a resposta em destaque, a explicação e a fonte. Aparecem "Não sabia" e "Sabia". | Nenhuma linha (virar não grava nada). | |
| Clique em "Sabia". | Feedback **"✓ Novo → Em aprendizado"** e "Cartão 2 de 10". | 1 linha: `caixa 2`, `acertos 1`, `erros 0`. | |
| No cartão 2, vire e clique em "Não sabia". | Feedback **"✕ Novo → Errado"** e "Cartão 3 de 10". | 2 linhas. A nova: `caixa 1`, `acertos 0`, `erros 1`. | |
| Nos cartões 3 e 4, vire e clique em "Sabia". | Feedback "✓ Novo → Em aprendizado" nos dois. | 4 linhas: 1 em `caixa 1` e 3 em `caixa 2`. | |
| Clique em "Encerrar". | **Resumo da sessão**: "Você respondeu 4 cartões." Em "Suas respostas": **Sabia 3** e **Não sabia 1**. Em "Como os cartões terminaram": **Dominados 0**, **Em aprendizado 3**, **Errados 1**. Aparece a frase **"Acerte estes cartões de novo em outra sessão para dominá-los."** O botão "Revisar os que errei agora" está habilitado. Em nenhum ponto aparece "caixa". | Sem mudança. | |

### 5. Revisar os que errei agora

Continue no resumo do cenário 4.

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Clique em "Revisar os que errei agora". | "Revisão dos que errei: 1. Fundamentos da Agilidade" e **"Cartão 1 de 1"**. Voltou **só o cartão errado**, não os 3 que estavam em aprendizado. | Sem mudança. | |
| Vire e clique em "Sabia". | Feedback **"✓ Errado → Em aprendizado"**. Em seguida o resumo: "Você respondeu 1 cartão.", Sabia 1, Não sabia 0, **Dominados 0, Em aprendizado 1, Errados 0**, e a frase de orientação (há 1 cartão em aprendizado). | O cartão passa para `caixa 2`, com `acertos 1` e `erros 1`. Agora são 4 linhas, todas em `caixa 2`. | |
| Observe "Revisar os que errei agora". | Desabilitado, com "Nenhum cartão errado nos temas desta sessão (Errados = 0)." | Sem mudança. | |
| Clique em "Nova sessão". | No tema 1: **Novos 6, Errados 0, Em aprendizado 4, Dominados 0**. O modo "Revisar os que errei" está desabilitado de novo. | Sem mudança. | |

### 6. Dominar os cartões (segunda sessão do mesmo tema)

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Marque o tema 1 e clique em "Começar". | "Cartão 1 de 10". Os 4 primeiros cartões são os que estão em aprendizado, já que a sessão por tema traz primeiro os Errados, depois os Em aprendizado, depois os Novos e por último os Dominados. | Sem mudança. | |
| Nos 4 primeiros cartões, vire e clique em "Sabia". | Feedback **"✓ Em aprendizado → Dominado"** nos quatro. | 4 linhas em `caixa 3`. | |
| Clique em "Encerrar". | Resumo: "Você respondeu 4 cartões.", Sabia 4, Não sabia 0, **Dominados 4, Em aprendizado 0, Errados 0**. A frase de orientação **não aparece**, porque não há cartão em aprendizado. | Sem mudança. | |
| Clique em "Nova sessão". | No tema 1: **Novos 6, Errados 0, Em aprendizado 0, Dominados 4**, domínio de **40%**. O domínio geral mostra "4 de 120 cartões dominados (3%)." | Sem mudança. | |
| Volte ao menu (botão "Voltar"). | O atalho mostra **4/120 dominados**. | Sem mudança. | |

### 7. Errar um cartão dominado

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Em "Por tema", marque o tema 1 e clique em "Começar". | "Cartão 1 de 10". Os cartões 1 a 6 são os Novos, e os 4 Dominados vêm por último. | Sem mudança. | |
| Nos cartões 1 a 6, vire e clique em "Sabia". | Feedback "✓ Novo → Em aprendizado" nos seis. | 6 novas linhas em `caixa 2`. | |
| No cartão 7 (um Dominado), vire e clique em "Não sabia". | Feedback **"✕ Dominado → Errado"**. | Esse cartão vai de `caixa 3` para `caixa 1`. `acertos` não muda e `erros` aumenta em 1. | |
| Clique em "Encerrar". | Resumo: "Você respondeu 7 cartões.", Sabia 6, Não sabia 1, **Dominados 0, Em aprendizado 6, Errados 1**, e a frase de orientação. | Sem mudança. | |
| Clique em "Nova sessão". | No tema 1: **Novos 0, Errados 1, Em aprendizado 6, Dominados 3**, domínio de 30%. | Sem mudança. | |

### 8. Duas contas: o progresso não se mistura

Antes de começar, anote os números do tema 3 da Conta A (a Conta A ainda não estudou o tema 3: Novos 10).

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Em outro navegador, entre com a **Conta B** e abra o menu. | O atalho mostra **0/120 dominados**, mesmo com a Conta A já tendo progresso. | Nenhuma linha para a Conta B. | |
| Abra a tela de flashcards com a Conta B. | Todos os temas com 10 Novos. "Revisar os que errei" está desabilitado, com "Revisar os que errei: nenhum cartão errado ainda (Errados = 0 em todos os temas)." | Sem mudança. | |
| Com a Conta B, marque o tema 3, clique em "Começar" e responda "Sabia" em 5 cartões. Clique em "Encerrar". | Resumo: "Você respondeu 5 cartões." Na seleção, o tema 3 da Conta B mostra **Novos 5, Em aprendizado 5**. | Conta B: 5 linhas em `caixa 2`. | |
| Volte à Conta A e recarregue a tela de flashcards (F5). | O tema 3 da Conta A continua com **10 Novos**. Os demais números da Conta A são os do cenário 7. | A consulta com o e-mail da Conta A não mostra nenhuma linha do tema 3. | |

### 9. Duas abas na mesma revisão (resposta desatualizada, 409)

Use a Conta A e o tema 2, que ela ainda não estudou.

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Em "Por tema", marque o tema 2, clique em "Começar" e responda "Não sabia" em 3 cartões. Clique em "Encerrar". | Na seleção, o tema 2 mostra **Errados 3** e Novos 7. | 3 linhas do tema 2 em `caixa 1`. | |
| Abra duas abas com `flashcards.html` (aba 1 e aba 2). Em cada uma, escolha "Revisar os que errei", marque o tema 2 e clique em "Começar". | As duas mostram "Revisão dos que errei: 2. Manifesto Ágil" e "Cartão 1 de 3". | Sem mudança. | |
| Na aba 1, vire e clique em "Sabia" nos 3 cartões. | Resumo da aba 1: "Você respondeu 3 cartões." | Os 3 cartões em `caixa 2`, com `acertos 1` e `erros 1`. | |
| Na aba 2 (sem recarregar), vire o primeiro cartão e clique em "Sabia". | Aviso **"Este cartão já foi respondido em outra aba."** e "Cartão 2 de 3". | Sem mudança: os 3 cartões continuam em `caixa 2`. | |
| Na aba 2, repita nos outros 2 cartões. | Resumo da aba 2: "Nenhum cartão foi respondido nesta sessão. 3 cartões foram pulados e não entrou na contagem." Sabia 0, Não sabia 0. | **Nenhum** cartão do tema 2 em `caixa 3`. Os 3 continuam em `caixa 2`, com `acertos 1` e `erros 1`. | |

### 10. Aleatório geral

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Na seleção, escolha "Aleatório geral". | A lista de temas fica desabilitada. Dica: "No modo aleatório geral, os cartões de todos os temas disponíveis entram na sessão." O botão "Começar" está habilitado sem tema marcado. | Sem mudança. | |
| Clique em "Começar". | "Aleatório geral" e **"Cartão 1 de 20"**. Os cartões vêm de vários temas (cada cartão mostra o tema em verde). | Sem mudança. | |

### 11. Recarregar a página durante a sessão

Continue na sessão aleatória do cenário 10.

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Vire e responda "Sabia" no cartão 1 e "Não sabia" no cartão 2. Anote a pergunta do cartão 3. | "Cartão 3 de 20". | As 2 respostas ficam gravadas (uma linha por cartão respondido, nova ou atualizada). | |
| Pressione F5. | A sessão **continua no "Cartão 3 de 20"**, com a mesma pergunta anotada. Não volta para a seleção. | Sem mudança: o F5 não grava respostas. | |

### 12. Botão Voltar do navegador na sessão

Continue na sessão do cenário 11.

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Clique no botão Voltar do navegador. | Diálogo **"Sair da sessão?"**: "Você respondeu 2 de 20 cartões. As respostas já dadas ficam salvas; os cartões restantes não serão contados." com "Continuar estudando" (já com o foco) e "Sair da sessão". A página não é abandonada. | Sem mudança. | |
| Pressione Esc. | O diálogo fecha e a sessão segue no "Cartão 3 de 20". | Sem mudança. | |
| Use o Voltar de novo e clique em "Sair da sessão". | A tela de **seleção**, ainda em `flashcards.html`. Os contadores refletem as 2 respostas dadas. | Sem mudança. | |
| Pressione F5. | A seleção continua (a sessão não é retomada, porque o candidato saiu dela). | Sem mudança. | |

### 13. Falha de conexão

Use o DevTools, aba Network, caixa "Offline" (ou o equivalente do seu navegador).

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Inicie uma sessão por tema, vire o cartão, marque "Offline" e clique em "Sabia". | Aviso **"Sem conexão: sua resposta não foi registrada. Tente novamente."** O cartão continua na tela e os botões voltam a ficar habilitados. | Nenhuma linha nova. | |
| Desmarque "Offline" e clique em "Sabia" de novo. | O aviso some e a sessão avança para o próximo cartão. | A resposta é gravada. | |
| Clique em "Encerrar", marque "Offline" e clique em "Nova sessão". | Aviso "Não foi possível carregar os flashcards. Tente novamente." e o botão **"Tentar novamente"**. | Sem mudança. | |
| Desmarque "Offline" e clique em "Tentar novamente". | A seleção é recarregada, **sem recarregar a página**, e o aviso some. | Sem mudança. | |

### 14. Teclado

Use só o teclado nesta sequência, com uma sessão aberta.

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Com a frente do cartão na tela, pressione 1. | Nada acontece: só se responde depois de virar. | Nenhuma linha nova. | |
| Pressione Espaço (ou Enter). | O cartão vira e mostra o verso. | Sem mudança. | |
| Pressione 2. | Registra "Sabia" e passa para o cartão seguinte. Em um cartão seguinte, vire com Enter e pressione 1: registra "Não sabia". | Uma linha por resposta. | |
| Pressione Tab. | O foco vai para o botão "Virar", com um **contorno verde visível**, e depois para "Encerrar". | Sem mudança. | |
| Na seleção, navegue com Tab e use Espaço para marcar um tema e Enter em "Começar". | Todos os controles são alcançáveis, e o foco nunca fica escondido atrás da barra "Começar" fixa no rodapé. | Sem mudança. | |

### 15. Celular (360 px) e zoom de 200%

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| No DevTools, ative a visualização de dispositivo e escolha a largura de 360 px. Percorra a seleção (inclusive com a legenda dos estados aberta), a sessão (frente e verso) e o resumo. | Tudo em uma coluna, **sem rolagem horizontal**. Os botões "Virar", "Sabia", "Não sabia", "Encerrar" e os do resumo ocupam a largura toda e têm pelo menos 44 px de altura. A barra "Começar" fica fixa no rodapé da seleção. | Sem mudança. | |
| Volte à janela normal e use o zoom do navegador em 200% (Ctrl e +). | O layout se reorganiza, sem rolagem horizontal e sem texto cortado no verso. | Sem mudança. | |
| Em 360 px, aumente o tamanho da fonte do navegador (Configurações, Aparência, Tamanho da fonte, "Muito grande"). | O texto cresce junto, sem rolagem horizontal. | Sem mudança. | |

### 16. Movimento reduzido

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| No DevTools, abra Rendering e defina "Emulate CSS media feature prefers-reduced-motion" como "reduce". Em uma sessão, vire o cartão. | O verso aparece **sem o giro**. Os avisos aparecem sem animação. | Sem mudança. | |
| Volte a "No emulation" e vire outro cartão. | O cartão gira. | Sem mudança. | |

### 17. Console sem erros

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Com o Console aberto, repita um fluxo completo (seleção, sessão, resumo, nova sessão). | Nenhum erro vermelho causado pela tela de flashcards. Um aviso de `favicon.ico` com 404 pode aparecer em qualquer página do portal e não conta. | Sem mudança. | |

### 18. Troca de versão de um cartão (`tema-04-fc05-v2`)

O cartão `tema-04-fc05` foi substituído por `tema-04-fc05-v2`, porque o verso antigo ("O Product Owner.") era idêntico à alternativa correta de três questões do exame. Em um banco **novo**, só a versão `-v2` existe. Este cenário vale para conferir os dois casos.

| Passo | O que a tela deve mostrar | Estado esperado | Resultado |
| --- | --- | --- | --- |
| Rode `docker compose exec db psql -U portal -d portal_certificacao -c "SELECT codigo_origem, ativo FROM tbflashcard WHERE codigo_origem LIKE 'tema-04-fc05%' ORDER BY id;"` | Em banco novo, **uma** linha: `tema-04-fc05-v2` com `ativo = t`. Em banco que já tinha o cartão antigo e foi preparado de novo, **duas** linhas: `tema-04-fc05` com `ativo = f` e `tema-04-fc05-v2` com `ativo = t`. | O log do `preparar-banco` mostra, na troca, `"inseridos":1,"existentes":119,"desativados":1`. | |
| Abra a seleção e confira o tema 4 (Papéis do Scrum). | O tema soma **10 cartões** (Novos mais Errados, Em aprendizado e Dominados). Em banco que já tinha o cartão antigo, o `-v2` entra como **Novo**. | O tema 4 tem 10 cartões ativos. | |
| Inicie uma sessão do tema 4 e procure o cartão "Qual papel do Scrum Team cria e comunica a visão e o Product Goal do produto?" | O verso explica o papel: "O Product Owner, que também gere o Product Backlog e o mantém claro, ordenado e alinhado às necessidades dos usuários e do negócio." | Sem mudança. | |
| Se o banco tinha o cartão antigo, rode `docker compose exec db psql -U portal -d portal_certificacao -c "SELECT f.codigo_origem, f.ativo, p.caixa, p.acertos, p.erros FROM tbprogresso_flashcard p JOIN tbflashcard f ON f.id = p.idflashcard WHERE f.codigo_origem LIKE 'tema-04-fc05%' ORDER BY 1, 2;"` | Sem efeito na tela. | As linhas de progresso do `tema-04-fc05` **continuam lá** (o progresso não é apagado), mas só o `-v2` conta nos totais. O progresso não passa para o `-v2`. | |

## Fechamento

Marque o resultado de cada critério de aceitação da issue #71:

| Critério de aceitação | Cenários | Resultado |
| --- | --- | --- |
| Os 120 cartões são carregados pelo `db:preparar`, inclusive no Docker, e uma correção de conteúdo exige novo código de versão. | Preparação e 1 | |
| Só candidatos com sessão acessam a tela e a API, e cada um altera apenas o próprio progresso. | 1 e 8 | |
| O card do menu mostra quantos cartões o candidato domina, e o atalho de estudos abre o tema já marcado. | 2 e 6 | |
| A sessão só mostra a resposta depois de virar e registra Sabia ou Não sabia conforme a regra Leitner. | 4, 6, 7 e 14 | |
| O modo de revisão traz apenas cartões em caixa baixa. No código, isso é **somente a caixa 1** (a issue cita as caixas 1 e 2; veja [Limitações e pendências](flashcards.md#limitações-e-pendências)). | 5 e 9 | |
| Nenhum cartão reproduz o enunciado ou a alternativa correta de uma questão do exame. | Conferência editorial, descrita em [flashcards.md](flashcards.md#limitações-e-pendências) | |
| A tela funciona em 360 px e por teclado, sem erros no console. | 14, 15 e 17 | |
| (Ajuste desta entrega) A tela mostra o estado do cartão a cada resposta, no resumo e na legenda, sem expor número de caixa. | 3, 4, 5, 6 e 7 | |
| (Ajuste desta entrega) Nenhum cartão repete a alternativa correta de uma questão do exame, incluindo a troca para `tema-04-fc05-v2`. | 18 e a conferência em [flashcards.md](flashcards.md#catálogo-de-cartões) | |

Para encerrar, rode os testes automatizados e compare com o esperado em [flashcards.md](flashcards.md#testes): `npm test` e `docker compose exec -e TEST_EXAME_POSTGRES=true app npm test`. As 8 falhas que já vêm da `develop` continuam as mesmas, e nenhum teste de flashcards falha.
