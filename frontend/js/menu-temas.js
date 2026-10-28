document.addEventListener('DOMContentLoaded', async () => {
    const cards = document.querySelectorAll('.theme-card');
    cards.forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('.btn-iniciar')) return;
            cards.forEach(outro => { if (outro !== card) outro.classList.remove('active'); });
            card.classList.toggle('active');
        });
        card.querySelector('.btn-iniciar')?.addEventListener('click', e => {
            e.stopPropagation();
            if (e.currentTarget.dataset.label === 'Iniciar exame') return;
            location.href = `estudos.html?tema=${card.dataset.id}`;
        });
    });
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
