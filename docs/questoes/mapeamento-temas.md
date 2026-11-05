# Organização e origem das questões

O catálogo de temas é definido em `database/dml/seed.sql`. As questões disponíveis para importação estão em `database/questoes/tema-01.json` a `tema-12.json`.

O catálogo atual contém **48 questões, exatamente quatro por tema, e 192 alternativas**. Cada questão possui quatro alternativas e uma resposta correta.

## Distribuição atual

| Tema | Arquivo | Questões de documentos | Questões autorais | Total |
| --- | --- | ---: | ---: | ---: |
| 1 — Fundamentos da Agilidade | `tema-01.json` | 4 | 0 | 4 |
| 2 — Manifesto Ágil | `tema-02.json` | 4 | 0 | 4 |
| 3 — Introdução ao Scrum | `tema-03.json` | 4 | 0 | 4 |
| 4 — Papéis do Scrum | `tema-04.json` | 4 | 0 | 4 |
| 5 — Eventos do Scrum | `tema-05.json` | 4 | 0 | 4 |
| 6 — Artefatos do Scrum | `tema-06.json` | 4 | 0 | 4 |
| 7 — User Stories | `tema-07.json` | 3 | 1 | 4 |
| 8 — Gestão do Product Backlog | `tema-08.json` | 1 | 3 | 4 |
| 9 — Kanban | `tema-09.json` | 0 | 4 | 4 |
| 10 — Planejamento Ágil | `tema-10.json` | 3 | 1 | 4 |
| 11 — Métricas Ágeis | `tema-11.json` | 2 | 2 | 4 |
| 12 — Qualidade em Projetos Ágeis | `tema-12.json` | 0 | 4 | 4 |
| **Total** | | **33** | **15** | **48** |

As 15 questões autorais estão descritas em [complemento curricular](complemento-curricular.md). O catálogo tem 12 questões com imagem e 36 sem imagem.

## Identificação e rastreabilidade

Cada JSON contém somente as questões do tema indicado no campo `tema`, correspondente a `tbtema.ordem`. Nos arquivos atuais, `codigo` identifica diretamente a questão no tema de destino, sem redirecionamento por `destino`.

Os campos `fonte` e `questao_origem` preservam a rastreabilidade. O número histórico da questão de origem pode diferir do tema atual. Por exemplo, em User Stories, `tema-07-q01` registra `tema-10-q01` como origem. O campo `fonte` informa o documento temático atual ou a referência às questões autorais.

Os IDs do banco são consultados pelos importadores e não devem ser presumidos a partir dos números dos arquivos. Questões já importadas são reconhecidas por `codigo_origem` e `hash_origem`. Para modificar conteúdo de uma questão já cadastrada, respeite o versionamento descrito nas [instruções de carga](../carga-questoes.md).

## Registros anteriores

O [relatório de integração de 02/11/2026](../relatorio-integracao-2026-11-02.md) mantém os registros históricos de outra distribuição do catálogo. Esses registros não definem a quantidade da carga atual.

Alguns testes ainda esperam a distribuição anterior, com questões extras nos temas 3, 4 e 5. A documentação atual considera quatro questões por tema; os ajustes desses testes permanecem pendentes.
