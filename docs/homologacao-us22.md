# Homologação da US22: interrupção durante uma questão

Requisitos: RF13, RF14, RF15 e RNF04.

## Como o exame trata a interrupção

O servidor não consegue observar uma ausência. Ele só conclui que o candidato saiu quando um sinal esperado deixa de chegar. Por isso a regra é:

- **Sinal periódico.** Enquanto a questão está em andamento, a página aberta chama `POST /api/exames/respostas/:id/sinal` a cada 5 s. O intervalo vem do servidor (`intervalo_sinal_segundos`), não de um número fixo no front. Cada sinal grava `tbresposta.data_hora_ultimo_sinal` (migração 006).
- **Limite de 15 s sem sinal.** Uma questão sem sinal há mais de 15 s é encerrada como `interrompida`, com `data_hora_encerramento` = último sinal + 15 s. Se o prazo de 150 s vencer antes do abandono, a questão continua sendo `tempo_esgotado`, com encerramento no fim do prazo.
- **Um único serviço de reconciliação.** A regra fica em `reconciliarQuestoesAbertas` (`backend/src/services/encerramentoQuestao.js`). Ela roda antes de qualquer leitura ou alteração: iniciar, varredura a cada 15 s, progresso, consulta, sinal, interromper, responder e logout. Nenhuma resposta é aceita sem essa reconciliação.
- **Avisos são atalhos.** Ao sair da página (`pagehide`), o navegador envia `navigator.sendBeacon` para `POST /api/exames/respostas/:id/interromper`. Ao voltar de uma queda de rede, a página consulta a questão e, se ainda estiver aberta, pede a interrupção. A entrega desses avisos não é garantida; quem garante a regra é o limite no servidor.

O que conta como interrupção:

- iniciar outro tema ainda não respondido ou reabrir o tema da questão aberta (outra aba, F5, link direto);
- logout, inclusive por outra aba;
- fechar a aba ou o navegador, sair da página, voltar pelo histórico;
- perda de conexão detectada pela página, mesmo curta. Contam o evento `offline`, um erro de `fetch` e o timeout de uma requisição. Uma resposta HTTP do servidor, mesmo 503, não conta como perda;
- qualquer outra ausência de sinal por mais de 15 s, como app em segundo plano no celular, computador suspenso ou processo do navegador encerrado.

Abrir um tema já encerrado só mostra o resultado e não interrompe a questão aberta de outro tema.

Sem conexão, a página trava as alternativas e o botão e mostra: "Sem conexão. Ao reconectar, esta questão será encerrada como interrompida e contará como incorreta." Ela não promete avisar o servidor enquanto está offline. Ao voltar, reconcilia antes de liberar qualquer coisa. Se a resposta enviada chegou antes da queda, o resultado mostrado é `respondida`.

**Por que fechar o navegador agora grava `interrompida`.** Antes, o servidor só ficava sabendo da saída quando o candidato iniciava outra questão. Até lá, a questão abandonada continuava `em_andamento`, e a varredura acabava marcando `tempo_esgotado` aos 152 s. Isso gravava a causa errada no histórico (RF20). Agora o fechamento envia o beacon de interrupção. Se ele não chegar, a falta de sinal encerra a questão como `interrompida` em até 15 s.

## Preparação

1. Suba o ambiente com `docker compose up -d --build` e confira `docker compose logs preparar-banco`. A linha `Aplicando migração 006_sinal_questao.sql...` deve aparecer.
2. Entre com um candidato de teste. Use um candidato sem certificação concluída e com temas pendentes.
3. Em cada cenário, anote o tema usado e rode o comando de conferência ao final.
4. Para conferir o sinal, deixe o DevTools aberto na aba Network: deve aparecer uma chamada `sinal` a cada 5 s enquanto a questão estiver aberta.

### Comando de conferência

Linux ou macOS (bash):

```sh
docker compose exec db psql -U portal -d portal_certificacao -c "SELECT r.id, t.ordem, r.situacao, r.acertou, r.data_hora_exibicao, r.data_hora_ultimo_sinal, r.data_hora_encerramento FROM tbresposta r JOIN tbtema t ON t.id = r.idtema ORDER BY r.id DESC LIMIT 5;"
```

Windows (PowerShell ou Prompt de Comando), na raiz do projeto:

```powershell
docker compose exec db psql -U portal -d portal_certificacao -c "SELECT r.id, t.ordem, r.situacao, r.acertou, r.data_hora_exibicao, r.data_hora_ultimo_sinal, r.data_hora_encerramento FROM tbresposta r JOIN tbtema t ON t.id = r.idtema ORDER BY r.id DESC LIMIT 5;"
```

Em todos os cenários abaixo, a questão interrompida tem `situacao = interrompida` e `acertou = f`. Uma nova abertura do mesmo tema mostra o resultado, sem sortear outra questão nem aceitar resposta.

## Cenários

