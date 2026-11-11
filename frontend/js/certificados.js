document.addEventListener('DOMContentLoaded', async () => {
    const mensagem = document.getElementById('mensagem-resultado');
    const resultadoFinal = document.getElementById('resultado-final');
    const linkExames = document.getElementById('link-exames');
    resultadoFinal.hidden = true;
    linkExames.hidden = true;

    try {
        const progresso = await portal.pedir('/api/exames/progresso');
        if (!progresso.certificacao_concluida || !progresso.resultado_final) {
            mensagem.textContent = 'Conclua os 12 temas para visualizar seu resultado final.';
            linkExames.hidden = false;
            return;
        }

        const resultado = progresso.resultado_final;
        const valores = [
            resultado.nota_final,
            resultado.percentual_acertos,
            resultado.percentual_minimo_certificado,
        ].map(Number);
        const totalAcertos = Number(resultado.total_acertos);
        if (!valores.every(Number.isFinite) || !Number.isInteger(totalAcertos)
            || totalAcertos < 0 || totalAcertos > 12 || typeof resultado.apto_certificado !== 'boolean') {
            throw new Error('O resultado recebido está inválido.');
        }

        const formatarNumero = valor => new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valor);
        const formatarPercentual = valor => `${formatarNumero(valor)}%`;
        document.getElementById('nota-final').textContent = `${formatarNumero(valores[0])} / 100`;
        document.getElementById('percentual-acertos').textContent = formatarPercentual(valores[1]);
        document.getElementById('total-acertos').textContent = `${totalAcertos} de 12`;

        const condicao = document.getElementById('condicao-certificado');
        condicao.textContent = resultado.apto_certificado
            ? `Você atingiu o mínimo de ${formatarPercentual(valores[2])} e está apto à emissão do certificado.`
            : `Você não atingiu o mínimo de ${formatarPercentual(valores[2])} necessário para a emissão do certificado.`;
        mensagem.textContent = 'Certificação concluída. Suas respostas e seu resultado são somente para consulta.';
        resultadoFinal.hidden = false;
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});
