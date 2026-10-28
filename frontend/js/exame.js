(async () => {
    const tema = new URLSearchParams(location.search).get('tema') || '1';
    const secaoQuestao = document.getElementById('questao');
    const form = document.getElementById('form-questao');
    const alternativas = document.getElementById('alternativas');
    const botaoConfirmar = document.getElementById('btn-confirmar');
    const feedback = document.getElementById('feedback');
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
        feedback.classList.remove('feedback--sucesso', 'feedback--erro');
        feedback.classList.add(dados.acertou ? 'feedback--sucesso' : 'feedback--erro');
        feedback.textContent = `${dados.acertou ? 'Resposta correta.' : 'Resposta incorreta.'} ${dados.justificativa || ''}`;
        botaoConfirmar.disabled = true;
        alternativas.disabled = true;
    }

    try {
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

        if (questao.situacao !== 'em_andamento') mostrarResultado(questao);
        secaoQuestao.hidden = false;

        form.addEventListener('submit', async evento => {
            evento.preventDefault();
            botaoConfirmar.disabled = true;
            try {
                const idAlternativa = Number(new FormData(form).get('alternativa'));
                mostrarResultado(await portal.pedir(`/api/exames/respostas/${questao.id}`, json({ alternativa: idAlternativa })));
            } catch (erro) { portal.avisar(erro.message); botaoConfirmar.disabled = false; }
        });
    } catch (erro) { portal.avisar(erro.message); }
})();