### 1. Abrir o mesmo tema numa nova aba

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Na aba A, abra um tema pendente (tema N) e não responda. | Questão com cronômetro correndo. | Tema N: `em_andamento`, `acertou` vazio, `data_hora_encerramento` vazio. | |
| Copie o endereço da aba A e abra-o numa aba B. | Aba B: "A questão foi encerrada por interrupção e conta como incorreta." e a alternativa correta. | Tema N: `interrompida`, `f`, encerramento no instante em que a aba B abriu. Só uma linha para o tema N. | |
| Volte à aba A e aguarde até 5 s. | Aba A mostra o mesmo resultado de interrupção. Não é possível confirmar resposta. | Sem mudança. | |

### 2. Abrir outro tema numa nova aba

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Na aba A, abra o tema N e não responda. | Questão com cronômetro correndo. | Tema N: `em_andamento`. | |
| Na aba B, abra um outro tema pendente (tema M). | Aba B: questão do tema M com cronômetro cheio. | Tema N: `interrompida`, `f`, encerramento no instante em que a aba B abriu. Tema M: `em_andamento`. | |
| Volte à aba A e aguarde até 5 s. | Aba A: resultado de interrupção do tema N. | Sem mudança. | |

### 3. Atualizar a página (F5) durante a questão

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Abra um tema pendente e marque uma alternativa sem confirmar. | Questão com cronômetro correndo. | `em_andamento`. | |
| Pressione F5. | Após recarregar: resultado de interrupção, sem alternativa escolhida e com a correta destacada. | `interrompida`, `f`, encerramento no instante do F5. | |
| Pressione F5 de novo. | O mesmo resultado. Nenhuma questão nova. | Sem mudança; continua uma linha para o tema. | |

### 4. Fechar o navegador durante a questão e voltar depois de 30 s

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Abra um tema pendente e não responda. | Questão com cronômetro correndo. | `em_andamento`. | |
| Feche o navegador inteiro (todas as janelas). Aguarde 30 s. | — | `interrompida`, `f`. O encerramento é o instante do fechamento, se o beacon chegou, ou o último sinal + 15 s, se não chegou. Nunca `tempo_esgotado`. | |
| Abra o navegador, entre se for preciso e vá ao menu de exames. | O tema aparece como concluído. | Sem mudança. | |
| Abra o mesmo tema. | Resultado de interrupção. Não é possível responder. | Sem mudança. | |

### 5. Logout durante a questão, por outra aba

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Na aba A, abra um tema pendente e não responda. | Questão com cronômetro correndo. | `em_andamento`. | |
| Na aba B, abra o menu e clique em "Log Out". | Aba B vai para o login. | `interrompida`, `f`, encerramento no instante do logout. | |
| Volte à aba A e aguarde até 5 s. | Aba A vai para a tela de login. | Sem mudança. | |
| Entre de novo e abra o mesmo tema. | Resultado de interrupção. | Sem mudança. | |

### 6. Queda de rede curta e volta na mesma página

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Abra um tema pendente e não responda. Abra o DevTools na aba Network. | Questão com cronômetro correndo. | `em_andamento`. | |
| No seletor de throttling, escolha "Offline". | Na hora: alternativas e botão desabilitados, cronômetro parado e a mensagem "Sem conexão. Ao reconectar, esta questão será encerrada como interrompida e contará como incorreta." | Ainda `em_andamento`: o servidor não foi avisado. | |
| Tente marcar uma alternativa ou confirmar. | Nada é habilitado. | Sem mudança. | |
| Após 5 s, volte para "No throttling". | Resultado de interrupção, sem recarregar a página. | `interrompida`, `f`, encerramento no instante da volta. Se ficou offline mais de 15 s: último sinal + 15 s. | |

### 7. Sair para o menu e voltar pelo botão Voltar do navegador

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| Abra um tema pendente e não responda. | Questão com cronômetro correndo. | `em_andamento`. | |
| Clique em "← Voltar" (menu de exames). | Menu com o tema concluído (se o aviso de saída já tiver sido processado) ou em andamento. | `interrompida`, `f`, encerramento no instante da saída. | |
| Use o botão Voltar do navegador. | Resultado de interrupção antes de qualquer alternativa ficar clicável. | Sem mudança. | |

### 8. No celular: trocar de app por mais de 20 s e voltar

Use o endereço da máquina na rede local (por exemplo, `http://192.168.x.x:3000/pages/index.html`).

| Passo | O que a tela deve mostrar | Estado esperado em `tbresposta` | Resultado |
| --- | --- | --- | --- |
| No navegador do celular, abra um tema pendente e não responda. | Questão com cronômetro correndo. | `em_andamento`. | |
| Troque para outro app e aguarde mais de 20 s. | — | `interrompida`, `f`. O encerramento é o último sinal + 15 s, ou o instante da saída, se o navegador enviou o aviso. | |
| Volte ao navegador. | Em até 5 s, o resultado de interrupção. Não é possível responder. | Sem mudança. | |
