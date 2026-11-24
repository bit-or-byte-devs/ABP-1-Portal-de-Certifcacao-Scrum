# US24 — comandos de validação e commit

Nenhum commit foi executado pelo agente. Execute os blocos abaixo na raiz do
projeto pelo WSL, após revisar o diff. Estes comandos não fazem push nem fecham issues.

## Validação com a imagem existente
Requer serviços db disponíveis e imagem app já construída.
A montagem em /workspace usa o código atual, independentemente da versão da imagem.

~~~sh
docker compose run --rm --no-deps \
  -v "$PWD:/workspace:ro" -w /workspace/backend \
  -e NODE_PATH=/app/backend/node_modules \
  -e TEST_EXAME_POSTGRES=true -e TEST_RECUPERACAO_POSTGRES=true app npm test
~~~

Confira saída 0, zero falhas e zero ignorados. Conclua a homologação descrita em
docs/us24-validacao.md e atualize o relatório com o resultado real.

## Revisão
~~~sh
git status --short
git diff -- frontend/js/exames.js backend/tests/exame.postgres.test.js
git diff --check
cat backend/tests/progresso-interface.test.js
cat docs/us24-validacao.md
~~~

## Commit da implementação e testes
Execute somente depois de aprovar a revisão e os testes. O índice deve estar vazio
antes deste bloco; confira com git diff --cached --name-only, pois git commit também
inclui alterações que já estiverem no índice.

~~~sh
git diff --cached --name-only
git add -- frontend/js/exames.js backend/tests/exame.postgres.test.js backend/tests/progresso-interface.test.js
git diff --cached --stat
git diff --cached --check
git commit -m "fix: atualiza progresso da US24 ao retornar pelo historico"
~~~

## Commit do relatório
Registre no relatório o hash do commit anterior (git rev-parse HEAD), preservando o
commit base. Se a homologação não foi executada, mantenha seu status pendente.

~~~sh
git add -- docs/us24-validacao.md docs/us24-comandos.md
git diff --cached --stat
git diff --cached --check
git commit -m "docs: registra validacao e pendencias da US24"
git status --short
~~~
