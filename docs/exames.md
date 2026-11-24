# Exames: progresso e homologação

## Preparar e executar

Configure e inicie o projeto conforme [cadastro.md](./cadastro.md). Abra
http://localhost:3000/pages/exames.html pelo servidor (ou use a porta
configurada no `.env`). A página exige uma sessão autenticada.

## Comportamento do progresso

- `frontend/js/exames.js` consulta `GET /api/exames/progresso` e mostra os
  temas como pendentes, em andamento ou concluídos. O indicador de 100% quer
  dizer que a questão daquele tema foi encerrada; não representa a nota.
- `frontend/js/exame.js` envia a resposta escolhida ao servidor. A seleção só
  fica persistida quando é confirmada; uma opção apenas marcada e não enviada
  não é recuperada após sair ou atualizar a página.
- O servidor grava o resultado por candidato e tema. Questões respondidas,
  expiradas ou interrompidas não são substituídas por uma nova questão ao
  retornar. Uma questão aberta que é abandonada encerra como interrompida e
  conta como incorreta; retornar mostra esse resultado, não retoma o cronômetro.
- O logout encerra a questão aberta antes de invalidar a sessão. Se o aviso de
  saída da página não chegar ao servidor, a ausência de sinais periódicos
  também encerra a questão. Consulte [homologacao-us22.md](./homologacao-us22.md)
  para os cenários detalhados de interrupção.
- As rotas exigem sessão e associam progresso e respostas ao candidato
  autenticado. Uma tentativa de consultar ou alterar uma resposta de outro
  candidato deve retornar `404`; sem sessão, as rotas protegidas retornam
  `401`.

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

## Homologar o critério

Use duas contas de teste e questões carregadas. Para cada retorno, confirme o
estado pela tela e por `GET /api/exames/progresso`:

1. **Resposta:** responda uma questão, atualize a página ou entre novamente.
  A questão deve continuar concluída, com o mesmo resultado e sem duplicar a
  resposta.
2. **Expiração:** deixe o tempo acabar e retorne. A questão deve continuar
  concluída como incorreta e não aceitar nova resposta.
3. **Interrupção:** abandone uma questão aberta ou use logout. Ao retornar, ela
  deve aparecer concluída como interrompida; o próximo tema pendente deve
  continuar disponível.
4. **Sessão encerrada:** depois do logout, a sessão antiga deve receber `401`.
  Após novo login, o progresso persistido do candidato deve continuar visível.
5. **Isolamento:** com a segunda conta, consulte seu próprio progresso e tente
  acessar uma resposta da primeira conta. A segunda conta não deve ver nem
  alterar a resposta, e o estado da primeira conta deve permanecer intacto.

Os testes de integração PostgreSQL ficam em
`backend/tests/exame.postgres.test.js`. Execute `npm test` na pasta `backend`
para os testes gerais. A suíte PostgreSQL exige `TEST_EXAME_POSTGRES=true` e as
variáveis de conexão do banco configuradas no ambiente.

## Comportamento após a integração das US24/US25
A lista atualiza o progresso quando restaurada pelo histórico do navegador,
bloqueando ações até concluir a consulta. Temas concluídos oferecem Revisar quando
há id_resposta; a revisão consulta a tentativa existente sem iniciar outra.
O próximo tema é calculado pelo servidor em sequência circular: depois do 12
retorna ao primeiro pendente e pula os já encerrados. Sem pendências, oferece
Voltar à lista. A revisão mantém Voltar aos exames.
Somente o logout superior permanece; o botão adicional Encerrar sessão foi removido.

Ao concluir todos os temas com pelo menos 65% de acertos, o servidor registra
automaticamente um certificado em tbcertificado. Com 12 questões são necessários
8 acertos. Emissão repetida não duplica o registro e não atualiza os dados
copiados no momento da emissão. Isso não implementa PDF ou consulta pública.

A proteção histórica é consolidada pela migração 008 após os dois arquivos 007.
Consulte preparacao-banco.md e us25-manutencao-catalogo.md.
Evidências desta integração: integracao-develop-us24-us25.md.
A validação visual e o BFCache real continuam pendentes.
