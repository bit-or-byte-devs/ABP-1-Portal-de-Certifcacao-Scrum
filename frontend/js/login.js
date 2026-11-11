(() => {
    const form = document.querySelector('form[data-endpoint="/api/login"]');
    const aviso = form.querySelector('.aviso');
    const botao = form.querySelector('button[type="submit"]');
    const cpf = form.elements.cpf;
    const senha = form.elements.senha;

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (botao.disabled) return;
        aviso.textContent = '';
        const cpfNormalizado = cpf.value.replace(/[.\-\s]/g, '');
        const cpfInvalido = !/^\d{11}$/.test(cpfNormalizado);
        const senhaInvalida = !senha.value || new TextEncoder().encode(senha.value).length > 72;
        document.getElementById('cpf-erro').textContent = cpfInvalido ? 'Informe um CPF com 11 dígitos.' : '';
        document.getElementById('senha-erro').textContent = senhaInvalida ? 'Informe uma senha de até 72 bytes.' : '';
        cpf.setAttribute('aria-invalid', String(cpfInvalido));
        senha.setAttribute('aria-invalid', String(senhaInvalida));
        if (cpfInvalido || senhaInvalida) {
            (cpfInvalido ? cpf : senha).focus();
            return;
        }
        botao.disabled = true;
        form.setAttribute('aria-busy', 'true');
        try {
            const resposta = await fetch(form.dataset.endpoint, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                // Nao aplicar trim, mascara ou normalizacao na senha.
                body: JSON.stringify({ cpf: cpfNormalizado, senha: senha.value }),
            });
            const dados = await resposta.json();
            aviso.textContent = dados.mensagem || 'Não foi possível entrar. Tente novamente.';
            if (resposta.ok) {
                senha.value = '';
                senha.type = 'password';
                const olho = form.querySelector('.btn-olho');
                olho.setAttribute('aria-pressed', 'false');
                olho.setAttribute('aria-label', 'Mostrar senha');
            }
        } catch {
            aviso.textContent = 'Não foi possível conectar ao servidor. Tente novamente.';
        } finally {
            botao.disabled = false;
            form.removeAttribute('aria-busy');
        }
    });
})();
