# Carga de questões

Os 12 JSONs atuais contêm 48 questões importáveis, quatro por tema, com 192 alternativas. Todas as 48 questões têm imagem. O importador aceita o campo `destino` para mapear uma questão para outro tema/código ou ignorá-la quando esse campo é `null`.

O [mapeamento curricular](questoes/mapeamento-temas.md) apresenta a distribuição atual: 33 questões provenientes de documentos e 15 questões autorais, descritas no [complemento curricular](questoes/complemento-curricular.md). Juntas, elas formam as 48 questões; o complemento já está incluído nesse total.

## Regra das alternativas

O banco recusa qualquer questão que não tenha exatamente 4 alternativas (A a D) e exatamente 1 correta. A verificação é feita no fim da transação, por isso a questão e as quatro alternativas precisam ser gravadas na mesma transação, como o importador já faz. A regra vem da migração `005_alternativas_questao.sql`, que também se recusa a rodar se encontrar no banco alguma questão fora dessa regra, listando quais são. Para corrigir o gabarito de conteúdo importado, publique uma nova versão com outro código. A migração 007 impede alterar questões e alternativas que já possuem tentativas. Consulte [a manutenção do histórico](us25-manutencao-catalogo.md).

## Preparação completa

Consulte o [fluxo de preparação do banco](preparacao-banco.md). Pela raiz, configure o PostgreSQL em `backend/.env` e execute:

```sh
npm run setup
npm run db:preparar -- --validar
npm run db:preparar
```

Em banco vazio fora do Docker, execute antes `database/ddl/schema.sql`, que já incorpora as estruturas das migrações 003, 005, 006, as duas 007 e 008. O comando completo aplica as migrações 001 a 008 (incluindo os dois arquivos 007), importa os temas e depois as questões.

## Importação individual

```sh
npm run db:questoes -- --validar
npm run db:questoes -- --migrar
npm run db:questoes
```

O comando `--migrar` aplica as migrações 003, 005, 006, as duas 007 e 008, nessa ordem, todas repetíveis. Em banco existente, aplique também as migrações anteriores necessárias. Para essa importação individual, os temas precisam estar cadastrados, pelo seed ou pelo importador dos temas. `--validar` lê os arquivos e não acessa o banco.

A carga é transacional, serializada e repetível. Os IDs reais dos temas são consultados pela ordem. O hash impede substituir conteúdo já importado: alterações exigem novo código de versão. `--vincular-imagens` permite apenas adicionar imagem ao mesmo conteúdo anteriormente sem imagem, preservando IDs e respostas, somente em questões ainda sem tentativas. Questões utilizadas exigem uma nova versão. Não substitui imagens nem textos. Questões cadastradas manualmente sem código de origem exigem revisão antes da primeira carga.

Se uma instalação já importou os JSONs 7–12 com outra numeração, revise esses registros e as respostas associadas antes de executar esta versão. A carga não reclassifica registros existentes; colisões de código com conteúdo diferente causam rollback. Não apague respostas para corrigir o catálogo.

## Docker

```powershell
docker compose up -d --build
docker compose logs preparar-banco
```

O Docker inclui os JSONs e as imagens. O serviço `preparar-banco` executa as migrações e as cargas antes da aplicação, inclusive em volumes antigos, que não reexecutam o schema; por isso um volume criado antes da US14 recebe a 005 na próxima subida. Não remova volumes para recarregar questões; siga o [procedimento para instalações existentes](preparacao-banco.md).

As imagens documentais ficam em `docs/questoes/questoes-imagens`. As públicas ficam em `imagens/questoes`; os caminhos antigos de `imagens/` também foram preservados para bancos existentes. A API usa `LEFT JOIN` e a tela omite a imagem quando nula. Créditos não informados permanecem nulos. Algumas ilustrações dão pistas da resposta e precisam de revisão pedagógica.

## Cobertura e testes

O total de referência para a carga é 48 questões e 192 alternativas, com quatro questões em cada um dos 12 temas, todas com imagem. A revisão pedagógica e a carga no ambiente de destino continuam necessárias.

Para rodar os testes, inclusive os que usam PostgreSQL real, reconstrua a imagem (os testes entram nela no build):

```powershell
docker compose up -d --build
docker compose exec -e TEST_EXAME_POSTGRES=true app npm test
docker compose exec app npm test
```

## Consolidação das proteções do histórico
Os arquivos 007_versionamento_questoes.sql e 007_historico_questoes.sql permanecem
preservados. A preparação executa primeiro a 007 da develop, depois a 007 da US25
e finalmente 008_consolidacao_historico.sql, antes de qualquer importação.
A 008 remove os triggers e funções antigos redundantes e mantém somente a proteção
da US25, com SQLSTATE 23514 e identificação da restrição.
Não execute somente uma migração antiga para atualizar a instalação consolidada.
Use a preparação completa com app parada. Não remova volumes nem reaplique schema.
A 008 é repetível e preserva dados; o schema inicial já contém os mesmos triggers
finais. Instalações vindas de qualquer 007 são atendidas.
Veja também [a manutenção do catálogo](us25-manutencao-catalogo.md).
