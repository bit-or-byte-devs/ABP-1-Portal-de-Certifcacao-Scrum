// Flashcards: seleção (modo e temas), sessão com repetição espaçada e resumo.
// Todo conteúdo vindo da API é inserido com textContent/createElement.
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const aviso = $('aviso-flashcards');
    const formulario = $('fc-selecao');
    const grade = $('fc-grid');
    const temasFieldset = $('fc-temas');
    const estados = { selecao: $('fc-estado-selecao'), sessao: $('fc-estado-sessao'), fim: $('fc-estado-fim') };
    const cartaoEl = $('fc-cartao');
    const faceFrente = $('fc-face-frente');
    const faceVerso = $('fc-face-verso');
    const botaoVirar = $('fc-virar');
    const respostas = $('fc-respostas');
    const botoesResposta = [$('fc-nao-sabia'), $('fc-sabia')];
    const NOMES_MODO = { tema: 'Por tema', revisao: 'Revisão dos que errei', aleatorio: 'Aleatório geral' };

    const CHAVE_SESSAO = 'borb:flashcards:sessao';
    const CODIGO = /^tema-\d{2}-fc\d{2}(?:-v\d+)?$/;
    const dialogoSaida = $('fc-dialogo-saida');
    const botaoTentar = $('fc-tentar-novamente');
    const feedback = $('fc-feedback');
    const anuncio = $('fc-anuncio');
    let temporizadorFeedback = 0;

    let dados = null;          // último GET /api/flashcards
    let sessao = null;         // { modo, temas, cartoes, indice, respondidos, pulados, virado, enviando, restaurada }
    let candidatoId;           // undefined: ainda não consultado; null: indisponível
    let primeiraCarga = true;  // a nova tentativa repete a carga inicial (inclui ?tema=N)
    let iniciando = false;

    // ---------- Sessão salva (sessionStorage) e histórico ----------
    // Guarda só o que a API já devolveu para a sessão em andamento. Qualquer falha de armazenamento é ignorada.
    const armazenamento = {
        ler() {
            try { const texto = window.sessionStorage.getItem(CHAVE_SESSAO); return texto ? JSON.parse(texto) : null; }
            catch { return null; }
        },
        gravar(valor) { try { window.sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(valor)); } catch { /* sem armazenamento */ } },
        limpar() { try { window.sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* sem armazenamento */ } },
    };

    function guardarHistorico(acao, estado) {
        try { history[acao]({ fc: estado }, ''); } catch { /* histórico indisponível */ }
    }

    function estadoDoHistorico() {
        return history.state && typeof history.state === 'object' ? history.state.fc : undefined;
    }

    async function identificarCandidato() {
        if (candidatoId !== undefined) return candidatoId;
        try { candidatoId = (await portal.pedir('/api/auth/usuario')).id ?? null; }
        catch (erro) { if (redirecionouParaLogin(erro)) throw erro; candidatoId = null; }
        return candidatoId;
    }

    function salvarSessao() {
        if (!sessao || candidatoId === undefined || candidatoId === null) return;
        const { modo, temas, cartoes, indice, respondidos, pulados } = sessao;
        armazenamento.gravar({ versao: 1, candidato: candidatoId, modo, temas, cartoes, indice, respondidos, pulados });
    }

    function sessaoSalvaValida(salvo) {
        return Boolean(salvo) && salvo.versao === 1 && ['tema', 'revisao', 'aleatorio'].includes(salvo.modo)
            && Array.isArray(salvo.temas) && salvo.temas.every(Number.isInteger)
            && Array.isArray(salvo.cartoes) && salvo.cartoes.length > 0
            && salvo.cartoes.every(c => c && CODIGO.test(c.codigo) && typeof c.frente === 'string' && typeof c.verso === 'string'
                && typeof c.explicacao === 'string' && typeof c.fonte === 'string' && c.tema && Number.isInteger(c.tema.ordem)
                && (c.caixa === null || [1, 2, 3].includes(c.caixa)))
            && Number.isInteger(salvo.indice) && salvo.indice >= 0 && salvo.indice < salvo.cartoes.length
            && Array.isArray(salvo.respondidos) && Number.isInteger(salvo.pulados) && salvo.pulados >= 0;
    }

    function avisar(mensagem, erro = false) {
        aviso.textContent = mensagem;
        aviso.classList.toggle('fc-aviso--erro', erro);
    }

    function mostrarEstado(nome) {
        Object.entries(estados).forEach(([chave, elemento]) => { elemento.hidden = chave !== nome; });
    }

    function mensagemErro(erro, padrao) {
        // Mensagens do servidor são genéricas; falhas de rede ganham um texto próprio.
        return erro && erro.status ? erro.message : padrao;
    }

    function redirecionouParaLogin(erro) {
        return erro && erro.status === undefined && /login/i.test(erro.message);
    }

    // ---------- Seleção ----------

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

    function criarTema(tema, marcado) {
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
        caixa.checked = disponivel && marcado;
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
            criarContador('Errados', tema.caixa1, 'fc-contador--erros'),
            criarContador('Em aprendizado', tema.caixa2, 'fc-contador--aprendendo'),
            criarContador('Dominados', tema.caixa3, 'fc-contador--dominados'),
        );
        cartao.append(barra, contadores);
        return cartao;
    }

    function temasMarcados() {
        return [...grade.querySelectorAll('input[name="tema"]:checked')].map(caixa => Number(caixa.value));
    }

    // Cartões errados (caixa 1) no escopo: temas informados ou, sem eles, o geral.
    function errosNoEscopo(temas) {
        if (!dados) return 0;
        if (!temas.length) return dados.geral.caixa1;
        return dados.temas.filter(tema => temas.includes(tema.ordem))
            .reduce((soma, tema) => soma + tema.caixa1, 0);
    }

    function atualizarSelecao() {
        const marcados = temasMarcados();
        const radioRevisao = formulario.querySelector('input[value="revisao"]');
        const motivo = $('fc-motivo-revisao');
        const semErros = errosNoEscopo(marcados) === 0;
        radioRevisao.disabled = semErros;
        motivo.hidden = !semErros;
        motivo.textContent = !semErros ? '' : marcados.length
            ? 'Revisar os que errei: nenhum cartão errado nos temas marcados (Errados = 0).'
            : 'Revisar os que errei: nenhum cartão errado ainda (Errados = 0 em todos os temas).';
        if (semErros && radioRevisao.checked) formulario.querySelector('input[value="tema"]').checked = true;

        const modo = formulario.elements.modo.value;
        // Um fieldset desabilitado tira os temas da navegação por teclado no modo aleatório.
        temasFieldset.disabled = modo === 'aleatorio';
        $('fc-dica-modo').textContent = {
            tema: 'Marque ao menos um tema. Os cartões que você erra aparecem primeiro.',
            revisao: 'Marcar temas é opcional: sem marcação, a revisão traz os cartões errados de todos os temas.',
            aleatorio: 'No modo aleatório geral, os cartões de todos os temas disponíveis entram na sessão.',
        }[modo];
        $('fc-selecionados').textContent = modo === 'aleatorio' ? ''
            : '(' + marcados.length + (marcados.length === 1 ? ' selecionado)' : ' selecionados)');

        let impedimento = '';
        if (modo === 'tema' && !marcados.length) impedimento = 'Marque ao menos um tema para começar.';
        if (modo === 'aleatorio' && !(dados && dados.geral.total)) impedimento = 'Nenhum flashcard disponível.';
        $('fc-comecar').disabled = Boolean(impedimento);
        $('fc-comecar-aviso').textContent = impedimento;
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

    async function carregarDominio() {
        dados = await portal.pedir('/api/flashcards');
        return dados;
    }

    // Monta (ou remonta) a seleção preservando os temas marcados.
    async function mostrarSelecao({ primeiraVez = false } = {}) {
        primeiraCarga = primeiraVez;
        const anteriores = new Set(primeiraVez ? [] : temasMarcados());
        // Enquanto o domínio carrega: esqueleto no lugar da lista e a região marcada como ocupada.
        if (!dados) $('fc-esqueleto').hidden = false;
        estados.selecao.setAttribute('aria-busy', 'true');
        // A seleção só aparece depois de remontada, para nunca exibir contadores antigos.
        try {
            const { temas, geral } = await carregarDominio();
            $('fc-resumo-texto').textContent = geral.total
                ? geral.caixa3 + ' de ' + geral.total + ' cartões dominados (' + geral.dominio + '%).'
                : 'Nenhum flashcard foi importado ainda.';
            preencherBarra($('fc-resumo-barra'), geral.dominio);
            $('fc-resumo-barra').hidden = geral.total === 0;
            grade.replaceChildren(...temas.map(tema => criarTema(tema, anteriores.has(tema.ordem))));
            formulario.hidden = false;
            botaoTentar.hidden = true;
            if (primeiraVez) marcarTemaDaUrl();
            atualizarSelecao();
            mostrarEstado('selecao');
            return true;
        } catch (erro) {
            if (redirecionouParaLogin(erro)) return false;
            mostrarEstado('selecao');
            $('fc-resumo-texto').textContent = 'Domínio indisponível no momento.';
            avisar(mensagemErro(erro, 'Não foi possível carregar os flashcards. Tente novamente.'), true);
            botaoTentar.hidden = false;
            return false;
        } finally {
            $('fc-esqueleto').hidden = true;
            estados.selecao.setAttribute('aria-busy', 'false');
        }
    }

    async function tentarNovamente() {
        botaoTentar.disabled = true;
        botaoTentar.setAttribute('aria-busy', 'true');
        avisar('Carregando seus flashcards…');
        const carregou = await mostrarSelecao({ primeiraVez: primeiraCarga });
        botaoTentar.disabled = false;
        botaoTentar.removeAttribute('aria-busy');
        if (carregou) { avisar(''); await concluirInicio(); }
        else botaoTentar.focus();
    }

    // ---------- Sessão ----------

    function descreverModo(modo, temas) {
        if (!temas.length || modo === 'aleatorio') return NOMES_MODO[modo] + (modo === 'revisao' ? ': todos os temas' : '');
        const nomes = temas.map(ordem => {
            const tema = dados && dados.temas.find(item => item.ordem === ordem);
            return tema ? ordem + '. ' + tema.nome : 'Tema ' + ordem;
        });
        return NOMES_MODO[modo] + ': ' + (nomes.length > 2 ? nomes.length + ' temas' : nomes.join(' e '));
    }

    // O botão que disparou mostra "Montando sessão…" enquanto a API responde.
    async function iniciarSessao(modo, temas, botao) {
        if (iniciando) return;
        iniciando = true;
        const rotulo = botao && botao.textContent;
        const estavaDesabilitado = botao && botao.disabled;
        if (botao) { botao.disabled = true; botao.setAttribute('aria-busy', 'true'); botao.textContent = 'Montando sessão…'; }
        try { await montarSessao(modo, temas); }
        finally {
            iniciando = false;
            if (botao) {
                botao.removeAttribute('aria-busy');
                botao.textContent = rotulo;
                botao.disabled = estavaDesabilitado;
                if (botao === $('fc-comecar')) atualizarSelecao();
            }
        }
    }

    async function montarSessao(modo, temas) {
        avisar('');
        const parametros = new URLSearchParams({ modo });
        if (temas.length && modo !== 'aleatorio') parametros.set('temas', temas.join(','));
        let resposta;
        try {
            resposta = await portal.pedir('/api/flashcards/sessao?' + parametros);
        } catch (erro) {
            if (redirecionouParaLogin(erro)) return;
            avisar(mensagemErro(erro, 'Não foi possível montar a sessão. Verifique a conexão e tente novamente.'), true);
            return;
        }
        if (!resposta.cartoes.length) {
            await mostrarSelecao();
            avisar(modo === 'revisao' ? 'Não há cartões errados para revisar agora.' : 'Nenhum cartão disponível para esta sessão.', true);
            return;
        }
        await identificarCandidato().catch(() => {});
        sessao = { modo, temas, cartoes: resposta.cartoes, indice: 0, respondidos: [], pulados: 0, virado: false, enviando: false, restaurada: false };
        // Do resumo ("Revisar agora") a sessão ocupa a mesma entrada do histórico; da seleção, uma nova.
        guardarHistorico(estadoDoHistorico() === 'fim' ? 'replaceState' : 'pushState', 'sessao');
        abrirSessao();
    }

    function limparFeedback() {
        window.clearTimeout(temporizadorFeedback);
        feedback.textContent = '';
        feedback.className = 'fc-feedback';
    }

    // Resultado da resposta recém-enviada: texto com ícone (nunca só cor), some sozinho em alguns segundos.
    function mostrarFeedback(sabia, caixa) {
        limparFeedback();
        feedback.className = 'fc-feedback ' + (sabia ? 'fc-feedback--sabia' : 'fc-feedback--nao');
        feedback.textContent = sabia ? 'Sabia · vai para a caixa ' + caixa : 'Não sabia · volta para a caixa ' + caixa;
        temporizadorFeedback = window.setTimeout(limparFeedback, 3500);
    }

    function abrirSessao() {
        limparFeedback();
        $('fc-sessao-modo').textContent = descreverModo(sessao.modo, sessao.temas);
        $('fc-sessao-barra').setAttribute('aria-valuemax', String(sessao.cartoes.length));
        mostrarEstado('sessao');
        mostrarCartao();
    }

    // Recarregar a página durante a sessão retoma do cartão atual.
    async function retomarSessao() {
        const salvo = armazenamento.ler();
        if (!sessaoSalvaValida(salvo)) { armazenamento.limpar(); return false; }
        let id = null;
        try { id = await identificarCandidato(); } catch { return false; }
        if (id === null || salvo.candidato !== id) { armazenamento.limpar(); return false; }
        sessao = { modo: salvo.modo, temas: salvo.temas, cartoes: salvo.cartoes, indice: salvo.indice, respondidos: salvo.respondidos,
            pulados: salvo.pulados, virado: false, enviando: false, restaurada: true };
        abrirSessao();
        return true;
    }

    function criarImagem(imagem) {
        const url = new URL(imagem.caminho, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        const figura = document.createElement('img');
        figura.src = url.href;
        figura.alt = imagem.alt;
        figura.loading = 'lazy';
        return figura;
    }

    function definirFace(virado) {
        cartaoEl.classList.toggle('is-virado', virado);
        // Só a face visível fica acessível a leitores de tela e ao teclado.
        faceFrente.inert = virado; faceFrente.setAttribute('aria-hidden', String(virado));
        faceVerso.inert = !virado; faceVerso.setAttribute('aria-hidden', String(!virado));
        cartaoEl.setAttribute('aria-labelledby', virado ? 'fc-verso-texto' : 'fc-frente-texto');
        botaoVirar.hidden = virado;
        respostas.hidden = !virado;
    }

    function atualizarProgressoSessao() {
        const total = sessao.cartoes.length;
        const feitos = sessao.indice;
        const barra = $('fc-sessao-barra');
        barra.setAttribute('aria-valuenow', String(feitos));
        barra.setAttribute('aria-valuetext', feitos + ' de ' + total + ' cartões concluídos');
        barra.querySelector('span').style.width = Math.round(feitos / total * 100) + '%';
    }

    function mostrarCartao() {
        const cartao = sessao.cartoes[sessao.indice];
        sessao.virado = false;
        // Volta para a frente sem animar a troca de cartão.
        cartaoEl.classList.add('sem-transicao');
        definirFace(false);
        void cartaoEl.offsetWidth;
        cartaoEl.classList.remove('sem-transicao');

        const tema = cartao.tema.ordem + '. ' + cartao.tema.nome;
        $('fc-frente-tema').textContent = tema;
        $('fc-verso-tema').textContent = tema;
        $('fc-frente-texto').textContent = cartao.frente;
        $('fc-verso-texto').textContent = cartao.verso;
        $('fc-verso-explicacao').textContent = cartao.explicacao;
        $('fc-verso-fonte').textContent = cartao.fonte;
        const imagem = cartao.imagem ? criarImagem(cartao.imagem) : null;
        $('fc-frente-imagem').replaceChildren(...(imagem ? [imagem] : []));

        anuncio.textContent = '';
        $('fc-sessao-contador').textContent = 'Cartão ' + (sessao.indice + 1) + ' de ' + sessao.cartoes.length;
        atualizarProgressoSessao();
        botoesResposta.forEach(botao => { botao.disabled = false; });
        salvarSessao();
        cartaoEl.focus();
    }

    function virar() {
        if (!sessao || sessao.virado || estados.sessao.hidden) return;
        sessao.virado = true;
        definirFace(true);
        // O foco fica no cartão; a região de status anuncia a resposta para leitores de tela.
        anuncio.textContent = 'Resposta: ' + sessao.cartoes[sessao.indice].verso;
        cartaoEl.focus();
    }

    async function responder(sabia) {
        if (!sessao || !sessao.virado || sessao.enviando) return;
        const cartao = sessao.cartoes[sessao.indice];
        sessao.enviando = true;
        botoesResposta.forEach(botao => { botao.disabled = true; });
        try {
            const resultado = await portal.pedir('/api/flashcards/' + encodeURIComponent(cartao.codigo) + '/resultado', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                // A caixa vista na tela permite ao servidor recusar respostas de uma sessão desatualizada (409).
                body: JSON.stringify({ sabia, caixaAnterior: cartao.caixa }),
            });
            sessao.respondidos.push({ codigo: cartao.codigo, sabia, caixaAnterior: cartao.caixa, caixa: resultado.caixa });
            avisar('');
            avancar();
            mostrarFeedback(sabia, resultado.caixa);
        } catch (erro) {
            if (redirecionouParaLogin(erro)) return;
            if (erro.status === 409) {
                // Outra aba já respondeu este cartão: não conta no resumo e segue para o próximo.
                sessao.pulados++;
                avancar();
                avisar('Este cartão já foi respondido em outra aba.', true);
                return;
            }
            if (erro.status === 404) {
                if (sessao.restaurada) {
                    // A API não reconhece um código da sessão salva: descarta a sessão inteira.
                    armazenamento.limpar();
                    sessao = null;
                    guardarHistorico('replaceState', 'selecao');
                    await mostrarSelecao();
                    avisar('A sessão salva não está mais disponível. Escolha os temas para começar de novo.', true);
                    return;
                }
                // O cartão saiu do catálogo durante a sessão: segue para o próximo.
                sessao.pulados++;
                avancar();
                avisar('Este cartão não está mais disponível e foi pulado.', true);
                return;
            }
            avisar(mensagemErro(erro, 'Sem conexão: sua resposta não foi registrada. Tente novamente.'), true);
            botoesResposta.forEach(botao => { botao.disabled = false; });
        } finally {
            if (sessao) sessao.enviando = false;
        }
    }

    function avancar() {
        sessao.indice++;
        if (sessao.indice >= sessao.cartoes.length) { encerrar(); return; }
        mostrarCartao();
    }

    // ---------- Resumo ----------

    async function encerrar() {
        const { respondidos, modo, temas, pulados } = sessao;
        const escopo = modo === 'aleatorio' ? [] : temas;
        sessao = null;
        armazenamento.limpar();
        guardarHistorico('replaceState', 'fim');
        const sabia = respondidos.filter(item => item.sabia).length;
        $('fc-fim-sabia').textContent = String(sabia);
        $('fc-fim-nao-sabia').textContent = String(respondidos.length - sabia);
        $('fc-fim-caixa3').textContent = String(respondidos.filter(item => item.caixa === 3 && item.caixaAnterior !== 3).length);
        $('fc-fim-texto').textContent = (respondidos.length
            ? 'Você respondeu ' + respondidos.length + (respondidos.length === 1 ? ' cartão.' : ' cartões.')
            : 'Nenhum cartão foi respondido nesta sessão.')
            + (pulados ? ' ' + pulados + (pulados === 1 ? ' cartão foi pulado' : ' cartões foram pulados') + ' e não entrou na contagem.' : '');

        const revisar = $('fc-revisar-agora');
        const motivo = $('fc-motivo-fim');
        revisar.disabled = true;
        revisar.dataset.temas = escopo.join(',');
        mostrarEstado('fim');
        $('fc-fim-titulo').focus();
        try {
            await carregarDominio();
            const semErros = errosNoEscopo(escopo) === 0;
            revisar.disabled = semErros;
            motivo.hidden = !semErros;
            motivo.textContent = !semErros ? '' : escopo.length
                ? 'Nenhum cartão errado nos temas desta sessão (Errados = 0).'
                : 'Nenhum cartão errado para revisar (Errados = 0 em todos os temas).';
        } catch (erro) {
            if (redirecionouParaLogin(erro)) return;
            motivo.hidden = false;
            motivo.textContent = 'Não foi possível conferir os cartões a revisar. Use Nova sessão para tentar de novo.';
        }
    }

    // ---------- Eventos ----------

    formulario.addEventListener('change', atualizarSelecao);
    formulario.addEventListener('submit', evento => {
        evento.preventDefault();
        if ($('fc-comecar').disabled) return;
        const modo = formulario.elements.modo.value;
        iniciarSessao(modo, modo === 'aleatorio' ? [] : temasMarcados(), $('fc-comecar'));
    });

    botaoVirar.addEventListener('click', virar);
    // Tocar na frente do cartão também vira (alvo grande para o toque).
    cartaoEl.addEventListener('click', () => virar());
    botoesResposta[0].addEventListener('click', () => responder(false));
    botoesResposta[1].addEventListener('click', () => responder(true));
    $('fc-encerrar').addEventListener('click', () => { if (sessao && !sessao.enviando) encerrar(); });
    $('fc-revisar-agora').addEventListener('click', event => {
        const temas = event.currentTarget.dataset.temas;
        iniciarSessao('revisao', temas ? temas.split(',').map(Number) : [], event.currentTarget);
    });
    $('fc-nova-sessao').addEventListener('click', async () => {
        avisar('');
        // A entrada "fim" do histórico volta a ser a seleção, para o Voltar não repetir o resumo.
        if (estadoDoHistorico() === 'fim') guardarHistorico('replaceState', 'selecao');
        await mostrarSelecao();
        $('fc-comecar').focus();
    });
    botaoTentar.addEventListener('click', tentarNovamente);

    // ---------- Voltar do navegador ----------

    function abrirConfirmacaoSaida() {
        const feitos = sessao.respondidos.length;
        $('fc-dialogo-texto').textContent = 'Você respondeu ' + feitos + ' de ' + sessao.cartoes.length
            + ' cartões. As respostas já dadas ficam salvas; os cartões restantes não serão contados.';
        if (typeof dialogoSaida.showModal === 'function') {
            if (!dialogoSaida.open) dialogoSaida.showModal();
            $('fc-continuar-sessao').focus();
        } else if (window.confirm('Sair da sessão? Você respondeu ' + feitos + ' de ' + sessao.cartoes.length + ' cartões.')) sairDaSessao();
        else continuarSessao();
    }

    function continuarSessao() {
        if (dialogoSaida.open) dialogoSaida.close();
        // O Voltar já recuou no histórico: a entrada da sessão é recolocada.
        guardarHistorico('pushState', 'sessao');
        if (sessao) cartaoEl.focus();
    }

    async function sairDaSessao() {
        if (dialogoSaida.open) dialogoSaida.close();
        armazenamento.limpar();
        sessao = null;
        avisar('');
        await mostrarSelecao();
        $('fc-comecar').focus();
    }

    window.addEventListener('popstate', async evento => {
        const alvo = evento.state && evento.state.fc;
        if (sessao) {
            if (alvo !== 'sessao') abrirConfirmacaoSaida();
            return;
        }
        // Sem sessão em memória, "sessão" e "fim" do histórico não têm o que mostrar: vale a seleção.
        if (alvo !== 'selecao') guardarHistorico('replaceState', 'selecao');
        avisar('');
        await mostrarSelecao();
    });
    $('fc-continuar-sessao').addEventListener('click', continuarSessao);
    $('fc-sair-sessao').addEventListener('click', sairDaSessao);
    // Esc fecha o diálogo: equivale a continuar estudando.
    dialogoSaida.addEventListener('cancel', evento => { evento.preventDefault(); continuarSessao(); });

    // Atalhos da sessão: Enter/Espaço viram; 1 e 2 respondem só depois de virar.
    document.addEventListener('keydown', evento => {
        if (!sessao || estados.sessao.hidden || dialogoSaida.open || evento.altKey || evento.ctrlKey || evento.metaKey) return;
        const alvo = evento.target;
        const emControle = alvo.closest && alvo.closest('button, a, input, select, textarea');
        if ((evento.key === 'Enter' || evento.key === ' ') && !sessao.virado && !emControle) {
            evento.preventDefault();
            virar();
        } else if ((evento.key === '1' || evento.key === '2') && sessao.virado) {
            evento.preventDefault();
            responder(evento.key === '2');
        }
    });

    // Só depois da primeira carga bem-sucedida: retoma a sessão salva ou fixa a seleção no histórico.
    let estadoInicial = estadoDoHistorico();
    let inicioConcluido = false;
    async function concluirInicio() {
        if (inicioConcluido) return;
        inicioConcluido = true;
        if (estadoInicial === 'sessao' && await retomarSessao()) return;
        armazenamento.limpar();
        guardarHistorico('replaceState', 'selecao');
    }

    mostrarSelecao({ primeiraVez: true }).then(carregou => { if (carregou) return concluirInicio(); });
})();
