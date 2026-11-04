# Carga dos temas de estudo

Os arquivos `database/temas/tema-01.json` a `tema-12.json` são a fonte versionada dos conteúdos da área de estudos. Cada tema contém introdução, seções com códigos estáveis, blocos de texto, listas, imagens, galerias, links e referências.

## Execução

Configure o PostgreSQL em `backend/.env` e execute pela raiz:

```sh
npm run db:temas -- --validar
npm run db:temas -- --migrar
npm run db:temas
```

`--validar` confere os 12 JSONs e os arquivos de imagem sem acessar o banco. `--migrar` aplica a migração 004, que pode ser repetida. O comando sem argumento cadastra ou atualiza os temas e materiais em uma transação.

O `database/dml/seed.sql` mantém o catálogo básico dos 12 temas. O importador grava 12 introduções e 70 seções em `tbmaterial`, relaciona as 26 imagens por `tbmaterial_por_imagem` e remove apenas os antigos registros de material gerenciados por esta carga.

Os códigos como `tema-01-s01` identificam as seções e preservam o progresso quando o texto é revisado. Alterar o código cria outra identidade curricular; para ajustes comuns, mantenha o código e edite título, ordem ou blocos.

## Docker

```sh
docker compose up -d --build
docker compose exec app npm run db:temas -- --migrar
docker compose exec app npm run db:temas
```

Os scripts automáticos do PostgreSQL são executados somente quando o volume é criado. Em volumes existentes, aplique a migração e a importação pelos comandos acima.
