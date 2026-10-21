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
    document.title = `BorB - ${temas[tema].titulo}`;
    document.getElementById('tema-titulo').textContent = temas[tema].titulo;
    document.getElementById('conteudo-titulo').textContent = temas[tema].titulo;
    document.getElementById('conteudo-descricao').textContent = temas[tema].descricao;

    const descricao = document.getElementById('conteudo-descricao');
    const artigo = document.getElementById('conteudo-texto');

    if (window.conteudoTemas && window.conteudoTemas[tema]) {
        descricao.hidden = true;
        artigo.innerHTML = window.conteudoTemas[tema];
        artigo.hidden = false;
    } else {
        artigo.hidden = true;
        descricao.hidden = false;
    }

    const chaveProgresso = `borb-progresso-tema-${tema}`;
    let vistos = new Set();
    try {
        vistos = new Set(JSON.parse(localStorage.getItem(chaveProgresso) || '[]'));
    } catch {
        vistos = new Set();
    }

    const contarSubtitulos = numero => {
        const conteudo = window.conteudoTemas?.[numero];
        if (!conteudo) return 0;
        const temporario = document.createElement('div');
        temporario.innerHTML = conteudo;
        return temporario.querySelectorAll('h3, h4').length;
    };

    document.querySelectorAll('.topic-link').forEach(link => {
        const linkTema = Number(new URL(link.href).searchParams.get('tema'));
        const itemTema = link.parentElement;
        let indicador = itemTema.querySelector('.topic-progress');
        if (!indicador) {
            indicador = document.createElement('span');
            indicador.className = 'topic-progress';
            indicador.setAttribute('aria-label', 'Progresso do tema');
            itemTema.appendChild(indicador);
        }

        let subtitulosVistos = [];
        try {
            subtitulosVistos = JSON.parse(localStorage.getItem(`borb-progresso-tema-${linkTema}`) || '[]');
        } catch {
            subtitulosVistos = [];
        }
        const totalSubtitulos = contarSubtitulos(linkTema);
        const percentual = totalSubtitulos
            ? Math.round((new Set(subtitulosVistos).size / totalSubtitulos) * 100)
            : 0;
        indicador.textContent = `${percentual}%`;

        if (linkTema === tema) {
            link.parentElement.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    const subtitulos = [...artigo.querySelectorAll('h3, h4')];
    const itemAtivo = document.querySelector('.topic-link[aria-current="page"]')?.parentElement;
    if (subtitulos.length && itemAtivo) {
        const menuSubtitulos = document.createElement('ul');
        menuSubtitulos.className = 'subtopic-links';
        const indicadorAtivo = itemAtivo.querySelector('.topic-progress');

        const atualizarProgresso = () => {
            try {
                localStorage.setItem(chaveProgresso, JSON.stringify([...vistos]));
            } catch {}
            const percentual = Math.round((vistos.size / subtitulos.length) * 100);
            if (indicadorAtivo) indicadorAtivo.textContent = `${percentual}%`;
        };

        subtitulos.forEach((subtitulo, indice) => {
            const id = `tema-${tema}-subtema-${indice + 1}`;
            subtitulo.id = id;
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = subtitulo.textContent;
            link.addEventListener('click', event => {
                event.preventDefault();
                subtitulo.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${id}`);
            });
            item.appendChild(link);
            menuSubtitulos.appendChild(item);
        });
        itemAtivo.appendChild(menuSubtitulos);

        const observador = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    vistos.add(subtitulos.indexOf(entrada.target));
                    atualizarProgresso();
                }
            });
        }, { threshold: 0.25 });
        subtitulos.forEach(subtitulo => observador.observe(subtitulo));
        atualizarProgresso();
    }
});
