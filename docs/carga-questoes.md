# Carga de questões

<<<<<<< HEAD
Os 12 JSONs de `database/questoes` preservam 48 questões e 192 alternativas dos PDFs originais: exatamente quatro questões por tema. Não há questões extras nos temas 3, 4 ou 5; a distribuição atual é 4/4/4 em cada tema. Há imagens em 12 questões, todas nos temas 1, 2 e 3; a documentação das imagens também permanece disponível em `docs/questoes/questoes-imagens`, com os arquivos publicados em `imagens/questoes`. A aplicação aceita questões com imagem opcional.

O banco recusa qualquer questão que não tenha exatamente 4 alternativas (A–D) e exatamente 1 correta. Os comandos `--migrar` aplicam a `003_carga_questoes.sql` e depois a `005_alternativas_questao.sql`, ambas repetíveis. Em banco novo, o `database/ddl/schema.sql` já incorpora as duas estruturas. Em volume Docker antigo, o schema não é executado novamente; execute uma vez:

```powershell
docker compose exec app npm run db:questoes -- --migrar
```
=======
Os 12 JSONs atuais contêm 48 questões importáveis, quatro por tema, com 192 alternativas. São 12 questões com imagens e 36 sem imagens; a aplicação aceita ambas. O importador aceita o campo `destino` para mapear uma questão para outro tema/código ou ignorá-la quando esse campo é `null`.
>>>>>>> bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/develop

O [mapeamento curricular](questoes/mapeamento-temas.md) apresenta a distribuição atual: 33 questões provenientes de documentos e 15 questões autorais, descritas no [complemento curricular](questoes/complemento-curricular.md). Juntas, elas formam as 48 questões; o complemento já está incluído nesse total.

<<<<<<< HEAD
Pela raiz, configure o PostgreSQL e execute no PowerShell:
=======
## Preparação completa

Consulte o [fluxo de preparação do banco](preparacao-banco.md). Pela raiz, configure o PostgreSQL em `backend/.env` e execute:
>>>>>>> bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/develop

```powershell
npm run setup
npm run db:preparar -- --validar
npm run db:preparar
```

Em banco vazio fora do Docker, execute antes `database/ddl/schema.sql`. O comando completo aplica as migrações 001 a 004, importa os temas e depois as questões.

## Importação individual

```sh
npm run db:questoes -- --validar
npm run db:questoes -- --migrar
npm run db:questoes
```

<<<<<<< HEAD
Em banco existente, o volume não é recriado e, por isso, deve executar o comando de migração mostrado acima. O volume antigo precisa da 005 mesmo que a 003 já tenha sido aplicada. No Docker:

```powershell
docker compose up -d --build
docker compose exec app npm run db:questoes -- --migrar
docker compose exec app npm run db:questoes
```

Para validar os testes PostgreSQL reconstruindo a imagem que contém os arquivos de teste:

```powershell
docker compose up -d --build
docker compose exec -e TEST_EXAME_POSTGRES=true app npm test
docker compose exec app npm test
```
=======
O comando `--migrar` aplica somente a migração 003, que é repetível. Em banco existente, aplique também as migrações anteriores necessárias. Para essa importação individual, os temas precisam estar cadastrados, pelo seed ou pelo importador dos temas. `--validar` lê os arquivos e não acessa o banco.
>>>>>>> bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/develop

A carga é transacional, serializada e repetível. Os IDs reais dos temas são consultados pela ordem. O hash impede substituir conteúdo já importado: alterações exigem novo código de versão. `--vincular-imagens` permite apenas adicionar imagem ao mesmo conteúdo anteriormente sem imagem, preservando IDs e respostas. Não substitui imagens nem textos. Questões cadastradas manualmente sem código de origem exigem revisão antes da primeira carga.

Se uma instalação já importou os JSONs 7–12 com outra numeração, revise esses registros e as respostas associadas antes de executar esta versão. A carga não reclassifica registros existentes; colisões de código com conteúdo diferente causam rollback. Não apague respostas para corrigir o catálogo.

## Docker

```sh
docker compose up -d --build
docker compose logs preparar-banco
```

O Docker inclui os JSONs e as imagens. O serviço `preparar-banco` executa as migrações e as cargas antes da aplicação. Não remova volumes para recarregar questões; siga o [procedimento para instalações existentes](preparacao-banco.md).

As imagens documentais ficam em `docs/questoes/questoes-imagens`. As públicas ficam em `imagens/questoes`; os caminhos antigos de `imagens/` também foram preservados para bancos existentes. A API usa `LEFT JOIN` e a tela omite a imagem quando nula. Créditos não informados permanecem nulos. Algumas ilustrações dão pistas da resposta e precisam de revisão pedagógica.

## Cobertura e testes

<<<<<<< HEAD
Todos os 12 temas têm exatamente quatro questões importáveis: 48 questões e 192 alternativas ao todo. Não há questões extras nos temas 3, 4 e 5. As imagens estão presentes nas quatro questões dos temas 1, 2 e 3; as questões dos temas 4–12 não possuem imagem. A revisão pedagógica e a carga no ambiente de destino continuam necessárias.
=======
O catálogo atual tem exatamente quatro questões por tema, mas imagens continuam opcionais. A revisão pedagógica e a carga no ambiente de destino continuam necessárias.

O total de referência para a carga é 48 questões e 192 alternativas, com quatro questões em cada um dos 12 temas. Três testes existentes em `backend/tests/importar-questoes.test.js` ainda esperam 56 questões e a distribuição anterior. Esses testes precisam ser ajustados ao catálogo atual; esta correção de documentação não modifica testes nem JSONs.
>>>>>>> bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/develop
