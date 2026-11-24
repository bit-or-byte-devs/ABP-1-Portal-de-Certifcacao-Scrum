SPRINT 3

# 🎯 BorB - Plataforma de Estudos Scrum

> **Projeto Integrador - 1º Semestre / 2026-2**
> 
> **Curso:** Desenvolvimento de Software Multiplataforma — FATEC Jacareí
> 
> **Orientação:** Prof. Marcelo Augusto Sudo e Prof. Antonio Egydio São Thiago Graça

---

## 🏅 Descrição do Desafio

É comum que estudantes e profissionais iniciantes em TI encontrem dificuldades para fixar conceitos teóricos de metodologias ágeis (como Scrum e Kanban) e aplicá-los em cenários reais de desenvolvimento.

A falta de ferramentas práticas e interativas para mensurar o aprendizado gera uma lacuna no processo de formação. O **BorB - Plataforma de Estudos Scrum** visa resolver esse problema oferecendo uma trilha de simulados randômicos e cronometrados, acompanhada de uma Área de Estudos completa com 12 temas fundamentais, validando o conhecimento adquirido por meio da emissão de um certificado digital autêntico.


---

## 📋 Backlog do Produto - SPRINT 3

| Rank | Prioridade | User Story | Story Points | Sprint | Requisito Relacionado | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | Alta (3) | **US24 - Atualizar e preservar o progresso da certificação:** Como candidato, quero acompanhar estados atualizados da minha certificação para saber quais temas concluí e quais permanecem pendentes. | 1 | 3 | RF21 / RP09 | Concluída |
| **2** | Alta (5) | **US25 - Registrar histórico das respostas:** Como candidato, quero que as tentativas da certificação sejam registradas de forma durável para manter um histórico fiel do que realizei. | 2 | 3 | RF20 / RP04 | Concluída |
| **3** | Média (3) | **US26 - Consultar histórico da certificação:** Como candidato, quero consultar meu histórico para visualizar as informações das questões que já realizei. | 2 | 3 | RF20 | Concluída |
| **4** | Alta (5) | **US27 - Calcular resultado final da certificação:** Como candidato, quero que meu resultado seja calculado automaticamente após concluir todos os temas para conhecer meu desempenho na certificação. | 2 | 3 | RF16 | Concluída |
| **5** | Alta (3) | **US28 - Visualizar resultado da certificação:** Como candidato, quero visualizar meu resultado ao concluir a certificação para conhecer meu desempenho. | 2 | 3 | RF16 / RF17 | Concluída |
| **6** | Alta (3) | **US29 - Verificar aprovação para certificação:** Como candidato, quero iniciar a questão de um tema pendente para avançar na certificação. | 2 | 3 | RF17 / RF18 | Concluída |
| **7** | Alta (8) | **US30 - Emitir certificado eletrônico:** Como candidato aprovado, quero receber meu certificado eletrônico para comprovar minha aprovação na certificação. | 2 | 3 | RF17 / RF18 | Concluída |
| **8** | Alta (5) | **US31 - Gerar QR Code para validação do certificado:** Como candidato aprovado, quero que meu certificado possua um QR Code para permitir a validação de sua autenticidade. | 2 | 3 | RF18 / RP08 | Concluída |
| **9** | Alta (3) | **US32 - Acessar validação pública do certificado:** Como pessoa interessada em verificar um certificado, quero acessar sua página de validação através do QR Code para verificar sua autenticidade. | 3 | 3 | RF19 / RP08 | Concluída |
| **10** | Alta (5) | **US33 - Validar autenticidade do certificado:** Como pessoa interessada em verificar um certificado, quero saber se o certificado consultado é autêntico para confirmar sua validade. | 3 | 3 | RF19 | Concluída |
| **11** | Alta (5) | **US34 - Garantir responsividade da interface:** Como candidato, quero utilizar o portal em diferentes tamanhos de tela para conseguir acessar suas funcionalidades também em dispositivos móveis. | 5 | 3 | RNF01 | Concluída |
| **12** | Alta (8) | **US35 - Garantir segurança dos dados e resultados:** Como responsável pelo sistema, quero proteger os dados e resultados da certificação para evitar acessos e alterações indevidas. | 8 | 3 | RNF03 / RNF04 | Concluída |
| **13** | Alta (5) | **US38 - Executar aplicação com Docker:** Como equipe de desenvolvimento, queremos executar o portal utilizando containers para padronizar o ambiente da aplicação. | 8 | 3 | RNF07 / RP05 | Concluída |
| **14** | Média (2) | **US39 - Documentar a aplicação:** Como equipe de desenvolvimento, queremos documentar a aplicação para permitir compreender, instalar e utilizar tecnicamente o projeto. | 2 | 3 | RNF06 | Concluída |
| **15** | Alta (8) | **Task - Finalizar função de recuperação de senha:** Finalizar a função de recuperação de senha existente no Portal de Certificação Scrum, considerando as pendências identificadas desde a última alteração da feature. | 2 | 3 | RF03 / RF04 |  Concluída |
| **16** | Alta (3) | **Task-002 - Criar as páginas de Política de Privacidade (LGPD) e Termos de Uso:** Criar as páginas públicas de Política de Privacidade (LGPD) e Termos de Uso do Portal de Certificação Scrum e ligá-las ao cadastro e ao rodapé do menu.| 2 | 3 | RF03 / RF04 | Concluída |
---

