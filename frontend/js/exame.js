(async () => {
    const tema = new URLSearchParams(location.search).get('tema') || '1';
    const secaoQuestao = document.getElementById('questao');
    const form = document.getElementById('form-questao');
    const alternativas = document.getElementById('alternativas');
    const botaoConfirmar = document.getElementById('btn-confirmar');
    const feedback = document.getElementById('feedback');
    const linkContinuar = document.getElementById('link-continuar');
    const botaoInterromper = document.getElementById('btn-interromper');
    let encerrada = false;
    let tempoEsgotado = false;
    let consultaAgendada;
    const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

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
        clearTimeout(consultaAgendada);
        cronometro.parar();
        feedback.classList.remove('feedback--sucesso', 'feedback--erro');
        feedback.classList.add(dados.acertou ? 'feedback--sucesso' : 'feedback--erro');
        const resultado = dados.situacao === 'tempo_esgotado'
            ? 'O tempo acabou. A questão conta como incorreta.'
            : dados.situacao === 'interrompida'
                ? 'A questão foi encerrada por interrupção e conta como incorreta.'
            : dados.acertou ? 'Resposta correta.' : 'Resposta incorreta.';
        const correta = dados.alternativa_correta;
        feedback.textContent = `${resultado} Alternativa correta: ${correta.letra}. ${correta.texto}. ${dados.justificativa || ''}`;
        botaoConfirmar.hidden = true;
        linkContinuar.textContent = 'Próximo tema';
        linkContinuar.href = dados.proximo_tema === null ? 'exames.html' : `exame.html?tema=${dados.proximo_tema}`;
        linkContinuar.hidden = false;
        botaoInterromper.textContent = 'Encerrar sessão';
        botaoInterromper.hidden = false;
        botaoInterromper.onclick = () => { location.href = 'menu.html'; };
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
        const url = new URL(questao.imagem, location.origin);
        if (url.origin === location.origin || url.protocol === 'https:') { imagem.src = url.href; imagem.alt = questao.imagem_alt; }
        else imagem.remove();

        questao.alternativas.forEach(alternativa => {
            alternativas.append(montarAlternativa(alternativa, questao.idalternativa === alternativa.id));
        });

        secaoQuestao.hidden = false;

        async function confirmarEncerramento(tentativa = 0) {
            if (encerrada) return;
            try {
                const estado = await portal.pedir(`/api/exames/respostas/${questao.id}`, { signal: AbortSignal.timeout(10000) });
                if (encerrada) return;
                if (estado.situacao !== 'em_andamento') { mostrarResultado(estado); return; }
            } catch (erro) {
                if (encerrada) return;
            }
            if (tentativa < 3) {
                consultaAgendada = setTimeout(() => confirmarEncerramento(tentativa + 1), 2000);
            } else {
                feedback.textContent = 'Erro de conexão: não foi possível confirmar o encerramento. Recarregue a página para consultar o resultado.';
            }
        }

        if (questao.situacao !== 'em_andamento') mostrarResultado(questao);
        else cronometro.iniciar(questao.segundos_restantes, () => {
            tempoEsgotado = true;
            consultaAgendada = setTimeout(() => confirmarEncerramento(), 3000);
        });

        form.addEventListener('submit', async evento => {
            evento.preventDefault();
            if (encerrada || tempoEsgotado || botaoConfirmar.disabled) return;
            botaoConfirmar.disabled = true;
            try {
                const idAlternativa = Number(new FormData(form).get('alternativa'));
                mostrarResultado(await portal.pedir(`/api/exames/respostas/${questao.id}`, json({ alternativa: idAlternativa })));
            } catch (erro) {
                if (erro.status === 409 && erro.resposta?.situacao !== 'em_andamento' && erro.resposta?.alternativa_correta) {
                    mostrarResultado(erro.resposta);
                } else {
                    portal.avisar(erro.message);
                    if (!encerrada && !tempoEsgotado) botaoConfirmar.disabled = false;
                }
            }
        });
    } catch (erro) { portal.avisar(erro.message); }
})();
