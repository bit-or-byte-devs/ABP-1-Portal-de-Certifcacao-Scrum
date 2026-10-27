# Carga de questões

Os quatro JSONs em `database/questoes` transcrevem os PDFs dos temas 1–4: 16 questões, 64 alternativas e os gabaritos e justificativas originais. Ligaduras tipográficas foram normalizadas (por exemplo, ﬁ para fi); quebras de linha foram unidas. Os temas 1–3 possuem imagens de apoio revisadas visualmente em `docs/questoes/questoes-imagens`, copiadas para `imagens/questoes` e referenciadas nos JSONs. O tema 4 permanece com `imagem: null`.

Na pasta backend:

```sh
npm run db:questoes -- --validar
npm run db:questoes -- --migrar
npm run db:questoes
```

Configure o banco em `backend/.env`. Em banco novo, execute primeiro schema.sql e seed.sql; o schema já contém as colunas desta migração. Em banco existente, use --migrar, sem recriar o schema. A migração é repetível. A carga exige os temas cadastrados pelo seed.

A importação é transacional e serializada entre execuções do importador. Reexecutar não duplica questões. Um hash do conteúdo impede substituir silenciosamente questões existentes: correções devem usar um novo código, como `tema-01-q01-v2`, preservando as respostas antigas. Questões antigas sem código de origem não são identificadas automaticamente; revise eventuais cadastros manuais antes da primeira carga.

Imagem opcional: `{ "caminho": "/imagens/arquivo.png", "alt": "Descrição", "credito": "Fonte" }`. O arquivo precisa existir. O importador valida A–D, exatamente uma correta, tema, código, enunciado e justificativa.

Esta branch ainda não contém a rota de exames da develop. Ao integrar, substitua o JOIN com tbimagem por LEFT JOIN e o frontend deve ocultar a imagem quando o campo vier nulo.

## Contêiner

O Dockerfile inclui os JSONs e migrações. Depois de construir e iniciar os serviços:

```sh
docker compose exec app npm run db:questoes -- --migrar
docker compose exec app npm run db:questoes
```

A carga não é executada a cada inicialização. Não remova o volume do banco para recarregar questões.

## Organização e novos temas

Os PDFs estão em `docs/questoes/questoes-pdf`. Consulte [o mapeamento](questoes/mapeamento-temas.md) antes de converter novos temas: a numeração dos documentos diverge do catálogo do banco. Os comandos também podem ser executados pela raiz, conforme [a estrutura do projeto](estrutura.md).

## Vincular imagens a questões já cadastradas

```sh
npm run db:questoes -- --vincular-imagens
```

A opção adiciona imagens às questões originais sem trocar seus IDs, alternativas ou respostas. Só aceita conteúdo cujo hash anterior corresponde exatamente à mesma questão sem imagem e cujo idimagem ainda é nulo. Não substitui imagens ou textos já cadastrados; alterações incompatíveis revertem a transação. Reexecutar não duplica registros. Em banco novo, a carga normal já inclui as imagens.

As imagens originais continuam em docs como referência. Os arquivos publicados ficam em `/imagens/questoes/`, caminho servido pelo Express e incluído no Dockerfile. A autoria/crédito não foi informada e permanece nula no banco.

Algumas imagens dão pistas visuais da resposta. São adequadas como apoio ao estudo, mas devem ser revistas pelo responsável pedagógico antes de uma avaliação sem pistas. A imagem 4 do tema 3 contém símbolos que podem confundir valores com pilares; o enunciado e o gabarito continuam sendo os do PDF.
