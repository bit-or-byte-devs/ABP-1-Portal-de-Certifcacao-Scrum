# Correspondência dos PDFs com o catálogo do banco

O catálogo de referência é `database/dml/seed.sql`. O número no nome de um PDF identifica o documento de origem; não determina automaticamente `tbtema.ordem`. Os IDs existentes e as questões dos temas 1–4 permanecem intactos.

A tabela abaixo foi revisada pelos enunciados dos documentos. Para PDFs mistos, cada questão deve receber o tema indicado antes de gerar novos JSONs. A carga integrada aplica os destinos explícitos dos JSONs 7–12; questões sem equivalência ficam como complementares e não são importadas.

| PDF de origem | Questões | Tema de destino no banco |
|---|---|---|
| 1 – Fundamentos da Agilidade | 1–4 | 1 – Fundamentos da Agilidade |
| 2 – Manifesto Ágil | 1–4 | 2 – Manifesto Ágil |
| 3 – Introdução ao Scrum | 1–4 | 3 – Introdução ao Scrum |
| 4 – Papéis do Scrum | 1–4 | 4 – Papéis do Scrum |
| 5 – Eventos do Scrum | 1–4 | 5 – Eventos do Scrum |
| 6 – Artefatos do Scrum | 1–4 | 6 – Artefatos do Scrum |
| 7 – Responsabilidades no Scrum | 1, 3, 4 | 4 – Papéis do Scrum |
| 7 – Responsabilidades no Scrum | 2 | 10 – Planejamento Ágil (responsabilidade pela estimativa) |
| 8 – Pilares e Valores do Scrum | 1–4 | 3 – Introdução ao Scrum |
| 9 – Estimativas e Métricas Ágeis | 1, 3 | 10 – Planejamento Ágil |
| 9 – Estimativas e Métricas Ágeis | 2, 4 | 11 – Métricas Ágeis |
| 10 – Histórias de Usuário e Refinamento | 1, 2, 4 | 7 – User Stories |
| 10 – Histórias de Usuário e Refinamento | 3 | 8 – Gestão do Product Backlog |
| 11 – Scrum em Escala | 1–4 | Sem tema específico no catálogo atual; manter como material complementar até decisão curricular |
| 12 – Antipadrões e Transformação Ágil | 1 | 5 – Eventos do Scrum |
| 12 – Antipadrões e Transformação Ágil | 2–4 | Sem equivalência direta; manter como material complementar até decisão curricular |

Os PDFs atuais não oferecem uma seção dedicada a Kanban (tema 9 do banco) nem cobertura completa de Qualidade em Projetos Ágeis (tema 12). Não substituir esses temas por Scrum em Escala ou Transformação Ágil apenas para completar a numeração.

Ao converter novos documentos, mantenha no JSON a origem em `fonte` e acrescente `questao_origem` em cada questão. O `codigo` identifica a questão no tema de destino: reserve novos números para não colidir com códigos existentes. Metadados de origem não alteram o hash do conteúdo já cadastrado.

## Aplicação na carga integrada

O campo `tema` e o `codigo` original identificam o documento de origem. Quando presente, `destino: { "tema": 4, "codigo": "tema-04-q05" }` informa o cadastro efetivo no banco. `destino: null` preserva a questão apenas como complementar. A ausência do campo mantém o tema e código originais.

Os códigos dos temas 1–6 permanecem iguais. Os destinos dos PDFs 7–12 foram reservados sem colisões: PDF 7 → tema 4 q05/q06/q07 e tema 10 q01; PDF 8 → tema 3 q05–q08; PDF 9 → tema 10 q02/q03 e tema 11 q01/q02; PDF 10 → tema 7 q01–q03 e tema 8 q01; PDF 12 q01 → tema 5 q05. PDF 11 inteiro e PDF 12 q02–q04 são complementares.
