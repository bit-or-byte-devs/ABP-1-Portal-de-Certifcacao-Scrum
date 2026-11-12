document.addEventListener('DOMContentLoaded', async () => {
    const mensagem = document.getElementById('mensagem-resultado');
    const resultadoFinal = document.getElementById('resultado-final');
    const linkExames = document.getElementById('link-exames');
    const detalhesResultado = document.getElementById('detalhes-resultado');
    const autenticidadeResultado = document.getElementById('autenticidade-resultado');
    const nomeCandidato = document.getElementById('nome-candidato');
    const progressoCertificacao = document.getElementById('progresso-certificacao');
    const statusCertificacao = document.getElementById('status-certificacao');
    const btnConsultarCodigo = document.getElementById('btn-consultar-codigo');
    const certificadoEmitido = document.getElementById('certificado-emitido');

    btnConsultarCodigo?.addEventListener('click', () => {
        window.location.href = 'consultar-certificado.html';
    });

    resultadoFinal.hidden = false;
    certificadoEmitido.hidden = true;
    linkExames.hidden = true;
    detalhesResultado.hidden = true;
    autenticidadeResultado.hidden = true;

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
            autenticidadeResultado.hidden = true;
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
            ? 'Apto à emissão do certificado'
            : 'Não concluído';

        document.getElementById('status-documento').textContent = 'Certificado ainda não emitido';
        document.getElementById('data-validacao').textContent = new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short', timeStyle: 'short',
        }).format(new Date());

        detalhesResultado.hidden = false;
        autenticidadeResultado.hidden = false;
        mensagem.textContent = 'Certificação concluída. Suas respostas e seu resultado são somente para consulta.';
        linkExames.hidden = true;

        if (resultado.apto_certificado) {
            const nomeEmitido = document.getElementById('certificado-nome');
            if (nomeEmitido) nomeEmitido.textContent = usuario.nome.trim();
            certificadoEmitido.hidden = false;
            resultadoFinal.hidden = false;
        }
    };

    const carregarDados = async () => {
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
    };

    await carregarDados();
    setInterval(carregarDados, 4000);
});
