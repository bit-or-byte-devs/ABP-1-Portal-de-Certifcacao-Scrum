(async () => {
    const tema = new URLSearchParams(location.search).get('tema') || '1';
    const form = document.getElementById('responder');
    const botao = document.getElementById('confirmar');
    const resultado = document.getElementById('resultado');
    const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    try {
        const questao = await portal.pedir(`/api/exames/${encodeURIComponent(tema)}/iniciar`, json({}));
        document.querySelector('h1').textContent = `Exame: ${questao.nome}`;
        document.getElementById('enunciado').textContent = questao.enunciado;
        const imagem = document.getElementById('imagem-questao');
        // URLs de imagens cadastradas devem ser caminhos locais ou HTTPS.
        const url = new URL(questao.imagem, location.origin);
        if (url.origin === location.origin || url.protocol === 'https:') { imagem.src = url.href; imagem.alt = questao.imagem_alt; }
        else imagem.hidden = true;
        questao.alternativas.forEach(a => {
            const label = document.createElement('label'); label.style.display = 'block';
            const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'alternativa'; radio.value = a.id; radio.required = true;
            radio.checked = questao.idalternativa === a.id;
            label.append(radio, document.createTextNode(` ${a.letra}. ${a.texto}`));
            document.getElementById('alternativas').append(label);
        });
        function mostrar(dados) {
            resultado.textContent = `${dados.acertou ? 'Resposta correta.' : 'Resposta incorreta.'} ${dados.justificativa || ''}`;
            botao.disabled = true; document.getElementById('alternativas').disabled = true;
        }
        if (questao.situacao !== 'em_andamento') mostrar(questao);
        document.getElementById('questao').hidden = false;
        form.addEventListener('submit', async e => {
            e.preventDefault(); botao.disabled = true;
            try { mostrar(await portal.pedir(`/api/exames/respostas/${questao.id}`, json({ alternativa: Number(new FormData(form).get('alternativa')) }))); }
            catch (erro) { portal.avisar(erro.message); botao.disabled = false; }
        });
    } catch (erro) { portal.avisar(erro.message); }
})();
