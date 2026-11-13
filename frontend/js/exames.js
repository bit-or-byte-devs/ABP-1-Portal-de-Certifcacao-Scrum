document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.theme-card');
    const botaoContinuar = document.getElementById('btn-continuar-certificacao');
    const mensagem = document.getElementById('mensagem-certificacao');
    const rotulos = { pendente: 'Iniciar exame', em_andamento: 'Em andamento', concluido: 'Revisar' };
    let progresso;
    let versaoConsulta = 0;
    let carregando = true;

    function bloquearAcoes() {
        cards.forEach(card => { card.querySelector('.btn-iniciar').disabled = true; });
        botaoContinuar.disabled = true;
    }

    function abrirTema(ordem) {
        if (carregando || !progresso || ordem == null) return;
        const tema = progresso.temas.find(tema => tema.ordem === ordem);
        if (!tema || tema.estado === 'concluido') return;
        const temaEmAndamento = progresso.temas.find(tema => tema.estado === 'em_andamento');
        if (temaEmAndamento && !confirm(`A questão do tema ${temaEmAndamento.ordem} em andamento será encerrada como interrompida e contará como incorreta. Deseja continuar?`)) return;
        location.href = `exame.html?tema=${ordem}`;
    }

    function abrirRevisao(ordem) {
        if (carregando || !progresso) return;
        const tema = progresso.temas.find(tema => tema.ordem === ordem);
        if (tema?.estado !== 'concluido' || !tema.id_resposta) return;
        location.href = `exame.html?resposta=${encodeURIComponent(tema.id_resposta)}`;
    }

    // Os listeners são registrados uma vez; os cliques usam o estado atual da API.
    cards.forEach(card => {
        const botao = card.querySelector('.btn-iniciar');
        botao.addEventListener('click', evento => {
            evento.stopPropagation();
            if (botao.disabled || carregando) return;
            const ordem = Number(card.dataset.id);
            const tema = progresso?.temas.find(tema => tema.ordem === ordem);
            if (tema?.estado === 'concluido') abrirRevisao(ordem);
            else abrirTema(ordem);
        });
    });
    botaoContinuar.addEventListener('click', () => {
        if (!botaoContinuar.disabled) abrirTema(progresso?.proximo_tema);
    });

    async function atualizarProgresso() {
        const consulta = ++versaoConsulta;
        carregando = true;
        progresso = null;
        bloquearAcoes();
        mensagem.textContent = 'Atualizando progresso...';
        try {
            const atual = await portal.pedir('/api/exames/progresso');
            // Uma consulta anterior não pode sobrescrever um retorno mais recente.
            if (consulta !== versaoConsulta) return;
            progresso = atual;
            cards.forEach(card => {
                const tema = progresso.temas.find(tema => tema.ordem === Number(card.dataset.id));
                const botao = card.querySelector('.btn-iniciar');
                botao.disabled = !tema || (tema.estado === 'concluido' && !tema.id_resposta);
                card.querySelector('.progress-badge .green-text').textContent = tema?.estado === 'concluido' ? '100%' : '0%';
                botao.textContent = tema ? rotulos[tema.estado] : 'Indisponível';
                if (tema) card.querySelector('h3').textContent = `${tema.ordem}. ${tema.nome}`;
            });
            mensagem.textContent = progresso.certificacao_concluida
                ? `Certificação concluída. ${progresso.total_acertos}/12 acertos (${Number(progresso.percentual_acertos ?? 0).toFixed(2)}%) — ${progresso.aprovado ? 'Aprovado' : 'Reprovado'}.`
                : '';
            botaoContinuar.hidden = progresso.certificacao_concluida || progresso.proximo_tema == null;
            botaoContinuar.disabled = botaoContinuar.hidden;
            carregando = false;
        } catch (erro) {
            if (consulta !== versaoConsulta) return;
            progresso = null;
            bloquearAcoes();
            botaoContinuar.hidden = true;
            mensagem.textContent = 'Não foi possível atualizar o progresso. Recarregue a página para tentar novamente.';
            portal.avisar(erro.message);
        }
    }

    window.addEventListener('pageshow', evento => {
        if (evento.persisted) atualizarProgresso();
    });
    // Invalida consultas pendentes e impede ações antigas na restauração pelo histórico.
    window.addEventListener('pagehide', () => {
        ++versaoConsulta;
        carregando = true;
        progresso = null;
        bloquearAcoes();
    });
    atualizarProgresso();
});
