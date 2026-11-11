# Estudos e exames

As páginas de temas, estudos, exames e perfil exigem a sessão do login existente. Perfil exibe o nome da conta e Log Out encerra a sessão.

## Banco existente

Aplique as migrações até `database/migrations/004_conteudo_temas.sql`, execute `database/dml/seed.sql` e importe os temas. Não execute o schema inicial sobre um banco existente. Volumes Docker existentes não executam novamente os scripts de inicialização.

Em banco novo, `schema.sql` e `seed.sql` criam a estrutura e o catálogo dos temas. A carga dos materiais é feita pelo importador descrito em `docs/carga-temas.md`.

## Material e progresso

`GET /api/estudos` lista os temas do banco com progresso do candidato autenticado. `GET /api/estudos/:ordem` monta o conteúdo estruturado cadastrado em `tbmaterial`. A fonte versionada são os 12 arquivos em `database/temas`.

`PUT /api/estudos/:ordem/progresso` recebe códigos estáveis, por exemplo `{ "vistos": ["tema-01-s01"] }`. Os códigos são conferidos contra as seções importadas e unidos ao progresso anterior no PostgreSQL. A migração 004 converte os índices antigos para esses códigos.

## Exames

`POST /api/exames/:ordem/iniciar` inicia ou retoma uma questão do tema, mantendo uma certificação por candidato e uma resposta por tema, conforme o schema existente. `POST /api/exames/respostas/:id` recebe `{ "alternativa": 123 }`, confere propriedade e alternativa, grava a resposta e calcula o resultado no servidor. Respostas concluídas não podem ser substituídas. A certificação é concluída após os 12 temas. O resultado parcial usa o total de 12 questões como denominador.

`GET /api/exames/progresso` retorna `resultado_final` somente após a conclusão dos 12 temas, com nota, percentual de acertos, quantidade de respostas corretas, percentual mínimo para aprovação (65%) e condição de aptidão para o certificado. A página de certificados exibe esses dados em modo somente leitura; a emissão do documento não faz parte deste fluxo.

Cadastre questões reais em `tbquestao`, imagens em `tbimagem` e quatro alternativas A–D em `tbalternativa`, com uma correta. O seed atual não contém questões: nesse caso a tela informa a indisponibilidade, sem apresentar uma prova fictícia. A emissão de certificado continua fora deste fluxo; não é emitido documento apenas por concluir a leitura.

## Verificação

Execute `npm ci` e `npm test` na pasta backend. Os testes comuns usam banco simulado; a suíte PostgreSQL de recuperação depende de configuração específica. Para conferir o fluxo real, aplique os SQLs num banco de teste, inicie o servidor, entre com duas contas e confira isolamento do progresso, retomada da prova, persistência após logout e impossibilidade de responder por outro candidato.
