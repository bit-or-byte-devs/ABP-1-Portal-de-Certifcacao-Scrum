# Estudos e exames

As páginas de temas, estudos, exames e perfil exigem a sessão do login existente. Perfil exibe o nome da conta e Log Out encerra a sessão.

## Banco existente

Use a preparação completa descrita em `docs/preparacao-banco.md`: migrações 001 a 008, incluindo os dois arquivos 007, e cargas de temas e questões. Não execute o schema inicial sobre um banco existente. Volumes Docker existentes não executam novamente os scripts de inicialização.

Em banco novo, `schema.sql` e `seed.sql` criam a estrutura e o catálogo dos temas. A carga dos materiais é feita pelo importador descrito em `docs/carga-temas.md`.

## Material e progresso

`GET /api/estudos` lista os temas do banco com progresso do candidato autenticado. `GET /api/estudos/:ordem` monta o conteúdo estruturado cadastrado em `tbmaterial`. A fonte versionada são os 12 arquivos em `database/temas`.

`PUT /api/estudos/:ordem/progresso` recebe códigos estáveis, por exemplo `{ "vistos": ["tema-01-s01"] }`. Os códigos são conferidos contra as seções importadas e unidos ao progresso anterior no PostgreSQL. A migração 004 converte os índices antigos para esses códigos.

## Exames

`POST /api/exames/:ordem/iniciar` cria uma questão para o tema ou devolve o estado já registrado para aquele tema, mantendo uma certificação por candidato e uma resposta por tema. Não retoma uma questão encerrada. Reabrir uma questão ainda em andamento a encerra como interrompida. `POST /api/exames/respostas/:id` recebe `{ "alternativa": 123 }`, confere propriedade e alternativa, grava a resposta e calcula o resultado no servidor. Respostas concluídas não podem ser substituídas. `GET /api/exames/progresso` retorna o progresso da sessão autenticada. A certificação é concluída após os 12 temas; o resultado parcial usa o total de 12 questões como denominador.

`GET /api/exames/progresso` retorna `resultado_final` somente após a conclusão dos 12 temas, com nota, percentual de acertos, quantidade de respostas corretas, percentual mínimo para aprovação (65%) e condição de aptidão para o certificado. A página de certificados exibe o progresso e o resultado em modo somente leitura.

Ao concluir os 12 temas com pelo menos 65% de acertos, o servidor registra automaticamente o certificado em `tbcertificado` e cria um código de validação único. O titular vê esse código no resultado autenticado; `POST /api/certificados/validar` permite validá-lo publicamente sem login e retorna somente nome, nota, percentual e data de emissão. O design visual final e a representação do código em QR Code serão integrados posteriormente.

Cadastre questões reais em `tbquestao`, imagens em `tbimagem` e quatro alternativas A–D em `tbalternativa`, com uma correta. O seed atual não contém questões: nesse caso a tela informa a indisponibilidade, sem apresentar uma prova fictícia. Concluir a leitura não emite certificado.

## Verificação

Execute `npm ci` e `npm test` na pasta backend. Os testes comuns usam banco simulado; as suítes PostgreSQL dependem de configuração específica. Para conferir o fluxo real, aplique os SQLs num banco de teste, inicie o servidor e entre com duas contas. Confira que os estados respondido, tempo esgotado e interrompido permanecem após sair e entrar novamente; que uma questão interrompida não é reaberta; que o progresso retornado pertence à sessão autenticada; e que outro candidato não consegue consultar nem responder à questão.
