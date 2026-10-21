const form = document.getElementById('signupForm');
const modal = document.getElementById('successModal');
const btnFechar = document.getElementById('btnFechar');
const btnIniciar = document.getElementById('btnIniciar');

// Evento de envio do formulário
form.addEventListener('submit', function(event) {
    event.preventDefault();
    modal.classList.add('active');
});

// Fechar modal em "Não agora"
btnFechar.addEventListener('click', function() {
    modal.classList.remove('active');
    form.reset(); 
});

// Ação em "Iniciar testes"
btnIniciar.addEventListener('click', function() {
    alert('Redirecionando para os testes de certificação Scrum...');
    modal.classList.remove('active');
    form.reset();
});

// Fechar modal ao clicar fora da caixa branca
modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.classList.remove('active');
    }
});