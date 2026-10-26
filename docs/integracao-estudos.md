# Estudos e exames

As páginas de temas, estudos, exames e perfil exigem a sessão do login existente. Perfil exibe o nome da conta e Log Out encerra a sessão.

## Banco existente

Aplique `database/migrations/002_progresso_estudos.sql` e depois `database/dml/seed.sql` com psql no banco configurado. Não execute o schema inicial sobre um banco existente. Volumes Docker existentes não executam novamente os scripts de inicialização.

Em banco novo, `schema.sql` e `seed.sql` já incluem progresso e cadastro dos materiais.

## Material e progresso

`GET /api/estudos` lista os temas do banco com progresso do candidato autenticado. `GET /api/estudos/:ordem` serve o conteúdo HTML versionado em `backend/src/services/conteudoTemas.js`. `tbmaterial` registra o endereço dessa API. O conteúdo não é HTML fornecido pelo usuário.

`PUT /api/estudos/:ordem/progresso` recebe `{ "vistos": [0, 1] }`. Os índices de subtítulos são validados e unidos ao progresso anterior no PostgreSQL. O progresso é por conta; dados antigos de localStorage não são importados, pois não identificam o candidato. O HTML fornecido pela feature é mantido no backend como fonte única.

## Exames

`POST /api/exames/:ordem/iniciar` inicia ou retoma uma questão do tema, mantendo uma certificação por candidato e uma resposta por tema, conforme o schema existente. `POST /api/exames/respostas/:id` recebe `{ "alternativa": 123 }`, confere propriedade e alternativa, grava a resposta e calcula o resultado no servidor. Respostas concluídas não podem ser substituídas. A certificação é concluída após os 12 temas. O resultado parcial usa o total de 12 questões como denominador.

Cadastre questões reais em `tbquestao`, imagens em `tbimagem` e quatro alternativas A–D em `tbalternativa`, com uma correta. O seed atual não contém questões: nesse caso a tela informa a indisponibilidade, sem apresentar uma prova fictícia. A emissão de certificado continua fora deste fluxo; não é emitido documento apenas por concluir a leitura.

## Verificação

Execute `npm ci` e `npm test` na pasta backend. Os testes comuns usam banco simulado; a suíte PostgreSQL de recuperação depende de configuração específica. Para conferir o fluxo real, aplique os SQLs num banco de teste, inicie o servidor, entre com duas contas e confira isolamento do progresso, retomada da prova, persistência após logout e impossibilidade de responder por outro candidato.
