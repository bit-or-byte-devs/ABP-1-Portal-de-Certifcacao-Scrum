# US25 — manutenção do catálogo e histórico

A migração 007 e o schema inicial preservam a versão de uma questão desde sua
primeira tentativa, inclusive em andamento. O histórico continua sendo consultado
pelos relacionamentos existentes, sem nova rota ou tela.

## Regra de preservação
- Questão com tentativa não pode ser alterada nem excluída.
- Suas alternativas não podem ser inseridas, alteradas, movidas ou excluídas.
- Os vínculos de uma tentativa com certificação, tema e questão não podem ser trocados.
- Envio, sinal periódico e encerramento continuam atualizando os campos próprios
  da tentativa pelas regras existentes.
- UPDATE sem mudança efetiva é permitido.
- Questões sem tentativas continuam sujeitas às regras existentes de quatro
  alternativas e uma correta; o importador continua exigindo código novo ao
  detectar conteúdo diferente para o mesmo código.

As proteções são triggers para SQL DML normal, inclusive comandos fora da API.
Não são uma barreira contra um administrador que remova/desabilite triggers,
apague tentativas ou use TRUNCATE. Não faça isso para manter o catálogo.
Os triggers preservam os campos da questão e alternativas; não versionam o nome
do tema nem os bytes de arquivos de imagem. Preserve arquivos antigos e use
novos caminhos ao revisar imagens, sem substituir os arquivos já publicados.

## Publicar uma correção
1. Preserve no banco a questão e suas alternativas antigas.
2. No JSON correspondente, use um código novo, por exemplo tema-01-q01-v2.
   Se houver destino.codigo, atualize esse código também.
3. Altere enunciado, justificativa, alternativas ou gabarito nessa nova versão.
   Mantenha quatro alternativas A–D e exatamente uma correta.
4. Valide os JSONs e importe pelo fluxo normal de preparação.
5. Confira que a versão nova recebeu IDs próprios e que a tentativa antiga
   mantém seus IDs, escolha, resultado, horários e gabarito.

Não altere hashes manualmente nem apague respostas para forçar uma importação.
O importador não remove as versões antigas ausentes dos JSONs.
A regra de sorteio permanece a mesma: versões antigas e novas continuam elegíveis.
Desativar versões para futuros sorteios exige uma regra própria, fora desta US.

## Instalações existentes
Aplique a preparação com a aplicação parada, como em preparacao-banco.md.
A 007 é transacional e repetível, não regrava registros históricos e não exige
recriar o banco. Seus bloqueios de instalação justificam a parada da aplicação.
O schema inicial já inclui os mesmos triggers para instalações novas.

O modo --vincular-imagens agora também respeita a preservação: não pode adicionar
imagem a uma questão que já possui tentativa. Nesse caso, publique versão nova.
Questões ainda não utilizadas mantêm o comportamento anterior desse modo.

Não é possível reconstruir um enunciado ou gabarito que já tenha sido alterado
antes da proteção sem uma fonte histórica externa. A migração preserva o conteúdo
atualmente existente; não inventa dados nem altera resultados antigos.
