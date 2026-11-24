# Carga de flashcards

Os flashcards ficam em `database/flashcards/tema-NN.json`, um arquivo por tema, com **exatamente 10 cartões** cada. Eles são armazenados como as questões (JSON versionado, código de origem, hash SHA-256 e importação transacional), mas em tabelas próprias: `tbflashcard` (catálogo) e `tbprogresso_flashcard` (caixa de 1 a 3 de cada candidato, na repetição espaçada Leitner). Nada em `tbquestao`, `tbalternativa` ou nas respostas dos exames é alterado.

## Formato do arquivo

```json
{
  "tema": 1,
  "fonte": "Referência geral do tema",
  "flashcards": [
    {
      "codigo": "tema-01-fc01",
      "frente": "Pergunta ou conceito curto",
      "verso": "Resposta objetiva",
      "explicacao": "Complemento para aprofundamento",
      "imagem": null,
      "fonte": "Referência específica"
    }
  ]
}
```

Regras verificadas pelo importador, antes de qualquer acesso ao banco:

- `tema` inteiro de 1 a 12, sem dois arquivos para o mesmo tema; `fonte` do arquivo não vazia.
- `codigo` no padrão `tema-NN-fcNN`, com sufixo opcional de versão (`tema-01-fc01-v2`), prefixo igual ao tema do arquivo e sem repetição entre arquivos.
- `frente`, `verso`, `explicacao` e `fonte` obrigatórios e não vazios (`fonte` com até 255 caracteres).
- `imagem` é `null` ou `{ "caminho": "/imagens/...", "alt": "...", "credito": "..." }` (crédito opcional), apontando para um arquivo existente dentro de `imagens/`, com a mesma proteção contra caminhos fora da pasta usada nas questões.
- O hash é calculado sobre o conteúdo normalizado (espaços nas pontas dos textos não contam).

## Versionamento

- Mesmo código e mesmo hash: o cartão é reconhecido como existente.
- Mesmo código com conteúdo diferente: a importação inteira é desfeita com `Conteúdo alterado em X. Use um novo código de versão.`
- Para corrigir um cartão, troque o código no JSON (por exemplo, `tema-01-fc01` para `tema-01-fc01-v2`). Na carga, o novo é inserido e o antigo fica com `ativo = false`. Linhas nunca são apagadas, então o progresso já registrado é preservado.
- Para cada tema presente nos JSONs, o arquivo é a fonte da verdade: códigos que saíram dele são desativados e os que estão nele são (re)ativados. Temas sem arquivo não são alterados.

## Preparação completa

Consulte o [fluxo de preparação do banco](preparacao-banco.md). O `db:preparar` aplica a migração `009_flashcards.sql` e importa os flashcards depois das questões, com etapa própria no log. Em banco vazio fora do Docker, `database/ddl/schema.sql` já cria as duas tabelas.

## Importação individual

Na raiz do projeto (PowerShell):

```powershell
npm run db:flashcards -- --validar
npm run db:flashcards -- --validar --exigir-todos
npm run db:flashcards -- --migrar
npm run db:flashcards
```

- `--validar`: lê e valida os JSONs e imagens, sem acessar o banco.
- `--exigir-todos`: além das regras acima, falha se faltar algum dos 12 temas. Sem ela, de 1 a 12 arquivos são aceitos (os temas podem chegar aos poucos). Pode acompanhar `--validar` ou a importação.
- `--migrar`: aplica somente a migração 009, que é repetível.
- Sem argumento: importa em uma transação, com bloqueio `pg_advisory_xact_lock` próprio (diferente do das questões), e imprime `{ inseridos, existentes, desativados }`. Os temas precisam estar cadastrados; os IDs reais são consultados pela ordem do tema.

## Docker

```powershell
docker compose up -d --build
docker compose logs preparar-banco
```

O Docker copia `database/` inteira para a imagem, então novos arquivos de flashcards entram no próximo `--build`.

## API

`GET /api/flashcards` (sessão obrigatória) devolve, para cada um dos 12 temas, `ordem`, `nome`, `total` de cartões ativos, `novos` (sem progresso do candidato), `caixa1`, `caixa2`, `caixa3` e `dominio` (`caixa3 / total`, em %, arredondado), além de um objeto `geral` com os mesmos campos somados. O progresso é sempre filtrado pelo candidato da sessão; falhas de banco respondem 503 com mensagem genérica.

## Testes

```powershell
cd backend
npm test
docker compose up -d --build
docker compose exec -e TEST_EXAME_POSTGRES=true app npm test
```

`importar-flashcards.test.js` cobre a validação sem banco. `flashcards.postgres.test.js`, habilitada por `TEST_EXAME_POSTGRES=true`, roda em um schema isolado e cobre migração repetível, importação repetível, rollback por hash alterado, desativação por nova versão e o resumo isolado entre dois candidatos.
