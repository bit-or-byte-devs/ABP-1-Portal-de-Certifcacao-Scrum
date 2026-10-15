document.addEventListener('DOMContentLoaded', () => {
    const themeCards = document.querySelectorAll('.theme-card');

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
            const tituloTema = e.target.closest('.theme-card').querySelector('h3').innerText;
            const label = btn.dataset.label || 'A iniciar';
            alert(`${label}: ${tituloTema}`);
        });
    });
});