# US25 — validação e commits

Nenhum commit, push ou comentário foi executado. Use estes blocos na raiz do
projeto pelo WSL. A base desta tarefa é f97d9b2; a US24 já estava commitada.
Revise o conteúdo antes de incluir arquivos no índice.

## Validação sem modificar o schema da aplicação
Requer serviço db em execução e imagem app disponível. Os testes usam schemas
temporários e o código atual montado somente para leitura.

~~~sh
docker compose run --rm --no-deps \
  -v "$PWD:/workspace:ro" -w /workspace/backend \
  -e NODE_PATH=/app/backend/node_modules \
  -e TEST_EXAME_POSTGRES=true -e TEST_RECUPERACAO_POSTGRES=true app npm test
git diff --check
~~~

Esperado nesta revisão: 55 aprovados, 0 falhos, 0 ignorados.

## Revisão e commit da implementação/testes
Confirme que git diff --cached --name-only não lista alterações de outra tarefa.
O commit inclui tudo que estiver no índice, inclusive arquivos preparados antes.

~~~sh
git status --short
git diff --cached --name-only
git diff -- database/ddl/schema.sql backend/scripts/preparar-banco.js backend/scripts/importar-questoes.js backend/tests/exame.postgres.test.js
cat database/migrations/007_historico_questoes.sql
git add -- database/ddl/schema.sql database/migrations/007_historico_questoes.sql backend/scripts/preparar-banco.js backend/scripts/importar-questoes.js backend/tests/exame.postgres.test.js
git diff --cached --stat
git diff --cached --check
git commit -m "fix: preserva versoes historicas das questoes na US25" -m "Protege questoes e alternativas utilizadas, preserva vinculos das tentativas e integra migracao repetivel. Testa versionamento, SQL direto, concorrencia e carga sem perda de registros."
~~~

## Commit da documentação
Antes, registre no relatório o hash do commit anterior (git rev-parse HEAD),
preservando a referência ao commit base. Mantenha homologação pendente se não executada.

~~~sh
git add -- docs/carga-questoes.md docs/preparacao-banco.md docs/us25-manutencao-catalogo.md docs/us25-validacao.md docs/us25-comandos.md
git diff --cached --stat
git diff --cached --check
git commit -m "docs: orienta manutencao e validacao do historico da US25"
git status --short
~~~

A homologação de entrega está descrita em docs/us25-validacao.md. A aplicação
atual ainda não recebeu a migração nesta revisão. Publicação e atualização do
ambiente devem seguir o procedimento de preparação documentado.
