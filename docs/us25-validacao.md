# US25 — validação em 12/11/2026

## Referência
Issue: https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/issues/25
Branch: feature/resolver-US24-US25.
Commit base: f97d9b2 (US24 já commitada). Árvore inicialmente limpa.
Nenhum AGENTS.md encontrado na árvore ou nos ancestrais consultados.
Alterações desta revisão sem commit; nenhuma alteração publicada na issue.
DoD da Sprint 2 consultada no README. US26 e interface de histórico fora do escopo.

## Diagnóstico e estratégia
Os vínculos, situações, alternativa escolhida, resultado e horários já existiam.
A consulta do gabarito usava as alternativas atuais, permitindo que SQL direto
alterasse a interpretação de tentativas antigas, apesar do hash no importador.

Adotada preservação das versões utilizadas, aproveitando códigos como
tema-01-q01-v2. A consulta existente permanece válida porque os dados relacionados
ficam protegidos desde a primeira tentativa, mesmo aberta. Não foram criadas
novas rotas nem tela, nem alterados sorteio, cálculo de nota ou fluxo da US24.

## Alterações
- database/migrations/007_historico_questoes.sql: triggers impedem mudança/exclusão
  de questões utilizadas, inserção/mudança/exclusão de suas alternativas e troca
  dos vínculos da tentativa. Bloqueio da questão coordena manutenção e criação
  da primeira tentativa. UPDATE sem mudança efetiva continua permitido.
- database/ddl/schema.sql: mesma proteção em instalação nova.
- backend/scripts/preparar-banco.js e importar-questoes.js: execução da 007 no
  fluxo completo e na migração individual.
- backend/tests/exame.postgres.test.js: quatro cenários adicionais para SQL direto,
  nova versão com gabarito diferente, migração repetida e concorrência.
- docs/carga-questoes.md e preparacao-banco.md: instruções compatíveis com a 007.
- docs/us25-manutencao-catalogo.md: procedimento de manutenção e limites da solução.

## Evidências executadas
Ambiente: Windows, WSL Ubuntu, Docker, Node 22.23.5, serviço PostgreSQL
postgres:16-alpine. Código atual montado somente para leitura em /workspace,
dentro de contêiner temporário da imagem app existente.
As suítes usam schemas temporários próprios no PostgreSQL real; não foi aplicada
migração, carga ou manutenção no schema da aplicação.

Suíte completa final: 55 aprovados, 0 falhos, 0 ignorados, saída 0.
Inclui 43 testes principais e 12 subtestes.
TEST_EXAME_POSTGRES=true e TEST_RECUPERACAO_POSTGRES=true.
A primeira execução também passou; a final ampliou a carga repetida para todos
os tipos de encerramento. Os testes da US24 passaram na mesma execução.
Sintaxe JavaScript e git diff --check sem erros.

Comando executado na raiz, pelo WSL:

~~~sh
docker compose run --rm --no-deps \
  -v /mnt/c/Users/aluno/Desktop/ABP-1-Portal-de-Certifcacao-Scrum:/workspace:ro \
  -w /workspace/backend -e NODE_PATH=/app/backend/node_modules \
  -e TEST_EXAME_POSTGRES=true -e TEST_RECUPERACAO_POSTGRES=true app npm test
~~~

## Critérios da issue
| Critério vigente | Evidência |
| --- | --- |
| Vínculos candidato/certificação/tema/questão | Relacionamentos existentes; migração e comparações integrais preservam os vínculos |
| Envio registra alternativa, resultado e horário | Novo teste verifica resposta correta/incorreta e horários no PostgreSQL |
| Expiração/interrupção sem escolha e sem horário de envio | Novo teste verifica NULL, resultado falso e horário de encerramento |
| Gabarito recuperável por relacionamento | Consulta da API verificada antes/depois da nova versão |
| Preservação após manutenção | Nova versão com outro gabarito mantém resposta/questão/alternativas antigas; SQL direto bloqueado; concorrência testada |
| Homologação no banco de entrega sem perda na carga | Comparações integrais após migração e preparação repetidas aprovadas em schema isolado; homologação de entrega PENDENTE |

O teste de versão compara registros completos das tentativas e certificações,
a questão/alternativas antigas e a resposta da API antes/depois. A repetição da
preparação compara também candidatos, questões e alternativas em conjunto.
O teste de migração usa estrutura com os triggers novos removidos, cria respostas
preexistentes, reaplica a 007 duas vezes e compara os registros. Não representa
todas as possíveis instalações antigas; estruturas anteriores devem seguir as
migrações 001 a 007 na ordem documentada.

## Limitações
Conteúdo alterado antes da proteção não é recuperável sem fonte externa histórica.
A migração não inventa gabaritos anteriores nem recalcula resultados antigos.
A proteção considera DML normal com triggers ativos, não ações administrativas
que os removam, TRUNCATE ou exclusão deliberada de tentativas.
Nome do tema e bytes de arquivos de imagem não são versionados por esses triggers;
preserve arquivos antigos e utilize novos caminhos para imagens revisadas.
Questões antigas continuam elegíveis no sorteio; não foi criada regra de retirada.

## Homologação de entrega — pendente
A aplicação em execução e seu schema não foram modificados nesta revisão.
Os testes isolados não são homologação do banco de entrega.
Em ambiente de homologação com contas exclusivas e após disponibilizar esta versão:

- [ ] Executar preparação conforme docs/preparacao-banco.md com app parada,
      sem reaplicar schema nem remover volumes.
- [ ] Responder corretamente/incorretamente, expirar e interromper questões.
- [ ] Registrar consulta da API e registros completos antes da nova carga.
- [ ] Parar app e repetir a preparação; comparar IDs, vínculos, escolhas,
      resultados, situações e todos os horários.
- [ ] Criar versão nova pelo procedimento documentado; conferir gabarito novo
      e consulta da tentativa antiga mantendo seu gabarito original.
- [ ] Confirmar recusa de alteração incompatível em transação de teste.
- [ ] Registrar ambiente, commit publicado, executor, data e resultados.
- [ ] Obter aceite da equipe para o último critério.

Não declarar done antes dessa homologação.

## Sugestão de comentário — não publicado
US25: implementada preservação das versões utilizadas por tentativas, com migração
007 repetível e proteção contra alterações por SQL direto. Correções do catálogo
usam código novo; vínculos, resposta e consulta do gabarito antigo são preservados.
Suíte com PostgreSQL real: 55 aprovados, 0 falhos, 0 ignorados, incluindo US24,
nova versão, concorrência, migração e carga repetida com comparação integral.
Base f97d9b2; alterações ainda sem commit nesta revisão.
Relatório: docs/us25-validacao.md.
Preservação comprovada em schemas isolados; homologação no banco de entrega
permanece pendente. A issue não está sendo declarada done.
