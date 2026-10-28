document.addEventListener('DOMContentLoaded', async () => {
    const cards = document.querySelectorAll('.theme-card');
    const botaoContinuar = document.getElementById('btn-continuar-certificacao');
    const mensagem = document.getElementById('mensagem-certificacao');
    const rotulos = { pendente: 'Iniciar exame', em_andamento: 'Em andamento', concluido: 'Concluído' };

    function abrirTema(ordem, estado) {
        if (estado === 'em_andamento' && !confirm('Reabrir esta questão vai encerrá-la como interrompida e contar como incorreta. Deseja continuar?')) return;
        location.href = `exame.html?tema=${ordem}`;
    }

    try {
        const progresso = await portal.pedir('/api/exames/progresso');
        cards.forEach(card => {
            const tema = progresso.temas.find(tema => tema.ordem === Number(card.dataset.id));
            const botao = card.querySelector('.btn-iniciar');
            botao.disabled = !tema || tema.estado === 'concluido';
            if (!tema) return;
            botao.textContent = rotulos[tema.estado];
            botao.addEventListener('click', evento => {
                evento.stopPropagation();
                if (!botao.disabled) abrirTema(tema.ordem, tema.estado);
            });
        });
        mensagem.textContent = progresso.certificacao_concluida ? 'Certificação concluída.' : '';
        botaoContinuar.hidden = progresso.certificacao_concluida || progresso.proximo_tema === null;
        botaoContinuar.disabled = botaoContinuar.hidden;
        botaoContinuar.addEventListener('click', () => abrirTema(progresso.proximo_tema, 'pendente'));
    } catch (erro) {
        portal.avisar(erro.message);
        mensagem.textContent = '';
        cards.forEach(card => { card.querySelector('.btn-iniciar').disabled = true; });
        botaoContinuar.disabled = true;
        botaoContinuar.hidden = true;
    }
});
