document.addEventListener('DOMContentLoaded', () => {
    const themeCards = document.querySelectorAll('.theme-card');

    themeCards.forEach(card => {
        const numeroTema = card.dataset.id;
        const conteudo = window.conteudoTemas?.[numeroTema];
        const indicador = card.querySelector('.progress-badge .green-text');
        if (!conteudo || !indicador) return;

        const temporario = document.createElement('div');
        temporario.innerHTML = conteudo;
        const totalSubtitulos = temporario.querySelectorAll('h3, h4').length;
        let vistos = [];
        try {
            vistos = JSON.parse(localStorage.getItem(`borb-progresso-tema-${numeroTema}`) || '[]');
        } catch {
            vistos = [];
        }
        const percentual = totalSubtitulos
            ? Math.round((new Set(vistos).size / totalSubtitulos) * 100)
            : 0;
        indicador.textContent = `${percentual}%`;
    });

    // Comportamento de Acordeão ao clicar nos temas
    themeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Se clicar no botão de iniciar, não fecha nem abre o acordeão diretamente por ele
            if (e.target.classList.contains('btn-iniciar')) return;

            // Fecha os outros e alterna o estado do card clicado
            themeCards.forEach(c => {
                if (c !== card) c.classList.remove('active');
            });
            card.classList.toggle('active');
        });
    });

    // Ação do botão de abertura do tema/certificado
    const btnIniciars = document.querySelectorAll('.btn-iniciar');
    btnIniciars.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = e.target.closest('.theme-card');
            const tituloTema = card.querySelector('h3').innerText;
            const label = btn.dataset.label || 'A iniciar';

            if (label !== 'Iniciar exame') {
                window.location.href = `estudos.html?tema=${card.dataset.id}`;
                return;
            }

            alert(`${label}: ${tituloTema}`);
        });
    });
});
