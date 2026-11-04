# Correspondência dos PDFs com o catálogo do banco

O catálogo de referência é `database/dml/seed.sql`. O número no nome de um PDF identifica o documento de origem; não determina automaticamente `tbtema.ordem`. Os IDs existentes e as questões dos temas 1–4 permanecem intactos.

A tabela abaixo foi revisada pelos enunciados dos documentos. Para PDFs mistos, cada questão deve receber o tema indicado antes de gerar novos JSONs. Os JSONs estão organizados pelo tema de destino; questões sem equivalência foram removidas do catálogo JSON.

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
| 11 – Scrum em Escala | 1–4 | Fora do catálogo atual; removidas dos JSONs |
| 12 – Antipadrões e Transformação Ágil | 1 | 5 – Eventos do Scrum |
| 12 – Antipadrões e Transformação Ágil | 2–4 | Sem equivalência direta; removidas dos JSONs |

A tabela registra a origem histórica das questões e não garante que todos esses PDFs ainda estejam nesta pasta. Quando o PDF original não está disponível, o campo `fonte` dos JSONs aponta para o PDF temático atual com o mesmo conteúdo; `questao_origem` preserva o código histórico da questão.

Os PDFs atuais não oferecem uma seção dedicada a Kanban (tema 9 do banco) nem cobertura completa de Qualidade em Projetos Ágeis (tema 12). Não substituir esses temas por Scrum em Escala ou Transformação Ágil apenas para completar a numeração.

Ao converter novos documentos, mantenha no JSON a origem em `fonte` e acrescente `questao_origem` em cada questão. O `codigo` identifica a questão no tema de destino: reserve novos números para não colidir com códigos existentes. Metadados de origem não alteram o hash do conteúdo já cadastrado.

## Organização atual da carga

Cada arquivo tema-XX.json contém somente questões do tema indicado em database/dml/seed.sql. O campo codigo já corresponde ao cadastro efetivo, sem necessidade de destino. Cada questão mantém fonte e questao_origem para rastrear o documento original. As questões autorais foram incorporadas aos mesmos arquivos.

A reorganização preserva os 56 códigos, conteúdos e hashes já importados; não exige alteração no banco nem nas respostas existentes. Os códigos históricos de origem permanecem registrados em `questao_origem`, mesmo quando o PDF original não está mais disponível.
