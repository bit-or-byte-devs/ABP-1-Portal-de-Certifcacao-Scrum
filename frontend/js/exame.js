(async () => {
    const tema = new URLSearchParams(location.search).get('tema') || '1';
    const secaoQuestao = document.getElementById('questao');
    const form = document.getElementById('form-questao');
    const alternativas = document.getElementById('alternativas');
    const botaoConfirmar = document.getElementById('btn-confirmar');
    const feedback = document.getElementById('feedback');
    const linkContinuar = document.getElementById('link-continuar');
    let encerrada = false;
    let tempoEsgotado = false;
    let semConexao = false;
    let reconciliando = false;
    let consultaAgendada;
    let sinalAgendado;
    let reconciliacaoAgendada;
    const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    // Só falha de rede de verdade conta como perda de conexão; respostas HTTP (503 inclusive) não.
    const ehFalhaDeRede = erro => erro instanceof TypeError || erro?.name === 'TimeoutError' || erro?.name === 'AbortError';
    const MENSAGEM_SEM_CONEXAO = 'Sem conexão. Ao reconectar, esta questão será encerrada como interrompida e contará como incorreta.';

    function montarAlternativa(alternativa, marcada) {
        const label = document.createElement('label');
        label.className = 'alternativa';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'alternativa'; radio.value = alternativa.id; radio.required = true;
        radio.checked = marcada;
        const letra = document.createElement('span');
        letra.className = 'alternativa__letra'; letra.textContent = `${alternativa.letra}.`;
        const texto = document.createElement('span');
        texto.className = 'alternativa__texto'; texto.textContent = alternativa.texto;
        label.append(radio, letra, texto);
        return label;
    }

    function mostrarResultado(dados) {
        encerrada = true;
        semConexao = false;
        clearTimeout(consultaAgendada);
        clearTimeout(sinalAgendado);
        clearTimeout(reconciliacaoAgendada);
        cronometro.parar();
        feedback.classList.remove('feedback--sucesso', 'feedback--erro');
        feedback.classList.add(dados.acertou ? 'feedback--sucesso' : 'feedback--erro');
        const resultado = dados.situacao === 'tempo_esgotado'
            ? 'O tempo acabou. A questão conta como incorreta.'
            : dados.situacao === 'interrompida'
                ? 'A questão foi encerrada por interrupção e conta como incorreta.'
            : dados.acertou ? 'Resposta correta.' : 'Resposta incorreta.';
        const correta = dados.alternativa_correta;
        alternativas.querySelectorAll('.alternativa').forEach(label => {
            const radio = label.querySelector('input');
            const id = Number(radio.value);
            const ehCorreta = id === correta.id;
            const ehEscolhida = id === dados.idalternativa;
            radio.checked = ehEscolhida;
            label.classList.toggle('alternativa--correta', ehCorreta);
            label.classList.toggle('alternativa--incorreta', ehEscolhida && !ehCorreta);
            label.querySelector('.alternativa__resultado')?.remove();
            if (ehCorreta || ehEscolhida) {
                const indicacao = document.createElement('span');
                indicacao.className = 'alternativa__resultado';
                indicacao.textContent = ehCorreta ? 'Correta' : 'Sua resposta: incorreta';
                label.append(indicacao);
            }
        });
        feedback.textContent = `${resultado} Alternativa correta: ${correta.letra}. ${correta.texto}. ${dados.justificativa || ''}`;
        botaoConfirmar.hidden = true;
        linkContinuar.textContent = dados.proximo_tema === null ? 'Voltar à lista' : 'Próximo tema';
        linkContinuar.href = dados.proximo_tema === null ? 'exames.html' : `exame.html?tema=${dados.proximo_tema}`;
        linkContinuar.hidden = Number(tema) === 12;
        botaoConfirmar.disabled = true;
        alternativas.disabled = true;
    }

    try {
        // Uma única chamada por carregamento: repetir iniciar interromperia a própria questão.
        const questao = await portal.pedir(`/api/exames/${encodeURIComponent(tema)}/iniciar`, json({}));
        document.getElementById('exame-titulo').textContent = `Exame: ${questao.nome}`;
        document.getElementById('questao-titulo').textContent = questao.enunciado;

        const imagem = document.getElementById('questao-imagem');
        // URLs de imagens cadastradas devem ser caminhos locais ou HTTPS.
        if (questao.imagem) {
        const url = new URL(questao.imagem, location.origin);
        if (url.origin === location.origin || url.protocol === 'https:') { imagem.src = url.href; imagem.alt = questao.imagem_alt; }
        else imagem.remove();
        } else imagem.remove();

        questao.alternativas.forEach(alternativa => {
            alternativas.append(montarAlternativa(alternativa, questao.idalternativa === alternativa.id));
        });

        secaoQuestao.hidden = false;
        const rotaResposta = `/api/exames/respostas/${questao.id}`;

        function travarQuestao() {
            alternativas.disabled = true;
            botaoConfirmar.disabled = true;
        }

        // Ao voltar (conexão, histórico), a tentativa anterior nunca é retomada:
        // se o servidor ainda a tem aberta, a página pede o encerramento antes de mostrar qualquer coisa.
        async function reconciliarInterrupcao() {
            if (encerrada || reconciliando) return;
            reconciliando = true;
            clearTimeout(reconciliacaoAgendada);
            try {
                let estado = await portal.pedir(rotaResposta, { signal: AbortSignal.timeout(10000) });
                if (estado.situacao === 'em_andamento') {
                    estado = await portal.pedir(`${rotaResposta}/interromper`, { ...json({}), signal: AbortSignal.timeout(10000) });
                }
                if (!encerrada) mostrarResultado(estado);
            } catch {
                // Sem confirmação do servidor a questão continua travada; tenta de novo.
                if (!encerrada) reconciliacaoAgendada = setTimeout(reconciliarInterrupcao, 3000);
            } finally { reconciliando = false; }
        }

        // A interface não promete avisar o servidor offline: trava e reconcilia ao voltar.
        function perderConexao() {
            if (encerrada || semConexao) return;
            semConexao = true;
            clearTimeout(sinalAgendado);
            clearTimeout(consultaAgendada);
            cronometro.parar();
            travarQuestao();
            feedback.classList.remove('feedback--sucesso');
            feedback.classList.add('feedback--erro');
            feedback.textContent = MENSAGEM_SEM_CONEXAO;
            // Também tenta periodicamente: a primeira requisição que funcionar encerra a questão.
            reconciliacaoAgendada = setTimeout(reconciliarInterrupcao, 3000);
        }

        // Sinal periódico: o intervalo vem do servidor, que interrompe a questão sem sinal.
        function agendarSinal(segundos) {
            clearTimeout(sinalAgendado);
            sinalAgendado = setTimeout(enviarSinal, segundos * 1000);
        }

        async function enviarSinal() {
            if (encerrada || semConexao) return;
            try {
                const sinal = await portal.pedir(`${rotaResposta}/sinal`, { ...json({}), signal: AbortSignal.timeout(10000) });
                if (encerrada || semConexao) return;
                agendarSinal(sinal.intervalo_sinal_segundos);
            } catch (erro) {
                if (encerrada || semConexao) return;
                if (erro.status === 409 && erro.resposta?.alternativa_correta) {
                    mostrarResultado(erro.resposta);
                    portal.avisar(erro.message);
                } else if (ehFalhaDeRede(erro)) perderConexao();
                else agendarSinal(questao.intervalo_sinal_segundos);
            }
        }

        window.addEventListener('offline', perderConexao);
        window.addEventListener('online', () => { if (semConexao) reconciliarInterrupcao(); });
        // Saída da página: aviso sem garantia de entrega; o limite sem sinal no servidor cobre a falta dele.
        window.addEventListener('pagehide', () => {
            if (!encerrada) navigator.sendBeacon(`${rotaResposta}/interromper`, new Blob(['{}'], { type: 'application/json' }));
        });
        // Voltar pelo histórico (página restaurada do cache): nada fica clicável antes de reconciliar.
        window.addEventListener('pageshow', evento => {
            if (!evento.persisted || encerrada) return;
            clearTimeout(sinalAgendado);
            clearTimeout(consultaAgendada);
            cronometro.parar();
            travarQuestao();
            reconciliarInterrupcao();
        });

        async function confirmarEncerramento(tentativa = 0) {
            if (encerrada) return;
            try {
                const estado = await portal.pedir(`/api/exames/respostas/${questao.id}`, { signal: AbortSignal.timeout(10000) });
                if (encerrada) return;
                if (estado.situacao !== 'em_andamento') { mostrarResultado(estado); return; }
            } catch (erro) {
                if (encerrada) return;
                if (ehFalhaDeRede(erro)) { perderConexao(); return; }
            }
            if (tentativa < 3) {
                consultaAgendada = setTimeout(() => confirmarEncerramento(tentativa + 1), 2000);
            } else {
                feedback.textContent = 'Erro de conexão: não foi possível confirmar o encerramento. Recarregue a página para consultar o resultado.';
            }
        }

        if (questao.situacao !== 'em_andamento') mostrarResultado(questao);
        else {
            cronometro.iniciar(questao.segundos_restantes, () => {
                tempoEsgotado = true;
                if (!semConexao) consultaAgendada = setTimeout(() => confirmarEncerramento(), 3000);
            });
            agendarSinal(questao.intervalo_sinal_segundos);
            if (!navigator.onLine) perderConexao();
        }

        form.addEventListener('submit', async evento => {
            evento.preventDefault();
            if (encerrada || tempoEsgotado || semConexao || botaoConfirmar.disabled) return;
            botaoConfirmar.disabled = true;
            try {
                const idAlternativa = Number(new FormData(form).get('alternativa'));
                const resultado = await portal.pedir(rotaResposta, { ...json({ alternativa: idAlternativa }), signal: AbortSignal.timeout(10000) });
                if (!encerrada) mostrarResultado(resultado);
            } catch (erro) {
                if (encerrada) return;
                if (erro.status === 409 && erro.resposta?.situacao !== 'em_andamento' && erro.resposta?.alternativa_correta) {
                    mostrarResultado(erro.resposta);
                    portal.avisar(erro.message);
                } else if (ehFalhaDeRede(erro)) {
                    // A resposta pode ter chegado antes da queda; a reconciliação mostra o que o servidor gravou.
                    perderConexao();
                } else {
                    portal.avisar(erro.message);
                    if (!tempoEsgotado && !semConexao) botaoConfirmar.disabled = false;
                }
            }
        });
    } catch (erro) { portal.avisar(erro.message); }
})();
