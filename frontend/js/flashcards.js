// Seleção de temas dos flashcards (F1). A sessão de estudo chega na F2.
// Todo conteúdo vindo da API é inserido com textContent/createElement.
(function () {
    'use strict';
    const aviso = document.getElementById('aviso-flashcards');
    const formulario = document.getElementById('fc-selecao');
    const grade = document.getElementById('fc-grid');
    const temasFieldset = document.getElementById('fc-temas');
    const dicaAleatorio = document.getElementById('fc-dica-aleatorio');
    const selecionados = document.getElementById('fc-selecionados');

    function avisar(mensagem, erro = false) {
        aviso.textContent = mensagem;
        aviso.classList.toggle('fc-aviso--erro', erro);
    }

    function preencherBarra(barra, dominio) {
        barra.setAttribute('aria-valuenow', String(dominio));
        barra.querySelector('span').style.width = dominio + '%';
    }

    function criarBarra(rotulo) {
        const barra = document.createElement('div');
        barra.className = 'fc-barra';
        barra.setAttribute('role', 'progressbar');
        barra.setAttribute('aria-valuemin', '0');
        barra.setAttribute('aria-valuemax', '100');
        barra.setAttribute('aria-label', rotulo);
        barra.append(document.createElement('span'));
        return barra;
    }

    function criarContador(rotulo, valor, classe) {
        const item = document.createElement('div');
        item.className = 'fc-contador ' + classe;
        const termo = document.createElement('dt');
        termo.textContent = rotulo;
        const numero = document.createElement('dd');
        numero.textContent = String(valor);
        item.append(termo, numero);
        return item;
    }

    function criarTema(tema) {
        const disponivel = tema.total > 0;
        const cartao = document.createElement('label');
        cartao.className = 'fc-tema' + (disponivel ? '' : ' fc-tema--indisponivel');

        const cabecalho = document.createElement('span');
        cabecalho.className = 'fc-tema-cabecalho';
        const caixa = document.createElement('input');
        caixa.type = 'checkbox';
        caixa.name = 'tema';
        caixa.value = String(tema.ordem);
        caixa.disabled = !disponivel;
        const titulo = document.createElement('span');
        titulo.className = 'fc-tema-titulo';
        titulo.textContent = tema.ordem + '. ' + tema.nome;
        const percentual = document.createElement('span');
        percentual.className = 'fc-tema-percentual';
        percentual.textContent = disponivel ? tema.dominio + '%' : '';
        cabecalho.append(caixa, titulo, percentual);
        cartao.append(cabecalho);

        if (!disponivel) {
            const indisponivel = document.createElement('span');
            indisponivel.className = 'fc-tema-aviso';
            indisponivel.textContent = 'Cartões ainda não importados para este tema.';
            cartao.append(indisponivel);
            return cartao;
        }

        const barra = criarBarra('Domínio do tema ' + tema.ordem);
        preencherBarra(barra, tema.dominio);
        const contadores = document.createElement('dl');
        contadores.className = 'fc-contadores';
        contadores.append(
            criarContador('Novos', tema.novos, 'fc-contador--novos'),
            criarContador('A revisar', tema.caixa1 + tema.caixa2, 'fc-contador--revisar'),
            criarContador('Dominados', tema.caixa3, 'fc-contador--dominados'),
        );
        cartao.append(barra, contadores);
        return cartao;
    }

    function atualizarSelecao() {
        const aleatorio = formulario.elements.modo.value === 'aleatorio';
        // Um fieldset desabilitado tira os temas da navegação por teclado no modo aleatório.
        temasFieldset.disabled = aleatorio;
        dicaAleatorio.hidden = !aleatorio;
        const marcados = grade.querySelectorAll('input[name="tema"]:checked').length;
        selecionados.textContent = aleatorio ? '' : '(' + marcados + (marcados === 1 ? ' selecionado)' : ' selecionados)');
    }

    function marcarTemaDaUrl() {
        const parametro = new URLSearchParams(window.location.search).get('tema');
        if (parametro === null) return;
        const caixa = /^(?:[1-9]|1[0-2])$/.test(parametro)
            ? grade.querySelector('input[name="tema"][value="' + parametro + '"]') : null;
        if (!caixa) { avisar('Tema inválido no endereço.', true); return; }
        if (caixa.disabled) { avisar('O tema ' + parametro + ' ainda não tem flashcards disponíveis.', true); return; }
        caixa.checked = true;
        caixa.closest('.fc-tema').scrollIntoView({ block: 'nearest' });
    }

    async function carregar() {
        try {
            const { temas, geral } = await portal.pedir('/api/flashcards');
            const resumoTexto = document.getElementById('fc-resumo-texto');
            const resumoBarra = document.getElementById('fc-resumo-barra');
            resumoTexto.textContent = geral.total
                ? geral.caixa3 + ' de ' + geral.total + ' cartões dominados (' + geral.dominio + '%).'
                : 'Nenhum flashcard foi importado ainda.';
            preencherBarra(resumoBarra, geral.dominio);
            resumoBarra.hidden = geral.total === 0;

            grade.replaceChildren(...temas.map(criarTema));
            formulario.hidden = false;
            avisar('');
            marcarTemaDaUrl();
            atualizarSelecao();
        } catch (erro) {
            if (erro.status === undefined && /login/i.test(erro.message)) return;
            document.getElementById('fc-resumo-texto').textContent = 'Domínio indisponível no momento.';
            // Mensagens do servidor são genéricas; falhas de rede ganham um texto próprio.
            avisar(erro.status ? erro.message : 'Não foi possível carregar os flashcards. Tente novamente.', true);
        }
    }

    formulario.addEventListener('change', atualizarSelecao);
    // A sessão de estudo ainda não existe; impede envio por Enter.
    formulario.addEventListener('submit', evento => evento.preventDefault());
    carregar();
})();
