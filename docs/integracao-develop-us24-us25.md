# Integração na develop — US24/US25

## Referências e decisões aprovadas
Branch temporária: integracao/develop-us24-us25.
Destino: develop@1d4ad685e3d22b7e5c8ff3890feb6691408ce499.
Origem: feature/resolver-US24-US25@28a88ac0680289fd26ce71873aee94e605b3691f.
Ancestral comum: 07f3299f4eff20542c91a254955543015e4b0c77.
A árvore estava limpa antes da preparação. Nenhum AGENTS.md foi encontrado
nos diretórios consultados.

Escolhas confirmadas pelo usuário:
1. Preservar ambas as migrações 007 e criar 008 de consolidação.
2. Manter a proteção da feature, com SQLSTATE 23514 e identificação da restrição.
3. Preservar emissão automática de certificados da develop.
4. Manter revisão, atualização do progresso pelo histórico, navegação circular,
   retorno à lista ao concluir e somente logout superior.
5. Combinar cenários de teste e atualizar documentação.

Nenhum commit, push ou exclusão de branch foi executado.
Nenhuma migração ou carga foi aplicada ao schema da aplicação.
Merge iniciado na temporária com --no-commit --no-ff.
Ao final da preparação, conflitos resolvidos e arquivos no índice, aguardando
revisão e commit do usuário. As branches originais permanecem nos commits acima.

## Resolução dos conflitos
- backend/scripts/preparar-banco.js e importar-questoes.js: executam as migrações
  anteriores, 007_versionamento_questoes, 007_historico_questoes e, por último,
  008_consolidacao_historico, antes de importar conteúdo.
- backend/tests/exame.postgres.test.js: combina testes das duas branches, inclusive
  histórico, proteção de proprietário, logout/login, certificados e navegação.
  O histórico da develop agora verifica 23514 e a restrição específica.
- frontend/js/exame.js e exames.js: comportamento final da feature preservado.
- docs/carga-questoes.md e preparacao-banco.md: instruções consolidadas.

Outros ajustes desta preparação:
- database/migrations/008_consolidacao_historico.sql: remove triggers e funções
  redundantes da implementação antiga e instala as funções e três triggers da
  US25. É transacional, repetível e não regrava dados históricos.
- backend/tests/preparar-banco.test.js: verifica ordem das duas 007 e da 008.
- docs/us25-manutencao-catalogo.md, exames.md e integracao-estudos.md: descrevem
  consolidação, navegação, revisão e emissão de registro de certificado.

Ambos os arquivos 007 permanecem idênticos aos de suas branches de origem.
O schema inicial mantém a proteção final da feature. O serviço certificacao.js
permanece idêntico ao da develop, incluindo emissão automática ao concluir com
pelo menos 65% de acertos (8 de 12), sem duplicação e com dados da emissão
preservados. Não foi acrescentada geração de PDF ou consulta pública.

As outras alterações e documentos já presentes na feature também entram pelo
merge, incluindo README e PDF da Sprint 2. Consulte o inventário do índice.
Relatórios e comandos anteriores de US24, US25 e integração de CSS são registros
das revisões anteriores; este documento descreve esta integração na develop.

## Validação
- Sintaxe dos scripts JavaScript alterados: aprovada.
- Interface com DOM/eventos simulados no Node: 15 aprovados, 0 falhos, 0 ignorados.
- Suíte completa: 75 aprovados, 0 falhos, 0 ignorados; saída 0.
  São 63 testes principais e 12 subtestes.
- TEST_EXAME_POSTGRES=true e TEST_RECUPERACAO_POSTGRES=true.
- Ambiente: Docker no WSL Ubuntu, Node 22 e PostgreSQL real do serviço db.
  Contêiner temporário com código atual montado somente para leitura em
  /workspace; schemas de teste isolados, removidos pelas suítes.
- git diff --cached --check sem erros na conferência final.

Os novos testes de consolidação verificam schema inicial, cada 007 separadamente,
ambas na ordem de preparação e ambas na ordem inversa. Aplicam 008 duas vezes,
conferem registros completos, resposta da API, certificado emitido, códigos de
erro específicos e somente os três triggers finais. Depois repetem a preparação
completa e conferem preservação de registros e ausência de triggers duplicados.

Comando para reproduzir na raiz pelo WSL:

~~~sh
docker compose run --rm --no-deps \
  -v "$PWD:/workspace:ro" -w /workspace/backend \
  -e NODE_PATH=/app/backend/node_modules \
  -e TEST_EXAME_POSTGRES=true -e TEST_RECUPERACAO_POSTGRES=true app npm test
~~~

## Limitações
Não houve teste visual em navegador ou BFCache real nesta revisão.
Não houve homologação no schema de entrega, atualização do contêiner da aplicação
ou alteração de dependências. Nenhuma US foi declarada done por este merge.
Dados corrompidos antes da proteção não são reconstruídos pela 008.
Arquivos de imagens e nome de tema não são versionados pelos triggers.
Não execute migrações 007 isoladas depois da consolidação: use o fluxo completo,
com aplicação parada. As migrações antigas podem recriar triggers redundantes
se a etapa final 008 for omitida.

## Conferir e concluir — comandos para o usuário
Execute na raiz. Não inicie outro merge enquanto o atual estiver pendente.

~~~sh
git branch --show-current
git status
git diff --name-only --diff-filter=U
git diff --cached --stat
git diff --cached --check
git diff --cached
~~~

Esperado: integracao/develop-us24-us25, sem arquivos não resolvidos e com merge
em andamento. Todo o conteúdo do índice entrará no commit; revise antes.

Para concluir somente na temporária:

~~~sh
git commit -m "merge: integra US24 e US25 na develop" -m "Consolida as protecoes do historico na migracao 008, preserva a emissao de certificados e combina revisao, progresso e navegacao circular. Validacao: 75 testes aprovados, sem falhas ou ignorados."
~~~

Depois do commit e de sua revisão, atualizar a develop local:

~~~sh
git switch develop
git merge --ff-only integracao/develop-us24-us25
git status
~~~

Se --ff-only recusar, a develop mudou; reavalie a divergência, sem reset ou force.
Esses comandos não fazem push. Nenhum comando de conclusão foi executado pelo agente.
