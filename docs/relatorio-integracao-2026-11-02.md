# Relatório do projeto — 02/11/2026

## Comparação das branches

Análise das referências locais: develop em 8d3624e e feature/questoes-db em 38f0cb3, com árvore de trabalho inicialmente limpa. Não foi feito fetch ou push; este relatório não afirma sincronização com o estado remoto atual.

A develop já reunia cadastro, autenticação por sessão, recuperação de senha, área de estudos com progresso por candidato, sorteio e resposta de questões, correção, cronômetro controlado pelo servidor, encerramento por tempo ou interrupção e consulta/retomada da certificação. A feature adiciona importação transacional, migração 003, JSONs dos 12 PDFs, documentação, reorganização de imagens e scripts npm na raiz.

## Integração realizada

Merge da feature na develop, preservando os avanços de ambas. O único conflito textual ocorreu no README: foram preservados a Sprint 2 e seus critérios, acrescentando links para a carga e este relatório.

Correções funcionais: LEFT JOIN na consulta de imagens; tratamento de imagem nula na tela; cópia das imagens para os caminhos públicos esperados e restauração dos caminhos antigos para compatibilidade; atualização dos testes que ainda esperavam somente 16 questões; destinos explícitos nos JSONs 7–12 conforme o mapeamento já documentado. As questões complementares são preservadas e excluídas da carga. Os códigos e hashes do conteúdo dos temas 1–6 não foram alterados.

## Validação

- npm test com TEST_EXAME_POSTGRES=true e TEST_RECUPERACAO_POSTGRES=true: 28 testes aprovados, zero falhas e zero ignorados.
- PostgreSQL real em schemas temporários isolados: recuperação, concorrência, sessões, prazo, interrupção, retomada e proteção de respostas.
- Novo teste de integração: migração executada duas vezes, importação repetida sem duplicação, 164 alternativas, questão sem imagem iniciada/consultada/respondida, resposta preservada após nova carga e imagem pública retornando HTTP 200.
- npm run db:questoes -- --validar: 41 questões importáveis validadas.
- Não foi realizada carga nem migração no schema da aplicação. Os testes criam e removem seus próprios schemas.
- Docker não está disponível no ambiente; build e execução em contêiner não foram validados. Não houve validação visual em navegador.

## Cobertura do banco de questões

Há 48 questões nos documentos: 41 importáveis e 7 complementares. A tabela descreve os arquivos integrados, não a população atual do banco da aplicação.

| Tema do catálogo | Questões importáveis |
|---|---:|
| 1 — Fundamentos da Agilidade | 4 |
| 2 — Manifesto Ágil | 4 |
| 3 — Introdução ao Scrum | 8 |
| 4 — Papéis do Scrum | 7 |
| 5 — Eventos do Scrum | 5 |
| 6 — Artefatos do Scrum | 4 |
| 7 — User Stories | 3 |
| 8 — Gestão do Product Backlog | 1 |
| 9 — Kanban | 0 |
| 10 — Planejamento Ágil | 3 |
| 11 — Métricas Ágeis | 2 |
| 12 — Qualidade em Projetos Ágeis | 0 |

12 questões possuem imagem e 29 não possuem. A exigência do README de exatamente quatro questões por tema, todas com imagem, ainda não está cumprida. Os quatro temas com menos de quatro questões e os dois sem nenhuma precisam de conteúdo complementar; não basta usar a numeração dos PDFs como tema.

## Andamento e próximos passos

O núcleo de estudos e exames está implementado e coberto pelos testes executados. A Sprint 2 tem avanço funcional além dos status genéricos “Em progresso”/“Pendente” do README, mas ainda não satisfaz integralmente o DoD de povoamento e imagens. Não é possível declarar a certificação completa enquanto os temas 9 e 12 não tiverem questões.

Prioridades: completar e revisar pedagogicamente o catálogo; validar as imagens e gabaritos contra os documentos; aplicar a migração e a carga no ambiente de destino após revisar cadastros prévios; homologar o fluxo completo no navegador e em Docker; atualizar o backlog com aceite da equipe. A emissão e validação de certificados ainda aparecem como indisponíveis na interface e não têm rotas implementadas na API examinada, permanecendo como trabalho futuro.

O merge é local. A publicação da develop no remoto não foi realizada.
