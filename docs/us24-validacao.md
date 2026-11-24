# US24 — revisão e validação em 12/11/2026

## Referência e escopo
Issue: https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/issues/24
Branch: feature/resolver-US24-US25.
Commit base: b4b2feb5bc02c31b2a95ade17cdfefbbbba5c9b7.
Alterações locais sem commit. Nenhuma publicação ou alteração da issue.
Nenhum AGENTS.md encontrado na árvore do projeto ou nos diretórios ancestrais consultados.
US25 fora do escopo.

## Diagnóstico
A rota GET /api/exames/progresso, os serviços de encerramento/certificação e as
restrições por candidato já implementam o cálculo persistente. Não foi necessário
alterar a API, o schema ou as regras de encerramento.
A lista de exames consultava a API somente no DOMContentLoaded, sem atualizar no
retorno pelo cache de navegação. Os listeners usavam os dados daquela consulta.
O teste de conclusão esperava 12 acertos, embora somente uma resposta correta
fosse enviada e os demais temas encerrassem por tempo/interrupção.

## Alterações e motivos
- frontend/js/exames.js: consulta/renderização reutilizável, atualização no
  pageshow com persisted=true e registro único dos listeners. Cada clique usa o
  estado atual; não há segunda consulta de progresso no pageshow inicial.
- Durante atualização, saída ou falha, ações ficam bloqueadas. Consultas anteriores
  são invalidadas para não sobrescrever o progresso depois de sair/retornar.
- backend/tests/progresso-interface.test.js: cinco regressões para consulta única,
  restauração, próximo tema atualizado, listeners, respostas fora de ordem,
  falha/recuperação e conclusão.
- backend/tests/exame.postgres.test.js: expectativa corrigida para 1 acerto,
  8,33% e reprovação; novo fluxo com resposta correta/incorreta, expiração,
  interrupção, logout/login e tentativa de alteração por outro candidato.

## Validação executada
Ambiente: Windows, WSL Ubuntu, Docker, Node 22.23.5 e PostgreSQL do serviço db
(imagem postgres:16-alpine). Contêiner temporário da imagem existente da aplicação,
com a árvore atual montada somente para leitura em /workspace. Aplicação em
execução não foi reconstruída nem substituída. Os testes de integração usam
schemas temporários próprios, removidos ao terminar, preservando dados da aplicação.

1. node --test backend/tests/progresso-interface.test.js:
   5 aprovados, 0 falhos, 0 ignorados.
2. Suíte completa, com TEST_EXAME_POSTGRES=true e
   TEST_RECUPERACAO_POSTGRES=true:
   51 aprovados (incluindo subtestes), 0 falhos, 0 ignorados; saída 0.
3. git diff --check: sem erros de whitespace.

Comando executado a partir da raiz no WSL:

~~~sh
docker compose run --rm --no-deps \
  -v /mnt/c/Users/aluno/Desktop/ABP-1-Portal-de-Certifcacao-Scrum:/workspace:ro \
  -w /workspace/backend -e NODE_PATH=/app/backend/node_modules \
  -e TEST_EXAME_POSTGRES=true -e TEST_RECUPERACAO_POSTGRES=true app npm test
~~~

A suíte cobre os 12 temas pendentes, tentativa em andamento, temas encerrados,
conclusão dos 12 temas, persistência ao entrar novamente e isolamento de contas.
O teste da interface usa DOM/eventos simulados no Node; não é teste em navegador.

## Critérios de aceite
| Critério vigente | Evidência desta revisão |
| --- | --- |
| API retorna os 12 estados por candidato | Teste de progresso aprovado com PostgreSQL real |
| Encerramentos por resposta, tempo e interrupção são concluídos | Testes existentes e novo fluxo integrado aprovados |
| Lista consome a API e desabilita concluídos | Código revisado e regressões de interface aprovadas; validação visual pendente |
| Homologação após responder, expirar, interromper, sair e retornar, sem perda/exposição | API/banco comprovados em schema isolado; navegador e ambiente de entrega pendentes |

## Homologação de entrega — pendente
Não foi utilizada uma ferramenta de automação de navegador nesta sessão.
Não há evidência de homologação visual nem do BFCache real nesta revisão.
Os testes no banco do serviço db em schemas isolados não equivalem ao aceite do
fluxo no schema de entrega.

Executar com contas exclusivas de teste no ambiente de entrega, após disponibilizar
a versão alterada. Não remover volumes nem apagar respostas para reiniciar testes.

- [ ] Responder corretamente e incorretamente; voltar à lista e conferir concluído/bloqueado.
- [ ] Expirar uma questão mantendo a página aberta e os sinais periódicos ativos;
      confirmar tempo_esgotado, tema concluído e zero acerto nessa tentativa.
- [ ] Interromper por saída da página e por perda de conexão; retornar e confirmar
      interrupção registrada, tema concluído e impossibilidade de responder novamente.
- [ ] Sair com questão aberta, entrar na mesma conta e conferir todos os estados.
- [ ] Retornar à lista pelo botão Voltar do navegador, com e sem restauração pelo
      cache de navegação; conferir nova consulta de progresso quando persisted=true.
      Pode-se observar pageshow pelo DevTools; não presumir BFCache apenas por usar Voltar.
- [ ] Verificar continuar apontando para um tema pendente, inclusive após Voltar.
- [ ] Entrar com outra conta; conferir independência e recusa das tentativas de outra conta.
- [ ] Encerrar os 12 temas; conferir conclusão e ausência da opção de continuar.
- [ ] Comparar tela, GET /api/exames/progresso e consulta somente leitura ao banco.
- [ ] Anexar data, navegador/versão, commit efetivamente publicado e capturas/resultados.

Consulta de conferência, no psql, trocando o ID pelo candidato de teste:

~~~sql
SELECT c.idcandidato, t.ordem, r.id, r.situacao, r.acertou,
       r.idalternativa, r.data_hora_resposta, r.data_hora_encerramento
FROM tbcertificacao c
JOIN tbresposta r ON r.idcertificacao = c.id
JOIN tbtema t ON t.id = r.idtema
WHERE c.idcandidato = 123
ORDER BY t.ordem;
~~~

## Sugestão de comentário para a issue — não publicado
US24: corrigida a atualização do progresso na restauração da lista pelo histórico,
com ações bloqueadas durante consulta/falha e listeners únicos usando o estado atual.
Adicionadas regressões de interface e persistência após novo login/isolamento.
Suíte com PostgreSQL real: 51 aprovados, 0 falhos, 0 ignorados.
Base: b4b2feb; alterações ainda sem commit nesta revisão.
Relatório: docs/us24-validacao.md.
O critério de homologação permanece aberto até validação no navegador e ambiente
de entrega, incluindo BFCache real. Esta revisão não declara a US24 done.
