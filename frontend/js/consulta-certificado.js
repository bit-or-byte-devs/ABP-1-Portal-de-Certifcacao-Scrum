document.addEventListener('DOMContentLoaded', () => {
    const formConsulta = document.getElementById('consulta-form');
    const codigoInput = document.getElementById('codigo-consulta');
    const btnConsultar = document.getElementById('btn-consultar-codigo');
    const mensagem = document.getElementById('consulta-mensagem');
    const resultadoCertificado = document.getElementById('resultado-certificado');

    async function consultar(codigo) {
        btnConsultar.disabled = true;
        mensagem.textContent = 'Consultando certificado...';
        resultadoCertificado.hidden = true;
        try {
            const resposta = await fetch('/api/certificados/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo }),
                cache: 'no-store',
            });
            const dados = await resposta.json();
            if (!resposta.ok || dados.valido !== true || !dados.certificado) {
                throw new Error(dados.mensagem || 'Certificado inválido ou não encontrado.');
            }

            const certificado = dados.certificado;
            const nota = Number(certificado.nota_final);
            const percentual = Number(certificado.percentual_acertos);
            const dataEmissao = new Date(certificado.data_hora_emissao);
            if (typeof certificado.nome !== 'string' || !certificado.nome.trim()
                || !Number.isFinite(nota) || !Number.isFinite(percentual)
                || Number.isNaN(dataEmissao.getTime())) {
                throw new Error('Os dados do certificado são inválidos.');
            }

            document.getElementById('nome-certificado').textContent = certificado.nome;
            document.getElementById('nota-certificado').textContent = new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
            }).format(nota);
            document.getElementById('percentual-certificado').textContent = new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
            }).format(percentual);
            const elementoData = document.getElementById('data-emissao-certificado');
            elementoData.dateTime = dataEmissao.toISOString();
            elementoData.textContent = new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
            }).format(dataEmissao);
            document.getElementById('codigo-validado').textContent = codigo;
            document.getElementById('modelo-nome').textContent = certificado.nome;
            document.getElementById('modelo-data').textContent = new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short', timeZone: 'America/Sao_Paulo',
            }).format(dataEmissao);
            document.getElementById('modelo-hora').textContent = new Intl.DateTimeFormat('pt-BR', {
                timeStyle: 'short', timeZone: 'America/Sao_Paulo',
            }).format(dataEmissao);
            document.getElementById('modelo-nota').textContent = document.getElementById('nota-certificado').textContent;
            document.getElementById('modelo-acertos').textContent = `${document.getElementById('percentual-certificado').textContent}%`;
            const certificadoUrl = `/api/certificados/${encodeURIComponent(codigo)}`;
            document.getElementById('qr-certificado-publico').src = `${certificadoUrl}/qr`;
            document.getElementById('baixar-certificado-publico').href = `${certificadoUrl}/pdf-publico`;
            mensagem.textContent = '';
            formConsulta.hidden = true;
            resultadoCertificado.hidden = false;
        } catch (erro) {
            mensagem.textContent = erro.message || 'Não foi possível consultar o certificado.';
        } finally {
            btnConsultar.disabled = false;
        }
    }

    formConsulta.addEventListener('submit', evento => {
        evento.preventDefault();
        const codigo = codigoInput.value.trim();
        if (!/^[a-f0-9]{64}$/i.test(codigo)) {
            mensagem.textContent = 'Informe um código de validação válido.';
            return;
        }
        consultar(codigo);
    });

    const parametrosUrl = new URLSearchParams(location.search);
    const codigoUrl = parametrosUrl.get('codigo');
    if (parametrosUrl.get('via') === 'qrcode' && codigoUrl && /^[a-f0-9]{64}$/i.test(codigoUrl)) {
        codigoInput.value = codigoUrl;
    }
});
