document.addEventListener('DOMContentLoaded', async () => {
    const cards = document.querySelectorAll('.theme-card');
    const botaoContinuar = document.getElementById('btn-continuar-certificacao');
    const mensagem = document.getElementById('mensagem-certificacao');
    const rotulos = { pendente: 'Iniciar exame', em_andamento: 'Em andamento', concluido: 'Concluído' };

    let temaEmAndamento;

    function abrirTema(ordem) {
        if (temaEmAndamento && !confirm(`A questão do tema ${temaEmAndamento.ordem} em andamento será encerrada como interrompida e contará como incorreta. Deseja continuar?`)) return;
        location.href = `exame.html?tema=${ordem}`;
    }

    try {
        const progresso = await portal.pedir('/api/exames/progresso');
        temaEmAndamento = progresso.temas.find(tema => tema.estado === 'em_andamento');
        cards.forEach(card => {
            const tema = progresso.temas.find(tema => tema.ordem === Number(card.dataset.id));
            const botao = card.querySelector('.btn-iniciar');
            botao.disabled = !tema || tema.estado === 'concluido';
            if (!tema) return;
            botao.textContent = rotulos[tema.estado];
            botao.addEventListener('click', evento => {
                evento.stopPropagation();
                if (!botao.disabled) abrirTema(tema.ordem);
            });
        });
        mensagem.textContent = progresso.certificacao_concluida ? 'Certificação concluída.' : '';
        botaoContinuar.hidden = progresso.certificacao_concluida || progresso.proximo_tema === null;
        botaoContinuar.disabled = botaoContinuar.hidden;
        botaoContinuar.addEventListener('click', () => abrirTema(progresso.proximo_tema));
    } catch (erro) {
        portal.avisar(erro.message);
        mensagem.textContent = '';
        cards.forEach(card => { card.querySelector('.btn-iniciar').disabled = true; });
        botaoContinuar.disabled = true;
        botaoContinuar.hidden = true;
    }
});
