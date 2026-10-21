BEGIN;

INSERT INTO tbtema (nome, descricao, ordem)
VALUES
(
    'Fundamentos da Agilidade',
    'Crise do software, desenvolvimento tradicional e ágil e benefícios da agilidade.',
    1
),
(
    'Manifesto Ágil',
    'Os quatro valores e os doze princípios do Manifesto Ágil.',
    2
),
(
    'Introdução ao Scrum',
    'Framework Scrum, empirismo, transparência, inspeção e adaptação.',
    3
),
(
    'Papéis do Scrum',
    'Responsabilidades do Product Owner, Scrum Master e Developers.',
    4
),
(
    'Eventos do Scrum',
    'Sprint, Sprint Planning, Daily Scrum, Sprint Review e Sprint Retrospective.',
    5
),
(
    'Artefatos do Scrum',
    'Product Backlog, Sprint Backlog, Incremento e seus compromissos.',
    6
),
(
    'User Stories',
    'Estrutura de histórias de usuário e critérios de aceitação.',
    7
),
(
    'Gestão do Product Backlog',
    'Priorização, refinamento, organização e evolução do backlog.',
    8
),
(
    'Kanban',
    'Fluxo contínuo, quadro Kanban, limites de trabalho em progresso e gargalos.',
    9
),
(
    'Planejamento Ágil',
    'Sprint Planning, Story Points, Planning Poker e planejamento de releases.',
    10
),
(
    'Métricas Ágeis',
    'Velocity, Burndown, Burnup, Lead Time e Cycle Time.',
    11
),
(
    'Qualidade em Projetos Ágeis',
    'Definition of Done, testes automatizados, integração contínua, refatoração e dívida técnica.',
    12
)
ON CONFLICT (ordem) DO NOTHING;

COMMIT;