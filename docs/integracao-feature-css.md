# Integração feature-css com US24/US25 — 12/11/2026

## Estado
Branch temporária: integracao/feature-css-us24-us25.
Destino original: feature/resolver-US24-US25 em a4a3761.
Origem: feature-css em 71a50b6.
Base comum: b4b2feb.
Referências locais conferidas com o GitHub na análise anterior.
Árvore de trabalho limpa antes da preparação.
Merge iniciado com --no-commit --no-ff, sem criar commits nem fazer push.
Branches originais preservadas. O merge permanece em andamento na temporária,
com conflitos resolvidos e alterações preparadas no índice para revisão.

## Resolução
O único conflito textual foi frontend/js/exames.js.
Foi preservada a estrutura da US24 (consulta reutilizável, pageshow/pagehide,
bloqueio durante atualização/falha, descarte de respostas antigas e listeners únicos),
incorporando a revisão de temas concluídos da feature-css.
O botão Revisar consulta o id_resposta do estado atual e abre
exame.html?resposta=ID. Temas concluídos sem ID permanecem bloqueados.
Continuar permanece restrito a temas pendentes; revisão não inicia outra tentativa.

Entraram da feature-css os campos id_resposta e data_hora na API, a página de
revisão com data e cronômetro oculto, a remoção do botão adicional Encerrar sessão,
o estilo da data e o retorno da página de certificados ao menu.
O logout superior permanece disponível.

As expectativas dos testes da API foram ajustadas ao campo id_resposta,
incluindo null para temas sem tentativa.
Os testes da lista passaram a simular esse campo e cobrem revisão após conclusão,
atualização do ID ao voltar, listener único, bloqueio durante falha e ausência de
confirmação de interrupção ao escolher Revisar.
A migração 007, o schema e os importadores da US25 não foram alterados.

## Validação
- Testes locais da interface: 8 aprovados, 0 falhos, 0 ignorados.
- Suíte completa com PostgreSQL real: 59 aprovados, 0 falhos, 0 ignorados; saída 0.
  São 47 testes principais e 12 subtestes.
- TEST_EXAME_POSTGRES=true e TEST_RECUPERACAO_POSTGRES=true.
- Node 22 em contêiner temporário no Docker/WSL, código atual montado somente para
  leitura em /workspace, usando schemas temporários no PostgreSQL.
- A aplicação em execução e o schema da aplicação não foram atualizados.
- Sintaxe JavaScript verificada. Conferência final de whitespace e conflitos
  realizada antes da entrega.

Comando reproduzível a partir da raiz pelo WSL:

~~~sh
docker compose run --rm --no-deps \
  -v "$PWD:/workspace:ro" -w /workspace/backend \
  -e NODE_PATH=/app/backend/node_modules \
  -e TEST_EXAME_POSTGRES=true -e TEST_RECUPERACAO_POSTGRES=true app npm test
~~~

## Limites e homologação
Não houve validação visual em navegador nem execução real de BFCache.
Homologações pendentes das US24/US25 continuam pendentes.
Conferir revisão, retorno pelo histórico, cronômetro oculto na revisão, conclusão
dos 12 temas, botão de logout e retorno dos certificados no ambiente de entrega.
O horário exibido é o da tentativa; não implica envio quando houve interrupção
ou expiração. Não foram alterados os horários persistidos.

## Comandos para concluir — executar pelo usuário
Não reinicie o merge nem troque de branch enquanto o merge atual estiver pendente.
Todos os arquivos desta integração foram preparados no índice; confira antes
de criar o commit, pois ele incluirá todo o índice.

~~~sh
git branch --show-current
git status
git diff --name-only --diff-filter=U
git diff --cached --stat
git diff --cached --check
git diff --cached
~~~

Esperado: branch integracao/feature-css-us24-us25, nenhum arquivo não resolvido,
merge ainda em andamento, aguardando commit.

Após revisar:

~~~sh
git commit -m "merge: integra feature-css preservando as US24 e US25" -m "Combina revisao de respostas com atualizacao do progresso pelo historico. Ajusta o contrato da API nos testes e preserva as protecoes do historico. Validacao: 59 testes aprovados, sem falhas ou ignorados."
~~~

O comando acima conclui o merge SOMENTE na branch temporária. Para atualizar a
branch de destino com esse resultado já revisado:

~~~sh
git switch feature/resolver-US24-US25
git merge --ff-only integracao/feature-css-us24-us25
git status
~~~

Se --ff-only recusar, a branch de destino mudou; reavalie a divergência antes
de prosseguir. Não use reset ou force para contornar a recusa.
Nenhum push faz parte desses comandos.
