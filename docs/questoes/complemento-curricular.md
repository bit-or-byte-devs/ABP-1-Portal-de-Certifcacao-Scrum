# Complemento curricular

O catálogo atual reúne **33 questões provenientes de documentos e 15 questões autorais**, totalizando **48 questões e 192 alternativas**, com exatamente quatro questões por tema.

## Questões autorais presentes nos JSONs

| Tema | Códigos | Quantidade |
| --- | --- | ---: |
| 7 — User Stories | `tema-07-q50` | 1 |
| 8 — Gestão do Product Backlog | `tema-08-q50` a `tema-08-q52` | 3 |
| 9 — Kanban | `tema-09-q50` a `tema-09-q53` | 4 |
| 10 — Planejamento Ágil | `tema-10-q50` | 1 |
| 11 — Métricas Ágeis | `tema-11-q50` a `tema-11-q51` | 2 |
| 12 — Qualidade em Projetos Ágeis | `tema-12-q50` a `tema-12-q53` | 4 |
| **Total** | | **15** |

As questões autorais estão nos respectivos arquivos `database/questoes/tema-XX.json`, junto às demais questões do tema. Os códigos a partir de `q50` são identificadores; não indicam a quantidade de questões do arquivo.

Cada questão tem quatro alternativas, uma correta e uma justificativa. O catálogo completo possui 12 questões com imagem e 36 sem imagem. As questões autorais não são transcrições dos PDFs.

A [distribuição por tema](mapeamento-temas.md) detalha a composição das 48 questões. As referências ao catálogo anterior no [relatório de integração](../relatorio-integracao-2026-11-02.md) são históricas e não representam a carga atual.

## Referências e carga

Referências conceituais: [Scrum Guide 2020, Ken Schwaber e Jeff Sutherland](https://scrumguides.org/scrum-guide.html), [Kanban Guide](https://kanbanguides.org/the-kanban-guide) e os conteúdos de `database/temas`. As referências orientam conceitos; testes automatizados verificam estrutura e integração e não substituem o aceite pedagógico.

Siga as [instruções de carga](../carga-questoes.md). A atualização da documentação não altera os JSONs nem a população de um banco existente. Questões já cadastradas devem respeitar as regras de código, hash e preservação de respostas do importador.
