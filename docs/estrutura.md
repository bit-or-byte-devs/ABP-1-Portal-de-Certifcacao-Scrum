# Organização do projeto

- `backend/src`: aplicação Express, com rotas, controllers, models, services, middlewares e configurações.
- `backend/scripts`: comandos de manutenção e importação; não são rotas públicas.
- `backend/tests`: testes do servidor e dos importadores.
- `frontend/pages`, `frontend/css`, `frontend/js`: interface servida pelo Express.
- `database/ddl`: instalação da estrutura em banco vazio.
- `database/migrations`: alterações incrementais em bancos existentes; não renumerar migrações vindas de outras branches.
- `database/dml`: cadastro inicial de temas.
- `database/questoes`: dados revisados para importação; contém gabaritos e não é publicado como pasta estática.
- `docs/questoes/questoes-pdf`: documentos originais.
- `docs/questoes/questoes-imagens`: referências documentais, não publicadas pelo servidor.
- `imagens`: imagens públicas utilizadas pelas telas. Novas imagens de questões devem ficar em `imagens/questoes`, com a URL `/imagens/questoes/arquivo.png`.

Não mova imagens existentes sem atualizar os caminhos nas páginas, no banco e no Dockerfile. As pastas vazias em frontend/assets podem permanecer até serem necessárias; a convenção atual de imagens públicas é `imagens/`.

## Comandos pela raiz

```sh
npm run setup
npm start
npm test
npm run db:questoes -- --validar
npm run db:questoes -- --migrar
npm run db:questoes
```

As dependências pertencem somente a `backend/package.json` e são instaladas em `backend/node_modules`. O package.json da raiz apenas encaminha comandos; `npm install` na raiz não instala o backend. O Docker continua usando `backend/package-lock.json` com npm ci. O backend carrega suas variáveis de backend/.env quando iniciado pelos comandos acima.

Antes de adicionar outros PDFs ao banco, consulte `docs/questoes/mapeamento-temas.md`.
