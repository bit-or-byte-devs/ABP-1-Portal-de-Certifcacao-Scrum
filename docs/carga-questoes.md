# Carga de questões

Os 12 JSONs de `database/questoes` preservam 48 questões e 192 alternativas dos PDFs originais: exatamente quatro questões por tema. Não há questões extras nos temas 3, 4 ou 5; a distribuição atual é 4/4/4 em cada tema. Há imagens em 12 questões, todas nos temas 1, 2 e 3; a documentação das imagens também permanece disponível em `docs/questoes/questoes-imagens`, com os arquivos publicados em `imagens/questoes`. A aplicação aceita questões com imagem opcional.

O banco recusa qualquer questão que não tenha exatamente 4 alternativas (A–D) e exatamente 1 correta. Os comandos `--migrar` aplicam a `003_carga_questoes.sql` e depois a `005_alternativas_questao.sql`, ambas repetíveis. Em banco novo, o `database/ddl/schema.sql` já incorpora as duas estruturas. Em volume Docker antigo, o schema não é executado novamente; execute uma vez:

```powershell
docker compose exec app npm run db:questoes -- --migrar
```

## Execução

Pela raiz, configure o PostgreSQL e execute no PowerShell:

```powershell
npm run setup
npm run db:questoes -- --validar
npm run db:questoes -- --migrar
npm run db:questoes
```

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

A carga é transacional, serializada e repetível. Os IDs reais dos temas são consultados pela ordem. O hash impede substituir conteúdo já importado: alterações exigem novo código de versão. --vincular-imagens permite apenas adicionar imagem ao mesmo conteúdo anteriormente sem imagem, preservando IDs e respostas. Não substitui imagens nem textos. Questões cadastradas manualmente sem código de origem exigem revisão antes da primeira carga.

Se uma instalação já importou os JSONs 7–12 com a numeração antiga, revise esses registros e as respostas associadas antes de executar esta versão. A carga não reclassifica registros existentes; colisões de código com conteúdo diferente causam rollback. Não apague respostas para corrigir o catálogo.

## Docker

```sh
docker compose up -d --build
docker compose exec app npm run db:questoes -- --migrar
docker compose exec app npm run db:questoes
```

O Docker inclui database e imagens. A carga é manual após iniciar os serviços; não é executada a cada inicialização. Não remova volumes para recarregar questões.

As imagens documentais ficam em docs/questoes/questoes-imagens. As públicas ficam em imagens/questoes; os caminhos antigos de imagens/ também foram preservados para bancos existentes. A API usa LEFT JOIN e a tela omite a imagem quando nula. Créditos não informados permanecem nulos. Algumas ilustrações dão pistas da resposta e precisam de revisão pedagógica.

## Cobertura atual

Todos os 12 temas têm exatamente quatro questões importáveis: 48 questões e 192 alternativas ao todo. Não há questões extras nos temas 3, 4 e 5. As imagens estão presentes nas quatro questões dos temas 1, 2 e 3; as questões dos temas 4–12 não possuem imagem. A revisão pedagógica e a carga no ambiente de destino continuam necessárias.
