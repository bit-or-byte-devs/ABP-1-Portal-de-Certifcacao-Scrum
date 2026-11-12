# Estudos e exames

As páginas de temas, estudos, exames e perfil exigem a sessão do login existente. Perfil exibe o nome da conta e Log Out encerra a sessão.

## Banco existente

Aplique as migrações até `database/migrations/004_conteudo_temas.sql`, execute `database/dml/seed.sql` e importe os temas. Não execute o schema inicial sobre um banco existente. Volumes Docker existentes não executam novamente os scripts de inicialização.

Em banco novo, `schema.sql` e `seed.sql` criam a estrutura e o catálogo dos temas. A carga dos materiais é feita pelo importador descrito em `docs/carga-temas.md`.

## Material e progresso

`GET /api/estudos` lista os temas do banco com progresso do candidato autenticado. `GET /api/estudos/:ordem` monta o conteúdo estruturado cadastrado em `tbmaterial`. A fonte versionada são os 12 arquivos em `database/temas`.

`PUT /api/estudos/:ordem/progresso` recebe códigos estáveis, por exemplo `{ "vistos": ["tema-01-s01"] }`. Os códigos são conferidos contra as seções importadas e unidos ao progresso anterior no PostgreSQL. A migração 004 converte os índices antigos para esses códigos.

## Exames

`POST /api/exames/:ordem/iniciar` cria uma questão para o tema ou devolve o estado já registrado para aquele tema, mantendo uma certificação por candidato e uma resposta por tema. Não retoma uma questão encerrada. Reabrir uma questão ainda em andamento a encerra como interrompida. `POST /api/exames/respostas/:id` recebe `{ "alternativa": 123 }`, confere propriedade e alternativa, grava a resposta e calcula o resultado no servidor. Respostas concluídas não podem ser substituídas. `GET /api/exames/progresso` retorna o progresso da sessão autenticada. A certificação é concluída após os 12 temas; o resultado parcial usa o total de 12 questões como denominador.

Cadastre questões reais em `tbquestao`, imagens em `tbimagem` e quatro alternativas A–D em `tbalternativa`, com uma correta. O seed atual não contém questões: nesse caso a tela informa a indisponibilidade, sem apresentar uma prova fictícia. A emissão de certificado continua fora deste fluxo; não é emitido documento apenas por concluir a leitura.

## Verificação

Execute `npm ci` e `npm test` na pasta backend. Os testes comuns usam banco simulado; as suítes PostgreSQL dependem de configuração específica. Para conferir o fluxo real, aplique os SQLs num banco de teste, inicie o servidor e entre com duas contas. Confira que os estados respondido, tempo esgotado e interrompido permanecem após sair e entrar novamente; que uma questão interrompida não é reaberta; que o progresso retornado pertence à sessão autenticada; e que outro candidato não consegue consultar nem responder à questão.
