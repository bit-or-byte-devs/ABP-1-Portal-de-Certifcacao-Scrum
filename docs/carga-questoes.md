# Carga de questões

Os 12 JSONs preservam 48 questões dos PDFs originais. A carga aplica o [mapeamento curricular](questoes/mapeamento-temas.md): 41 questões originais importáveis e 15 novas questões autorais, totalizando 56 questões importáveis e 224 alternativas e 7 questões complementares sem equivalência no catálogo. Os campos de destino preservam os documentos e indicam o tema e código efetivamente usados no banco. São 12 questões com imagens e 44 sem imagens; a aplicação aceita ambas.

## Execução

Pela raiz, configure o PostgreSQL em backend/.env e execute:

```sh
npm run setup
npm run db:questoes -- --validar
npm run db:questoes -- --migrar
npm run db:questoes
```

Em banco novo, execute primeiro database/ddl/schema.sql e database/dml/seed.sql. O schema já incorpora a migração 003. Em banco existente, aplique as migrações anteriores necessárias e a 003, sem recriar as tabelas. O comando --migrar aplica somente a 003, que é repetível. --validar lê os arquivos e não acessa o banco; informa a quantidade importável.

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

Todos os 12 temas têm pelo menos quatro questões importáveis. Foram acrescentadas 15 questões autorais nos arquivos complemento-tema-XX.json, preservando as originais. Consulte [a origem e a distribuição do complemento](questoes/complemento-curricular.md). O total de 56 preserva as questões extras dos temas 3, 4 e 5; sete questões dos PDFs continuam apenas como material complementar.

A exigência de exatamente quatro questões por tema e imagem em todas ainda difere do catálogo atual: há questões extras e imagens opcionais. As imagens do PDF 4 permanecem documentais. A revisão pedagógica e a carga no ambiente de destino continuam necessárias.