## 📈 Cronograma de Evolução do Projeto

```text
28/09/2026               22/10/2026               05/11/2026               25/11/2026
    |--- SPRINT 1 (3 semanas) ---|--- SPRINT 2 (2 semanas) ---|--- SPRINT 3 (3 semanas) ---|
    |  • Infraestrutura Docker   |  • Motor do Simulado       |  • Emissão de Certificados |
    |  • Banco PostgreSQL (DDL)  |  • Cronômetro & Random     |  • Validação via QR Code   |
    |  • Protótipos e Login/CAD  |  • Cálculo de Desempenho    |  • Refinamento Final / UX  |

```

---

## 🗓️ Tabela Descritiva das Sprints
| Sprint | Período da Sprint | Documentação da Sprint | Vídeo do Incremento (YouTube) | Status |
| --- | --- | --- | --- | --- |
| 🔖 **Sprint 1** | 28/09/2026 - 22/10/2026 | [Documentação Sprint 1](https://1drv.ms/w/c/e8fba6c9b965020d/IQDOWyoHSerXRZCcQcG9aSZqAfishYPsgG40xmFV8EMGJ0I) | [Vídeo de Apresentação 1](https://youtu.be/FVt_IMNGXu8) | Concluído |
| 🔖 **Sprint 2** | 23/10/2026 - 05/11/2026 | [Documentação Sprint 2](https://1drv.ms/w/c/e8fba6c9b965020d/IQAEdC8AzIp_QbojhheMglW7AZ6KTPoo0g9ohUsBH44cuIs) | [Vídeo de Apresentação 2](https://youtu.be/K_Tbho3OMi8?is=4hczwcMjw8u2Ketj) | Concluído |
| 🔖 **Sprint 3** | 06/11/2026 - 25/11/2026 | [Documentação Sprint 2](https://1drv.ms/w/c/e8fba6c9b965020d/IQAEdC8AzIp_QbojhheMglW7AZ6KTPoo0g9ohUsBH44cuIs) | [Vídeo de Apresentação 2](https://youtu.be/K_Tbho3OMi8?is=4hczwcMjw8u2Ketj) | Concluído |


## 💻 Tecnologias Utilizadas

* **Front-End:** HTML5, CSS3, JavaScript (Sem Frameworks)
* **Back-End:** Node.js
* **Banco de Dados:** PostgreSQL
* **DevOps & Containers:** Docker, Docker Compose
* **Design & Prototipagem:** Figma
* **IDE & Versionamento:** VS Code, Git / GitHub

---

## 🏗️ Estrutura do Projeto

```text
ABP-1-Portal-de-Certifcacao-Scrum/
├── backend/                              # API Express, regras de negócio e testes
│   ├── server.js                         # Inicialização do servidor
│   ├── package.json                      # Scripts e dependências do backend
│   ├── scripts/                          # Preparação do banco e importação de conteúdos
│   ├── src/
│   │   ├── app.js                        # Express, sessão, rotas e arquivos estáticos
│   │   ├── config/                       # Conexão PostgreSQL e configuração de sessão
│   │   ├── controllers/                  # Entrada HTTP de autenticação, cadastro e recuperação
│   │   │   └── recuperacaoController.js  # Solicitação, verificação e redefinição
│   │   ├── middlewares/                  # Autenticação e validação de JSON
│   │   ├── models/                       # Acesso e transações do banco
│   │   │   └── recuperacaoModel.js       # Pedidos, limites e consumo do código
│   │   ├── routes/                       # Rotas da API e das áreas do portal
│   │   │   └── recuperacao.js            # /api/auth/recuperacao
│   │   └── services/                     # Serviços de domínio
│   │       ├── codigoRecuperacao.js      # Código, HMAC, validade e limites de desenvolvimento
│   │       ├── emailRecuperacao.js       # SMTP e console de desenvolvimento
│   │       └── senha.js                  # Hash e verificação de senhas
│   └── tests/                            # Testes unitários, HTTP, SMTP simulado e PostgreSQL isolado
│       ├── recuperacao.test.js
│       ├── recuperacao.postgres.test.js
│       └── transporte-email.test.js
├── frontend/                             # Interface HTML, CSS e JavaScript puro
│   ├── pages/                            # Telas públicas e autenticadas
│   │   └── recuperar_senha.html          # Página única: e-mail, código e nova senha
│   ├── css/
│   │   └── recuperarsenha.css            # Estilos da recuperação
│   ├── js/
│   │   └── recuperar-senha.js            # Etapas, validações, reenvio e chamadas à API
│   ├── assets/                           # Ícones e imagens de interface
│   ├── imagens/                          # Imagens didáticas dos temas
│   └── pdf/                              # Materiais em PDF para estudo
├── database/                             # Estrutura e conteúdo PostgreSQL
│   ├── ddl/schema.sql                    # Esquema inicial
│   ├── dml/seed.sql                      # Dados iniciais
│   ├── migrations/                       # Evoluções não destrutivas do banco
│   │   ├── 001_recuperacao_senha.sql     # Pedidos de recuperação e versão de sessão
│   │   └── 008_email_unico.sql           # Unicidade de e-mail sem diferenciar maiúsculas
│   ├── temas/                            # Conteúdo estruturado dos temas
│   ├── questoes/                         # Banco de questões em JSON
│   ├── flashcards/                       # Catálogo de 120 cartões de estudo (10 por tema)
│   └── diagrams/                         # Diagramas do banco
├── docs/                                 # Guias técnicos e documentação funcional
│   ├── recuperacao-senha.md              # Fluxo, segurança, configuração e testes
│   ├── login.md, cadastro.md              # Autenticação e cadastro
│   ├── preparacao-banco.md                # Preparação e atualização do banco
│   ├── flashcards.md                      # Flashcards: regra Leitner, API, tela e testes
│   └── questoes/                          # Mapeamentos e materiais das questões
├── imagens/                              # Logos e imagens institucionais do projeto
├── Dockerfile                            # Imagem da aplicação
├── docker-compose.yml                    # PostgreSQL, preparação do banco e aplicação
├── .env.example                          # Nomes das variáveis de ambiente, sem uso para segredos reais
└── README.md                             # Documentação principal
```


### 🧭 Como as partes se conectam

* O **backend** serve a API em `/api/...` e entrega o **front-end** na mesma origem (`/pages/...`), por isso o navegador chama a API sem configuração extra.
* O **banco** é criado pelos scripts de `database/ddl` e `database/dml`, que o Docker executa automaticamente na primeira subida.
* O serviço **preparar-banco** valida os conteúdos, aplica as migrações e importa temas e questões antes de iniciar a aplicação.
* O **Docker Compose** coordena os três serviços (`db`, `preparar-banco` e `app`): basta executar
docker compose up -d --build


---

## 🧰 Como Executar, Usar e Testar o Projeto

### 🛠️ Pré-requisitos

* [Git](https://git-scm.com) instalado.
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) em execução (inclui o Docker Compose).

Não é preciso instalar Node.js nem PostgreSQL. O único arquivo de configuração é o `.env`, criado a partir do `.env.example` no passo 2. Ele nunca é versionado (está no `.gitignore`).

### 🚀 Executando a Aplicação

1. **Clonar o Repositório:**
```bash
git clone https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum.git
cd ABP-1-Portal-de-Certifcacao-Scrum
```

2. **Criar o `.env` e subir os Contêineres (Docker Compose):**
```bash
cp .env.example .env              # Linux/macOS
# Copy-Item .env.example .env     # Windows (PowerShell)
docker compose up -d --build
```
O `.env` copiado já vem com `RECUPERACAO_MODO=console`: o código de recuperação de senha aparece no log da `app` e nenhum e-mail é enviado. Para o envio real pelo Gmail da equipe, preencha as variáveis `SMTP_*` no seu `.env` (veja [Recuperação de senha](docs/recuperacao-senha.md)).
O serviço `db` inicia o PostgreSQL 16; em um volume novo, executa o schema e o seed. Depois, `preparar-banco` aplica as migrações e importa os materiais e questões dos JSONs. A `app` (API Node.js que também serve o front-end) inicia somente após o sucesso da preparação. É esperado que `preparar-banco` apareça como `Exited (0)`. A primeira execução baixa as imagens e pode levar alguns minutos.

Para atualizar uma instalação em uso, pare a aplicação antes de preparar o banco. Consulte os [comandos de preparação, atualização e validação](docs/preparacao-banco.md).

3. **Acessar a Aplicação:**
Abra o navegador em `http://localhost:3000/pages/index.html`

### 📱 Validar certificados pelo celular na rede local

No Linux, use o script para subir ou atualizar o portal no Docker:

```bash
./iniciar-rede-local.sh
# Se o Docker exigir sudo:
sudo ./iniciar-rede-local.sh
# Se uma VPN selecionar a interface errada, informe o IPv4 da rede do celular:
./iniciar-rede-local.sh 192.168.1.42
```

O script consulta o IPv4 da rota do computador a cada execução e configura a URL do QR Code com esse IP e a porta `APP_PORT` (3000 por padrão). Use o mesmo script depois de trocar de rede. O comando padrão `docker compose up -d --build` usa a `PUBLIC_BASE_URL` configurada ou `http://localhost:3000`.

No Windows, inicie o Docker Desktop e execute, na raiz do repositório:

```powershell
.\iniciar-rede-local.ps1
# Quando houver vários endereços ou uma VPN, informe o IPv4 da rede usada pelo celular:
.\iniciar-rede-local.ps1 -LanIp 192.168.1.42
```

O script usa o IPv4 da interface física ativa quando há uma única opção. Com o IP explícito, ele verifica se o endereço pertence ao próprio computador.

Abra o portal no computador e recarregue a página do certificado. O QR aponta para o endereço mostrado pelo script, inclusive no PDF baixado nesse modo. Escaneie o QR com o celular conectado à mesma rede. O link abre a página de validação com o código preenchido.

Se trocar de rede ou o IP mudar, execute o script novamente e recarregue a página. Baixe um novo PDF para atualizar o QR nele. O código de validação do certificado permanece o mesmo.

Se o link não abrir no celular, tente o endereço mostrado pelo script no navegador do aparelho. Confira se a porta TCP 3000 está acessível no perfil **Privado** do Firewall do Windows e se o Wi-Fi permite comunicação entre dispositivos. Redes de convidados podem isolar os aparelhos. Use esse modo em uma rede local de confiança.

### 🔧 Comandos úteis

```bash
docker compose ps -a           # conferir os três serviços, incluindo a preparação encerrada
docker compose logs preparar-banco # acompanhar migrações e importações
docker compose logs -f app     # acompanhar o log (os códigos de recuperação de senha aparecem aqui)
docker compose down            # parar os serviços (os dados do banco são mantidos)

```

Observações:
* O volume do banco é mantido entre execuções. Não o remova para repetir a carga.
* Os JSONs atuais contêm 12 temas, 82 materiais e 48 questões, exatamente quatro por tema, com 192 alternativas. Consulte a [distribuição do catálogo](docs/questoes/mapeamento-temas.md) e as [pendências dos testes](docs/preparacao-banco.md).
* Com `RECUPERACAO_MODO=console` (somente em `NODE_ENV=development`), o código de verificação é impresso no log do serviço `app`. Sem esse modo e sem as variáveis `SMTP_*`, o portal sobe normalmente, mas o log avisa quais variáveis faltam e a recuperação não envia códigos.
* Se a porta 3000 já estiver em uso, defina `APP_PORT` no `.env` (por exemplo, `APP_PORT=3002`).
* Os segredos do `docker-compose.yml` servem apenas para demonstração local. Para usar outros valores, defina `SESSION_SECRET` e `RECUPERACAO_SECRET` (32 caracteres ou mais) no `.env`.

> ⚠️ **Já tem um `.env` antigo?** A variável `SMTP_PASSWORD` foi renomeada para **`SMTP_PASS`**. Renomeie a linha no seu `.env` (e no `backend/.env`, se usar `npm start`) e acrescente `RECUPERACAO_MODO` e as demais variáveis novas do `.env.example`. Com o nome antigo, o log da `app` acusa `SMTP_PASS` ausente e nenhum código é enviado.

---

## 📂 Link para Pasta de Documentação 

Toda a documentação complementar, checklists, manuais e critérios de qualidade do projeto estão centralizados em nossa pasta oficial:
👉 https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/blob/main/docs-sprint-1/Sprint%203%20-%20Bit%20or%20Byte.pdf

Para acessar a pasta com a documentação das questões do exame:
👉 https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/tree/develop/docs/questoes/questoes-pdf

Para acessar o documento oficial dos 12 temas:
👉 https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/blob/develop/docs/temasdeestudos.pdf

Para imagens complementares como modelo conceitual, lógico, e Diagramas de Classe, Casos de Uso e Sequência, segue o link para a pasta do GitHub:
👉 https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum/tree/develop/docs-sprint-1

---

## 👥 Equipe **[Bit or Byte]**

| Foto | Nome Completo | Papel no Scrum | GitHub | LinkedIn |
| --- | --- | --- | --- | --- |
|  | **Matheus Oliveira Dantas de Souza** | Product Owner | https://github.com/Matheus7souza | [LinkedIn](https://www.linkedin.com/in/matheus-dantas-souza) |
|  | **Sarah Cristiny de Souza Mendes** | Scrum Master | https://github.com/sarahcris152 | [LinkedIn](https://www.linkedin.com/in/sarah-cristiny-de-souza-mendes-74aa881b7) |
|  | **João Vitor Maximiano de Carvalho** | Desenvolvedor | https://github.com/JoaoCbca | [LinkedIn](https://www.linkedin.com/in/joão-vítor-maximiano-2b7356309) |
|  | **Luiz Felipe Nogueira** | Desenvolvedor | https://github.com/luiz274 | [LinkedIn](https://www.linkedin.com/in/luiz-felipe-nogueira-bb2430270) 
|  | **Nikolas Gabriel Alves de Araujo** | Desenvolvedor | https://github.com/NikoRamid | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
|  | **Pedro Lucas Matias** | Desenvolvedor | https://github.com/Pedrojscx | [LinkedIn](https://www.linkedin.com/in/pedrolmatias) |
| | **Ryan Cesar Candido Alves** | Desenvolvedor | https://github.com/ryancesar22 | [LinkedIn](https://www.linkedin.com/in/ryan-cesar-candido-alves-814887231) |
|  | **Willian de Paula Barreto** | Desenvolvedor | https://github.com/will1907 | [LinkedIn](https://www.linkedin.com/in/willian-barreto-183aa2445) |

---

# 🚀 Sprint 3 - Documentação do Incremento
**Período da Sprint 3:** 06/11/2026 a 25/11/2026
---

## 📋 DoR da Sprint 3 (Definition of Ready)
* **Protótipos de Alta Fidelidade (Figma) Aprovados:** Telas finais prototipadas e navegáveis para o cálculo/resultado final da certificação, visualização/download do certificado eletrônico, página pública de validação via QR Code e consulta ao histórico detalhado da avaliação (atendendo aos requisitos **RF16** a **RF20** e dando continuidade ao fluxo das Sprints anteriores).
* **Especificação das Regras de Cálculo, Emissão e Segurança:** Critérios de aceite detalhados para o cálculo automático da nota no back-end (impedindo manipulação pelo front-end — **RNF04**), regra de corte para emissão do certificado ($\ge 65\%$ de aproveitamento — **RF17* e geração da URL/hash único para o QR Code **RP08*
* **Modelagem e *Constraints* de Banco Homologadas:** Definição das restrições nativas (*constraints*) no PostgreSQL (obrigando exatamente 4 alternativas e 1 resposta correta por questão) e estruturação final das tabelas de histórico e certificados (`tbcertificado` e `tbresposta`), incorporando o plano de ação da Sprint 2.
* **Automação de Carga Inicial (*Seeds* Docker) Especificada:** Mapeamento dos scripts DML e arquivos JSON dos 12 temas e 48 questões para execução automatizada na inicialização do `docker compose up`, resolvendo o débito técnico identificado na Sprint 2.
* **Histórias de Usuário Refinadas (US24+):** User Stories fatiadas em subtarefas claras no GitHub Projects desde o dia 0, com estimativas definidas para evitar sobrecarga na reta final (lição aprendida nas Sprints 1 e 2).

---

## ✅ DoD da Sprint 3 (Definition of Done)
* **Cálculo de Desempenho e Emissão Automática de Certificado:** Back-end em Node.js calculando automaticamente a nota final e o percentual de acertos de forma segura (**RF16**, **RNF04**) e emitindo o certificado eletrônico apenas para candidatos com aproveitamento $\ge 65\%$, contendo todos os dados obrigatórios (nome completo, CPF, e-mail, data/hora de emissão, nota final, percentual e QR Code — **RF17**, **RF18**).
* **Validação Pública via QR Code Funcional:** Página pública acessível sem necessidade de login (via leitura do QR Code ou código de verificação), validando a autenticidade do certificado diretamente no banco de dados (**RF19**, **RP08**).
* **Histórico Completo da Certificação:** Funcionalidade implementada permitindo ao candidato consultar todas as avaliações realizadas (independentemente de aprovação), exibindo temas respondidos, questão sorteada, resposta escolhida, resposta correta e data/horário de cada resposta (**RF20**).
* **Banco de Dados Blindado e Ambiente 100% Automatizado (Docker):** PostgreSQL operando com *constraints* de integridade ativas (**RP02**) e ambiente orquestrado via `docker compose up -d --build` subindo com esquema, 12 temas, 48 questões e imagens populados automaticamente sem intervenção manual (**RNF07**, **RP05**, **RP06**).
* **Interface Responsiva em Tecnologias Nativas e Conformidade LGPD:** Todas as telas novas e existentes desenvolvidas exclusivamente em HTML5, CSS3 e JavaScript puro (**RP01**), responsivas para dispositivos móveis (**RNF01**) e com armazenamento seguro de dados pessoais em conformidade com a LGPD (**RNF03**).
* **Versionamento, Documentação Final e Entrega MVP:** Merges diários consolidados na branch `develop` e integração final aprovada pelo PO na `main` (**RNF05**), acompanhados da documentação técnica completa atualizada (`README.md`, modelo de dados, instruções de instalação, documentação de todos os endpoints da API, descrição das funcionalidades — **RNF06**) e apresentação final do MVP funcional pronta para **26/11/2026** (**RP09**).


## Carga de questões

Consulte [as instruções de importação](docs/carga-questoes.md), [o mapeamento curricular](docs/questoes/mapeamento-temas.md) e [o relatório de integração](docs/relatorio-integracao-2026-11-02.md).

## Carga dos temas

Consulte [as instruções de importação dos conteúdos de estudo](docs/carga-temas.md). Os arquivos JSON em `database/temas` substituem o antigo conteúdo HTML centralizado no backend.
## Flashcards
Os flashcards são a revisão ativa do candidato antes do exame: 120 cartões (10 por tema), com repetição espaçada pelo método de Leitner em 3 caixas e progresso individual. A tela fica em `frontend/pages/flashcards.html`, com atalho no menu e na tela de estudos. Consulte [a documentação da funcionalidade](docs/flashcards.md), [as instruções de carga do catálogo](docs/carga-flashcards.md) e [o roteiro de homologação](docs/homologacao-task-003.md).
