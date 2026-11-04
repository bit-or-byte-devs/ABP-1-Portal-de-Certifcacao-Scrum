# Carga dos temas de estudo

Os arquivos `database/temas/tema-01.json` a `tema-12.json` são a fonte versionada dos conteúdos da área de estudos. Cada tema contém introdução, seções com códigos estáveis, blocos de texto, listas, imagens, galerias, links e referências.

## Preparação completa

Consulte o [fluxo de preparação do banco](preparacao-banco.md). Para validar os dois catálogos ou aplicar as migrações e cargas, execute na raiz:

```sh
npm run db:preparar -- --validar
npm run db:preparar
```

Configure o PostgreSQL em `backend/.env` e instale as dependências com `npm run setup`. Em banco vazio fora do Docker, execute antes `database/ddl/schema.sql`.

## Importação individual

```sh
npm run db:temas -- --validar
npm run db:temas -- --migrar
npm run db:temas
```

`--validar` confere os 12 JSONs e os arquivos de imagem sem acessar o banco. `--migrar` aplica somente a migração 004, que depende das migrações anteriores, incluindo a 002. O comando sem argumento cadastra ou atualiza os temas e materiais em uma transação.

O `database/dml/seed.sql` mantém o catálogo básico dos 12 temas. O importador grava 12 introduções e 70 seções em `tbmaterial`, relaciona as 26 imagens por `tbmaterial_por_imagem` e remove apenas os antigos registros de material gerenciados por esta carga.

Os códigos como `tema-01-s01` identificam as seções e preservam o progresso quando o texto é revisado. Alterar o código cria outra identidade curricular; para ajustes comuns, mantenha o código e edite título, ordem ou blocos.

## Docker

```sh
docker compose up -d --build
docker compose logs preparar-banco
```

O serviço `preparar-banco` aplica as migrações e importa temas e questões antes de iniciar a aplicação. A criação do schema e a execução do seed continuam restritas à primeira criação do volume. Para instalações em uso, siga as [instruções de atualização e validação](preparacao-banco.md).
