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

Todas as rotas exigem sessão (401 sem login) e usam sempre o candidato da sessão (`req.candidato.id`); nenhum identificador de candidato é aceito do cliente. Falhas de banco respondem 503 com mensagem genérica. Só cartões com `ativo = true` aparecem.

### `GET /api/flashcards`

Devolve, para cada um dos 12 temas, `ordem`, `nome`, `total` de cartões ativos, `novos` (sem progresso do candidato), `caixa1`, `caixa2`, `caixa3` e `dominio` (`caixa3 / total`, em %, arredondado), além de um objeto `geral` com os mesmos campos somados.

### `GET /api/flashcards/sessao?modo=&temas=&limite=`

| Parâmetro | Regra |
| --- | --- |
| `modo` | `tema`, `revisao` ou `aleatorio`. Outro valor: 400. |
| `temas` | Ordens de 1 a 12 separadas por vírgula, sem repetição (`1,4,7`). Obrigatório em `tema`, opcional em `revisao` (filtra se vier), ignorado em `aleatorio`. |
| `limite` | Inteiro de 5 a 40. Padrão 20. |

Ordem dos cartões:

- `tema`: caixa 1, caixa 2, novos e caixa 3, sorteados dentro de cada grupo.
- `revisao` ("Revisar os que errei" na tela): só os cartões do candidato na caixa 1, isto é, cuja última resposta foi "Não sabia", sorteados. Nunca traz novos, caixa 2 nem caixa 3; a caixa 2 continua coberta pelo modo `tema`, que a prioriza logo depois da caixa 1. Um cartão errado sai da revisão assim que o candidato responde "Sabia" (vai para a caixa 2). Na tela, o modo fica desabilitado quando não há cartões na caixa 1 (no geral ou nos temas marcados).
- `aleatorio`: sorteio puro entre todos os temas.

Resposta: `{ modo, cartoes: [{ codigo, tema: { ordem, nome }, frente, verso, explicacao, fonte, imagem: { caminho, alt } | null, caixa | null }] }`. Sem cartões, responde 200 com `cartoes: []`. Parâmetros inválidos respondem 400 com `mensagem`.

### `POST /api/flashcards/:codigo/resultado`

Corpo JSON `{ "sabia": true | false }` (booleano estrito; outro tipo de conteúdo responde 415). Código fora do padrão `tema-NN-fcNN[-vN]` responde 400; cartão inexistente ou inativo, 404.

A nova caixa vem de `proximaCaixa` (`backend/src/services/leitner.js`):

| Caixa atual | Sabia | Não sabia |
| --- | --- | --- |
| nenhuma (novo) | 2 | 1 |
| 1 | 2 | 1 |
| 2 | 3 | 1 |
| 3 | 3 | 1 |

A gravação é um único `INSERT ... ON CONFLICT DO UPDATE` que soma `acertos` ou `erros` e atualiza `ultima_revisao`, dentro de uma transação com bloqueio por candidato e cartão para evitar respostas simultâneas. Resposta: `{ caixa, acertos, erros, dominioTema }`, em que `dominioTema` é o domínio atualizado do tema do cartão, em %.

Exemplo no PowerShell, com a sessão do navegador em `$s` (`Invoke-WebRequest ... -SessionVariable s` no login):

```powershell
Invoke-RestMethod "http://localhost:3000/api/flashcards/sessao?modo=tema&temas=1,2&limite=10" -WebSession $s
Invoke-RestMethod "http://localhost:3000/api/flashcards/tema-01-fc01/resultado" -Method Post -WebSession $s `
  -ContentType "application/json" -Body '{"sabia":true}'
```

## Tela de flashcards

`frontend/pages/flashcards.html` tem três estados: seleção (modo e temas), sessão (cartão com frente e verso, teclas Enter/Espaço para virar e 1/2 para Não sabia/Sabia depois de virar) e resumo (sabia, não sabia, cartões que chegaram à caixa 3 e o atalho para revisar os errados, desabilitado quando não há cartões na caixa 1). `?tema=N` na URL já marca o tema na seleção.

## Testes

```powershell
cd backend
npm test
docker compose up -d --build
docker compose exec -e TEST_EXAME_POSTGRES=true app npm test
```

`importar-flashcards.test.js` cobre a validação sem banco e `leitner.test.js`, a tabela de transições de `proximaCaixa`. `flashcards.postgres.test.js`, habilitada por `TEST_EXAME_POSTGRES=true`, roda em um schema isolado e cobre migração repetível, importação repetível, rollback por hash alterado, desativação por nova versão, o resumo isolado entre dois candidatos, as sessões nos três modos, a validação dos parâmetros, as transições pela rota, o 404 de cartão inativo e o isolamento do progresso e da revisão entre candidatos.
