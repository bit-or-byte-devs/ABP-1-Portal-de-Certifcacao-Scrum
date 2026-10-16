const form = document.querySelector('form[data-endpoint="/api/candidatos"]');
const modal = document.getElementById('successModal');
const submitButton = form.querySelector('button[type="submit"]');
const statusMessage = form.querySelector('.aviso');
const passwordInput = form.elements.senha;
const confirmPasswordInput = form.elements.confirmarSenha;

function validatePasswords() {
    passwordInput.setCustomValidity(
        passwordInput.value.length < 8
            ? 'A senha deve ter pelo menos 8 caracteres.'
            : ''
    );
    confirmPasswordInput.setCustomValidity(
        confirmPasswordInput.value !== passwordInput.value
            ? 'As senhas devem ser iguais.'
            : ''
    );
}

passwordInput.addEventListener('input', validatePasswords);
confirmPasswordInput.addEventListener('input', validatePasswords);

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    validatePasswords();

    if (!form.reportValidity()) {
        return;
    }

    submitButton.disabled = true;
    statusMessage.textContent = 'Criando sua conta...';
    statusMessage.classList.remove('aviso--erro');

    try {
        const values = new FormData(form);
        const response = await fetch(form.dataset.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: values.get('nome'),
                cpf: values.get('cpf'),
                email: values.get('email'),
                senha: values.get('senha'),
                aceiteTermos: values.get('aceiteTermos') === 'on'
            })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.mensagem || 'Não foi possível criar sua conta.');
        }

        statusMessage.textContent = '';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('btnFechar').focus();
    } catch (error) {
        statusMessage.textContent = error instanceof TypeError
            ? 'Não foi possível conectar ao serviço. Tente novamente.'
            : error.message;
        statusMessage.classList.add('aviso--erro');
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById('btnFechar').addEventListener('click', () => {
    window.location.href = 'menu.html';
});

document.getElementById('btnIniciar').addEventListener('click', () => {
    window.location.href = 'temas.html';
});

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
});
