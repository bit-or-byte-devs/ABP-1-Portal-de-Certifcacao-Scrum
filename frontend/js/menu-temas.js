document.addEventListener('DOMContentLoaded', () => {
    const storageKey = 'borb.exames.concluidos';
    const inProgressStorageKey = 'borb.exames.emAndamento';
    const storedExamIds = localStorage.getItem(storageKey);
    const completedExamIds = storedExamIds === null ? [] : JSON.parse(storedExamIds);
    const storedInProgressIds = localStorage.getItem(inProgressStorageKey);
    const inProgressExamIds = storedInProgressIds === null ? [] : JSON.parse(storedInProgressIds);

    for (const examIds of [completedExamIds, inProgressExamIds]) {
        if (!Array.isArray(examIds) || examIds.some(id => !Number.isInteger(id) || id < 1 || id > 12)) {
            throw new Error('O progresso dos exames armazenado é inválido.');
        }
    }

    const completedExams = new Set(completedExamIds);
    const inProgressExams = new Set(inProgressExamIds);
    const themeCards = document.querySelectorAll('.theme-card');
    const examPage = document.querySelector('[data-tela="exames"]');
    const certificatePage = document.querySelector('[data-tela="certificado"]');

    function updateProgress() {
        const completedCount = completedExams.size;
        const percentage = Math.round((completedCount / 12) * 100);

        if (examPage) {
            themeCards.forEach(card => {
                const examId = Number(card.dataset.id);
                const isComplete = completedExams.has(examId);
                const isInProgress = inProgressExams.has(examId);
                const progress = card.querySelector('.progress-badge .green-text');
                const button = card.querySelector('.btn-iniciar');

                if (progress) progress.textContent = isComplete ? '100%' : '0%';
                if (button && isComplete) {
                    button.textContent = 'Exame concluído';
                    button.disabled = true;
                } else if (button && isInProgress) {
                    button.textContent = 'Exame em andamento';
                    button.disabled = true;
                }
            });
        }

        if (certificatePage) {
            const progress = certificatePage.querySelector('[data-certificate-progress]');
            const button = certificatePage.querySelector('.btn-iniciar');
            const lock = button.querySelector('.certificate-lock');
            const locked = percentage < 100;

            progress.textContent = `${percentage}%`;
            button.disabled = locked;
            lock.hidden = !locked;
        }
    }

    updateProgress();

    // Comportamento de Acordeão ao clicar nos temas
    themeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Se clicar no botão de iniciar, não fecha nem abre o acordeão diretamente por ele
            if (e.target.closest('.btn-iniciar')) return;

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
            const card = btn.closest('.theme-card');
            const tituloTema = card.querySelector('h3').textContent.trim();

            if (examPage) {
                const examId = Number(card.dataset.id);
                inProgressExams.add(examId);
                localStorage.setItem(inProgressStorageKey, JSON.stringify([...inProgressExams]));
                updateProgress();
                alert(`Exame em andamento: ${tituloTema}.`);
                return;
            }

            const label = btn.dataset.label || 'A iniciar';
            alert(`${label}: ${tituloTema}`);
        });
    });
});