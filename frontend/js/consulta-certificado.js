document.addEventListener('DOMContentLoaded', () => {
    const codigoInput = document.getElementById('codigo-consulta');
    const btnConsultar = document.getElementById('btn-consultar-codigo');
    const mensagem = document.getElementById('consulta-mensagem');
    const formConsulta = document.getElementById('consulta-form');
    const resultadoCertificado = document.getElementById('resultado-certificado');

    const codigoValido = '31EJLAKDFJAF-31DZSDFGEAGF';

    const exibirResultado = () => {
        formConsulta.hidden = true;
        resultadoCertificado.hidden = false;
    };

    btnConsultar?.addEventListener('click', () => {
        const codigoDigitado = (codigoInput?.value || '').trim();
        if (!codigoDigitado) {
            mensagem.textContent = 'Informe o código de verificação.';
            mensagem.style.color = '#ff8a8a';
            return;
        }

        if (codigoDigitado === codigoValido) {
            mensagem.textContent = '';
            exibirResultado();
            return;
        }

        mensagem.textContent = 'Código inválido ou não encontrado.';
        mensagem.style.color = '#ff8a8a';
    });
});
