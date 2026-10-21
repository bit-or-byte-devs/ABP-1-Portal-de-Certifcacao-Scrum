document.addEventListener('DOMContentLoaded', () => {
    const temas = {
        1: { titulo: '1. Fundamentos da Agilidade', descricao: 'Crise do software, desenvolvimento tradicional e ágil e benefícios da agilidade.' },
        2: { titulo: '2. Manifesto Ágil', descricao: 'Os quatro valores e os doze princípios do Manifesto Ágil.' },
        3: { titulo: '3. Introdução ao Scrum', descricao: 'Definição do Scrum, empirismo, pensamento Lean, pilares e valores.' },
        4: { titulo: '4. Papéis do Scrum', descricao: 'Scrum Team, Product Owner, Scrum Master, Developers e suas interações.' },
        5: { titulo: '5. Eventos do Scrum', descricao: 'Sprint, Sprint Planning, Daily Scrum, Sprint Review e Sprint Retrospective.' },
        6: { titulo: '6. Artefatos do Scrum', descricao: 'Product Backlog, Sprint Backlog, Incremento e seus compromissos.' },
        7: { titulo: '7. User Stories', descricao: 'Histórias de usuário, critérios de aceitação, divisão e heurística INVEST.' },
        8: { titulo: '8. Gestão do Product Backlog', descricao: 'Ordenação, priorização, transparência e refinamento do Product Backlog.' },
        9: { titulo: '9. Kanban', descricao: 'Fluxo contínuo, visualização do trabalho, limites de WIP e gargalos.' },
        10: { titulo: '10. Planejamento Ágil', descricao: 'Sprints, Sprint Planning, Story Points, Planning Poker e releases.' },
        11: { titulo: '11. Métricas Ágeis', descricao: 'Velocity, Burndown, Burnup, Lead Time e Cycle Time.' },
        12: { titulo: '12. Qualidade em Projetos Ágeis', descricao: 'Qualidade, prevenção de defeitos, integração contínua e melhoria técnica.' }
    };

    const numeroTema = Number(new URLSearchParams(window.location.search).get('tema'));
    const tema = temas[numeroTema] ? numeroTema : 1;
    const arquivoPdf = `../pdf/temas/tema-${tema}.pdf`;

    document.title = `BorB - ${temas[tema].titulo}`;
    document.getElementById('tema-titulo').textContent = temas[tema].titulo;
    document.getElementById('conteudo-titulo').textContent = temas[tema].titulo;
    document.getElementById('conteudo-descricao').textContent = temas[tema].descricao;

    const visualizador = document.getElementById('visualizador-pdf');
    const descricao = document.getElementById('conteudo-descricao');
    const artigo = document.getElementById('conteudo-texto');

    if (window.conteudoTemas && window.conteudoTemas[tema]) {
        descricao.hidden = true;
        visualizador.hidden = true;
        artigo.innerHTML = window.conteudoTemas[tema];
        artigo.hidden = false;
    } else {
        artigo.hidden = true;
        visualizador.hidden = false;
        visualizador.src = arquivoPdf;
    }

    document.querySelectorAll('.topic-link').forEach(link => {
        const linkTema = Number(new URL(link.href).searchParams.get('tema'));
        if (linkTema === tema) {
            link.parentElement.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
});
