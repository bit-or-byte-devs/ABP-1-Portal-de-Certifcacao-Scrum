# Preparação automática do banco

## Fluxo no Docker Compose

Na raiz do projeto:

```sh
docker compose up -d --build
```

A ordem configurada é:

1. `db`: inicializa o PostgreSQL e, somente em um volume novo, executa `schema.sql` e `seed.sql`.
2. `preparar-banco`: aguarda o banco ficar saudável, valida os JSONs e imagens, confere as tabelas base, aplica as migrações 001 a 004 e importa temas e questões.
3. `app`: inicia após a preparação encerrar com código zero.

O serviço de preparação usa o mesmo Dockerfile da aplicação e não publica portas. É esperado que apareça como `Exited (0)` após o sucesso; não é um servidor permanente. O healthcheck do banco usa TCP para não considerar pronto o servidor temporário usado durante a inicialização dos SQLs.

```sh
docker compose ps -a
docker compose logs preparar-banco
docker compose logs -f app
```

Se a preparação falhar, o Compose não inicia uma nova instância da aplicação dependente. O log identifica a etapa e a causa. Essa dependência não interrompe uma aplicação que já esteja rodando e não é reavaliada em um simples `docker compose restart app` ou em reinícios automáticos pelo Docker.

## Execução sem Docker

Requisitos: Node.js, PostgreSQL acessível e as variáveis de conexão em `backend/.env` (modelo em `.env.example`).

```sh
npm run setup
npm run db:preparar -- --validar
npm run db:preparar
```

O modo `--validar` lê os dois catálogos e verifica as imagens sem acessar o banco. Sem argumento, o comando aplica as migrações e as importações. Em um banco vazio fora do Docker, execute antes `database/ddl/schema.sql`; a preparação exige as tabelas base e não recria o banco. O importador dos temas também cadastra o catálogo de `tbtema`.

Os comandos individuais `db:temas` e `db:questoes` continuam disponíveis.

## Volumes existentes e atualizações

O volume `pgdata` é preservado. As migrações são executadas na ordem 001, 002, 003 e 004; a 002 cria a tabela de progresso necessária à 004. Não reaplique o schema sobre um banco existente.

Para atualizar uma instalação já em uso, pare a aplicação antes da preparação:

```sh
docker compose stop app
docker compose up -d --build preparar-banco app
docker compose logs preparar-banco
docker compose ps -a
```

Se falhar, corrija a causa indicada no log e repita o comando de subida. Não apague o volume para repetir a carga.

Os materiais mantêm seus códigos e são atualizados pelo importador existente. Questões com o mesmo código e hash são reconhecidas; conteúdo diferente exige revisão e um novo código de versão. A preparação não habilita automaticamente `--vincular-imagens` nem reclassifica questões antigas. Registros manuais sem código de origem precisam de revisão para evitar duplicação semântica.

Cada migração e cada importador tem sua própria transação. Uma falha reverte a transação daquela etapa; etapas anteriores já concluídas permanecem gravadas. Por exemplo, se as questões falharem, os temas já importados permanecem no banco.

## Conteúdo validado nesta alteração

Os JSONs locais atuais resultam em:

| Conteúdo | Quantidade |
| --- | ---: |
| Temas | 12 |
| Introduções | 12 |
| Seções | 70 |
| Materiais (introduções + seções) | 82 |
| Questões importáveis | 48 (4 por tema) |
| Alternativas | 192 |
| Questões com imagem | 12 |

A quantidade de referência é **48 questões, exatamente quatro por tema, e 192 alternativas**. As 15 questões autorais já fazem parte desse total, junto a 33 questões provenientes de documentos. Consulte o [mapeamento atual](questoes/mapeamento-temas.md). Os registros do relatório de integração descrevem estados anteriores do projeto.

## Verificações realizadas

- `npm run db:preparar -- --validar`: catálogos e imagens válidos, sem acessar PostgreSQL.
- Cinco testes do novo comando passaram: validação sem banco, argumento inválido, estrutura ausente, interrupção após falha de migração e interrupção após falha nos temas.
- A sintaxe YAML, as dependências dos serviços, as credenciais de conexão compartilhadas e o comando de preparação foram conferidos.
- `npm test`: 13 testes passaram, 3 falharam e 8 foram ignorados. As três falhas estão em `importar-questoes.test.js`, que espera 56 questões, 224 alternativas e uma distribuição diferente dos JSONs atuais. O resultado esperado para o catálogo atual é 48 questões, 192 alternativas e quatro questões por tema. O ajuste dos testes permanece pendente; esta revisão altera somente a documentação.
- Os oito testes ignorados exigem PostgreSQL real e habilitação explícita.

O ambiente usado não dispõe de Docker nem dos executáveis PostgreSQL. A subida dos contêineres, as migrações reais, a repetição da carga em PostgreSQL e a atualização de um volume antigo continuam pendentes.

## Roteiro pendente com Docker

Execute com a porta 3000 livre. O nome de projeto `portal-validacao` usa um volume separado do projeto normal. Para testar a primeira criação, use um nome de projeto que ainda não tenha sido utilizado.

### Banco novo

```sh
docker compose config --quiet
docker compose -p portal-validacao up -d --build
docker compose -p portal-validacao ps -a
docker compose -p portal-validacao logs preparar-banco
docker compose -p portal-validacao exec db psql -U portal -d portal_certificacao -c "SELECT (SELECT count(*) FROM tbtema) AS temas, (SELECT count(*) FROM tbmaterial) AS materiais, (SELECT count(*) FROM tbquestao) AS questoes, (SELECT count(*) FROM tbalternativa) AS alternativas;"
```

Esperado nesse banco novo: preparação encerrada com código zero, aplicação em execução e contagens 12, 82, 48 e 192. Acesse a área de estudos e os exames para conferir a integração.

### Repetição no mesmo banco

```sh
docker compose -p portal-validacao stop app
docker compose -p portal-validacao run --rm --no-deps preparar-banco
```

Repita a consulta de contagens e compare os IDs dos registros antes e depois. A carga deve reconhecer 82 materiais e 48 questões existentes, sem novas questões ou alternativas. Verifique também que o progresso e as respostas previamente cadastrados continuam preservados. Depois:

```sh
docker compose -p portal-validacao up -d app
```

Esse cenário verifica a repetição na estrutura atual. Para validar a atualização de uma estrutura antiga, use uma cópia de teste do banco anterior às migrações e confira também a conversão de `subtitulos` para `secoes`.

### Falha da preparação

Crie um arquivo auxiliar `compose-falha.yml`:

```yaml
services:
  preparar-banco:
    command: ["node", "-e", "process.exit(1)"]
```

Em outro projeto de teste, execute:

```sh
docker compose -p portal-validacao-falha -f docker-compose.yml -f compose-falha.yml up -d --build
docker compose -p portal-validacao-falha -f docker-compose.yml -f compose-falha.yml ps -a
```

Esperado: comando de subida sinaliza erro, preparação encerra com código 1 e a aplicação não entra em execução. Esse cenário verifica o bloqueio pelo Compose; as falhas internas da preparação já são cobertas pelos testes unitários.

Ao encerrar os testes, use `docker compose -p portal-validacao down` e o equivalente com os dois arquivos para `portal-validacao-falha`. Os volumes são mantidos.
