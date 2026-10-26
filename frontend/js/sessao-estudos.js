window.portal = {
    async pedir(url, opcoes = {}) {
        const resposta = await fetch(url, { cache: 'no-store', ...opcoes });
        if (resposta.status === 401) { location.replace('/pages/login.html'); throw new Error('Faça login para continuar.'); }
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível concluir a solicitação.');
        return dados;
    },
    avisar(mensagem) {
        let aviso = document.getElementById('aviso-estudos');
        if (!aviso) { aviso = document.createElement('p'); aviso.id = 'aviso-estudos'; aviso.setAttribute('role', 'status'); document.querySelector('main').prepend(aviso); }
        aviso.textContent = mensagem;
    }
};
window.addEventListener('pageshow', () => portal.pedir('/api/auth/usuario').catch(erro => portal.avisar(erro.message)));
