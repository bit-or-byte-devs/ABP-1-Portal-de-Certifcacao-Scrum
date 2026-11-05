# Carga de questões

Os 12 JSONs atuais contêm 48 questões importáveis, quatro por tema, com 192 alternativas. São 12 questões com imagens e 36 sem imagens; a aplicação aceita ambas. O importador aceita o campo `destino` para mapear uma questão para outro tema/código ou ignorá-la quando esse campo é `null`.

O [mapeamento curricular](questoes/mapeamento-temas.md) apresenta a distribuição atual: 33 questões provenientes de documentos e 15 questões autorais, descritas no [complemento curricular](questoes/complemento-curricular.md). Juntas, elas formam as 48 questões; o complemento já está incluído nesse total.

## Preparação completa

Consulte o [fluxo de preparação do banco](preparacao-banco.md). Pela raiz, configure o PostgreSQL em `backend/.env` e execute:

```sh
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

O comando `--migrar` aplica somente a migração 003, que é repetível. Em banco existente, aplique também as migrações anteriores necessárias. Para essa importação individual, os temas precisam estar cadastrados, pelo seed ou pelo importador dos temas. `--validar` lê os arquivos e não acessa o banco.

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

O catálogo atual tem exatamente quatro questões por tema, mas imagens continuam opcionais. A revisão pedagógica e a carga no ambiente de destino continuam necessárias.

O total de referência para a carga é 48 questões e 192 alternativas, com quatro questões em cada um dos 12 temas. Três testes existentes em `backend/tests/importar-questoes.test.js` ainda esperam 56 questões e a distribuição anterior. Esses testes precisam ser ajustados ao catálogo atual; esta correção de documentação não modifica testes nem JSONs.
