document.addEventListener('DOMContentLoaded', async () => {
    const mensagem = document.getElementById('mensagem-resultado');
    const resultadoFinal = document.getElementById('resultado-final');
    const linkExames = document.getElementById('link-exames');
    const detalhesResultado = document.getElementById('detalhes-resultado');
    const nomeCandidato = document.getElementById('nome-candidato');
    const progressoCertificacao = document.getElementById('progresso-certificacao');
    const statusCertificacao = document.getElementById('status-certificacao');
    const codigoValidacaoContainer = document.getElementById('codigo-validacao-container');
    const qrCertificadoContainer = document.getElementById('qr-certificado-container');
    const certificadoEmitido = document.getElementById('certificado-emitido');

    resultadoFinal.hidden = false;
    linkExames.hidden = true;
    detalhesResultado.hidden = true;
    codigoValidacaoContainer.hidden = true;
    qrCertificadoContainer.hidden = true;
    certificadoEmitido.hidden = true;

    const formatarNumero = valor => new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valor);

    const atualizarProgresso = (progresso, usuario) => {
        if (usuario?.nome) {
            nomeCandidato.textContent = usuario.nome.trim();
        }

        const concluidos = Array.isArray(progresso?.temas)
            ? progresso.temas.filter(tema => tema.estado === 'concluido').length
            : 0;
        const totalTemas = 12;
        const progressoTexto = `${concluidos} de ${totalTemas} temas concluídos`;
        progressoCertificacao.textContent = progressoTexto;

        if (!progresso?.certificacao_concluida || !progresso?.resultado_final) {
            statusCertificacao.dataset.apto = 'false';
            statusCertificacao.textContent = 'Em andamento';
            mensagem.textContent = 'Conclua os 12 temas para visualizar seu resultado final.';
            linkExames.hidden = false;
            detalhesResultado.hidden = true;
            return;
        }

        const resultado = progresso.resultado_final;
        const valores = [resultado.nota_final, resultado.percentual_acertos].map(Number);
        const totalAcertos = Number(resultado.total_acertos);

        if (!valores.every(Number.isFinite) || !Number.isInteger(totalAcertos)
            || totalAcertos < 0 || totalAcertos > 12 || typeof resultado.apto_certificado !== 'boolean') {
            throw new Error('O resultado recebido está inválido.');
        }

        document.getElementById('nota-final').textContent = `${formatarNumero(valores[0])} / 100`;
        document.getElementById('percentual-acertos').textContent = `${formatarNumero(valores[1])}%`;
        document.getElementById('total-acertos').textContent = `${totalAcertos} de 12`;
        progressoCertificacao.textContent = '12 de 12 temas concluídos';
        statusCertificacao.dataset.apto = String(resultado.apto_certificado);
        statusCertificacao.textContent = resultado.apto_certificado
            ? 'Certificado emitido automaticamente'
            : 'Aproveitamento abaixo de 65%';

        if (resultado.apto_certificado) {
            if (typeof resultado.codigo_validacao !== 'string' || !/^[a-f0-9]{64}$/i.test(resultado.codigo_validacao)) {
                throw new Error('Não foi possível carregar o código único do certificado.');
            }
            document.getElementById('codigo-validacao').textContent = resultado.codigo_validacao;
            const urlQr = `/api/certificados/${encodeURIComponent(resultado.codigo_validacao)}/qr`;
            document.getElementById('qr-certificado-detalhes').src = urlQr;
            codigoValidacaoContainer.hidden = false;
            qrCertificadoContainer.hidden = false;
            const dataEmissao = new Date(resultado.data_hora_emissao);
            if (Number.isNaN(dataEmissao.getTime())) throw new Error('Data de emissão do certificado inválida.');
            const cpf = String(resultado.cpf_emitido || '').replace(/\D/g, '');
            const dadosCertificado = {
                'cert-nome': resultado.nome_emitido || usuario.nome.trim(),
                'cert-cpf': cpf.length === 11 ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : 'CPF não informado',
                'cert-email': resultado.email_emitido || 'E-mail não informado',
                'cert-data': new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(dataEmissao),
                'cert-hora': new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(dataEmissao),
                'cert-nota': formatarNumero(valores[0]),
                'cert-percentual': formatarNumero(valores[1]) + '%',
            };
            Object.entries(dadosCertificado).forEach(([id, texto]) => {
                document.getElementById(id).textContent = texto;
            });
            document.getElementById('baixar-certificado-pdf').href = `/api/certificados/${encodeURIComponent(resultado.codigo_validacao)}/pdf`;
            certificadoEmitido.hidden = false;
        }

        detalhesResultado.hidden = false;
        mensagem.textContent = 'Certificação concluída. Suas respostas e seu resultado são somente para consulta.';
        linkExames.hidden = true;
    };

    try {
        const [usuario, progresso] = await Promise.all([
            portal.pedir('/api/auth/usuario'),
            portal.pedir('/api/exames/progresso')
        ]);

        if (typeof usuario?.nome !== 'string' || !usuario.nome.trim()) {
            throw new Error('Não foi possível confirmar o nome do usuário.');
        }

        atualizarProgresso(progresso, usuario);
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});
