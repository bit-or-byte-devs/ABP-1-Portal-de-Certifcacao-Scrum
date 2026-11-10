document.addEventListener('DOMContentLoaded', async () => {
    const cards = document.querySelectorAll('.theme-card');
    cards.forEach(card => {
        const row = card.querySelector('.theme-main-row');
        row?.addEventListener('click', () => {
            cards.forEach(outro => { if (outro !== card) outro.classList.remove('active'); });
            card.classList.toggle('active');
            row.classList.remove('theme-main-row--animating');
            void row.offsetWidth;
            row.classList.add('theme-main-row--animating');
            row.addEventListener('animationend', () => {
                row.classList.remove('theme-main-row--animating');
            }, { once: true });
        });
        card.querySelector('.btn-iniciar')?.addEventListener('click', e => {
            e.stopPropagation();
            if (e.currentTarget.dataset.label === 'Iniciar exame') return;
            cards.forEach(outro => { if (outro !== card) outro.classList.remove('active'); });
            card.classList.add('active', 'theme-card--launching');
            e.currentTarget.disabled = true;
            window.setTimeout(() => {
                location.href = `estudos.html?tema=${card.dataset.id}`;
            }, 360);
        });
    });
    // Na tela de exames, os dados são carregados por exames.js.
    if (document.getElementById('btn-continuar-certificacao')) return;

    try {
        const temas = await portal.pedir('/api/estudos');
        cards.forEach(card => {
            const tema = temas.find(t => t.ordem === Number(card.dataset.id));
            if (!tema) { card.querySelector('.btn-iniciar').disabled = true; return; }
            card.querySelector('h3').textContent = `${tema.ordem}. ${tema.nome}`;
            card.querySelector('.green-text').textContent = `${tema.percentual}%`;
        });
    } catch (erro) { portal.avisar(erro.message); cards.forEach(c => c.querySelector('.btn-iniciar').disabled = true); }
});
