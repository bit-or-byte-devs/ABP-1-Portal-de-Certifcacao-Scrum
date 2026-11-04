function adicionarConteudo(elemento, conteudo) {
    if (typeof conteudo === 'string') { elemento.textContent = conteudo; return; }
    conteudo.forEach(parte => {
        if (parte.tipo === 'texto') elemento.append(document.createTextNode(parte.texto));
        else if (parte.tipo === 'destaque') {
            const strong = document.createElement('strong'); strong.textContent = parte.texto; elemento.append(strong);
        } else if (parte.tipo === 'link') {
            const link = document.createElement('a'); link.textContent = parte.texto; link.href = parte.url;
            if (parte.nova_aba) { link.target = '_blank'; link.rel = 'noopener'; }
            elemento.append(link);
        }
    });
}

function criarImagem(dados) {
    const figura = document.createElement('figure');
    const imagem = document.createElement('img');
    const url = new URL(dados.caminho, location.origin);
    if (url.origin !== location.origin && url.protocol !== 'https:') throw new Error('Endereço de imagem inválido.');
    imagem.src = url.href; imagem.alt = dados.texto_alternativo; figura.append(imagem);
    if (dados.legenda) {
        const legenda = document.createElement('figcaption'); legenda.textContent = dados.legenda; figura.append(legenda);
    }
    return figura;
}

function criarBloco(bloco) {
    if (bloco.tipo === 'paragrafo' || bloco.tipo === 'referencia') {
        const paragrafo = document.createElement('p');
        if (bloco.tipo === 'referencia') paragrafo.className = 'study-reference';
        adicionarConteudo(paragrafo, bloco.conteudo); return paragrafo;
    }
    if (bloco.tipo === 'lista') {
        const lista = document.createElement(bloco.ordenada ? 'ol' : 'ul');
        bloco.itens.forEach(conteudo => {
            const item = document.createElement('li'); adicionarConteudo(item, conteudo); lista.append(item);
        });
        return lista;
    }
    if (bloco.tipo === 'imagem') return criarImagem(bloco);
    if (bloco.tipo === 'galeria') {
        const galeria = document.createElement('div'); galeria.className = 'study-image-grid';
        galeria.setAttribute('aria-label', bloco.rotulo);
        bloco.imagens.forEach(imagem => galeria.append(criarImagem(imagem)));
        return galeria;
    }
    throw new Error('Tipo de conteúdo não reconhecido.');
}

function montarMaterial(artigo, material) {
    material.introducao.forEach(bloco => artigo.append(criarBloco(bloco)));
    return material.secoes.map(secao => {
        const subtitulo = document.createElement(`h${secao.nivel}`);
        subtitulo.id = secao.codigo; subtitulo.textContent = secao.titulo; artigo.append(subtitulo);
        secao.blocos.forEach(bloco => artigo.append(criarBloco(bloco)));
        return { codigo: secao.codigo, elemento: subtitulo };
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const listaTemas = await portal.pedir('/api/estudos');
        const numeroTema = Number(new URLSearchParams(window.location.search).get('tema'));
        const tema = listaTemas.some(item => item.ordem === numeroTema) ? numeroTema : 1;
        const material = await portal.pedir(`/api/estudos/${tema}`);
        const titulo = `${material.ordem}. ${material.nome}`;
        document.title = `BorB - ${titulo}`;
        document.getElementById('tema-titulo').textContent = titulo;
        document.getElementById('conteudo-titulo').textContent = titulo;

        const descricao = document.getElementById('conteudo-descricao');
        const artigo = document.getElementById('conteudo-texto');
        descricao.textContent = material.descricao;
        const subtitulos = montarMaterial(artigo, material);
        descricao.hidden = subtitulos.length > 0;
        artigo.hidden = subtitulos.length === 0;

        const vistos = new Set(listaTemas.find(item => item.ordem === tema)?.vistos || []);
        document.querySelectorAll('.topic-link').forEach(link => {
            const linkTema = Number(new URL(link.href).searchParams.get('tema'));
            const itemTema = link.parentElement;
            let indicador = itemTema.querySelector('.topic-progress');
            if (!indicador) {
                indicador = document.createElement('span'); indicador.className = 'topic-progress';
                indicador.setAttribute('aria-label', 'Progresso do tema'); itemTema.append(indicador);
            }
            indicador.textContent = `${listaTemas.find(item => item.ordem === linkTema)?.percentual || 0}%`;
            if (linkTema === tema) {
                itemTema.classList.add('active'); link.setAttribute('aria-current', 'page');
            }
        });

        const itemAtivo = document.querySelector('.topic-link[aria-current="page"]')?.parentElement;
        if (subtitulos.length && itemAtivo) {
            const menuSubtitulos = document.createElement('ul'); menuSubtitulos.className = 'subtopic-links';
            const indicadorAtivo = itemAtivo.querySelector('.topic-progress');
            let salvando = false, pendente = false;
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
                        dados.vistos.forEach(codigo => vistos.add(codigo));
                        if (indicadorAtivo)
                            indicadorAtivo.textContent = `${Math.round(vistos.size / subtitulos.length * 100)}%`;
                    }
                } catch (erro) { portal.avisar(erro.message + ' Recarregue a página para tentar novamente.'); }
                finally { salvando = false; }
            };
            subtitulos.forEach(({ codigo, elemento }) => {
                const item = document.createElement('li'); const link = document.createElement('a');
                link.href = `#${codigo}`; link.textContent = elemento.textContent;
                link.addEventListener('click', evento => {
                    evento.preventDefault(); elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', `#${codigo}`);
                });
                item.append(link); menuSubtitulos.append(item);
            });
            itemAtivo.append(menuSubtitulos);
            const porElemento = new Map(subtitulos.map(item => [item.elemento, item.codigo]));
            const observador = new IntersectionObserver(entradas => entradas.forEach(entrada => {
                const codigo = porElemento.get(entrada.target);
                if (entrada.isIntersecting && !vistos.has(codigo)) { vistos.add(codigo); atualizarProgresso(); }
            }), { threshold: 0.25 });
            subtitulos.forEach(item => observador.observe(item.elemento));
        }
        document.querySelector('.btn-exam').href = `exame.html?tema=${tema}`;
    } catch (erro) { portal.avisar(erro.message); }
});
