document.addEventListener('DOMContentLoaded', async () => {
    try {
    const listaTemas = await portal.pedir('/api/estudos');
    const numeroTema = Number(new URLSearchParams(window.location.search).get('tema'));
    const tema = listaTemas.some(t => t.ordem === numeroTema) ? numeroTema : 1;
    const material = await portal.pedir(`/api/estudos/${tema}`);
    window.conteudoTemas = { [tema]: material.conteudo };
    const titulo = `${material.ordem}. ${material.nome}`;
    document.title = `BorB - ${titulo}`;
    document.getElementById('tema-titulo').textContent = titulo;
    document.getElementById('conteudo-titulo').textContent = titulo;
    document.getElementById('conteudo-descricao').textContent = material.descricao;

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

    let vistos = new Set(listaTemas.find(t => t.ordem === tema)?.vistos || []);
    const contarSubtitulos = numero => listaTemas.find(t => t.ordem === numero)?.total || 0;
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

        const subtitulosVistos = listaTemas.find(t => t.ordem === linkTema)?.vistos || [];
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

        let salvando = false;
        let pendente = false;
        const atualizarProgresso = async () => {
            pendente = true;
            if (salvando) return;
            salvando = true;
            try {
                while (pendente) {
                    pendente = false;
                    const dados = await portal.pedir(`/api/estudos/${tema}/progresso`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vistos: [...vistos] })
                    });
                    dados.vistos.forEach(i => vistos.add(i));
                    if (indicadorAtivo) indicadorAtivo.textContent = `${Math.round(vistos.size / subtitulos.length * 100)}%`;
                }
            } catch (erro) { portal.avisar(erro.message + ' Recarregue a página para tentar novamente.'); }
            finally { salvando = false; }
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
                    const indice = subtitulos.indexOf(entrada.target);
                    if (!vistos.has(indice)) { vistos.add(indice); atualizarProgresso(); }
                }
            });
        }, { threshold: 0.25 });
        subtitulos.forEach(subtitulo => observador.observe(subtitulo));
        atualizarProgresso();
    }
    document.querySelector('.btn-exam').href = `exame.html?tema=${tema}`;
    } catch (erro) { portal.avisar(erro.message); }
});
