#SPRINT 2

# 🎯 BorB - Plataforma de Estudos Scrum

> **Projeto Integrador - 1º Semestre / 2026-2**
> 
> **Curso:** Desenvolvimento de Software Multiplataforma — FATEC Jacareí
> 
> **Orientação:** Prof. Marcelo Augusto Sudo e Prof. Antonio Egydio São Thiago Graça

---

## 🏅 Descrição do Desafio

É comum que estudantes e profissionais iniciantes em TI encontrem dificuldades para fixar conceitos teóricos de metodologias ágeis (como Scrum e Kanban) e aplicá-los em cenários reais de desenvolvimento.

A falta de ferramentas práticas e interativas para mensurar o aprendizado gera uma lacuna no processo de formação. O **Portal de Certificação em Metodologias Ágeis** visa resolver esse problema oferecendo uma trilha de simulados randômicos e cronometrados, acompanhada de uma Área de Estudos completa com 12 temas fundamentais, validando o conhecimento adquirido por meio da emissão de um certificado digital autêntico.


---

## 📋 Backlog do Produto - SPRINT 2 .

| Rank | Prioridade | User Story | Story Points | Sprint | Requisito Relacionado | Status |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | Alta (2) | **US11 - Organizar questões por tema:** Como responsável pelo sistema, quero que as questões sejam organizadas por tema para manter a base de questões estruturada conforme a certificação. | 1 | 2 | RF06 / RP06 | Concluída |
| **2** | Alta (3) | **US12 - Estruturar questão da certificação:** Como responsável pelo sistema, quero que cada questão possua os elementos obrigatórios para que possa ser utilizada na certificação. | 2 | 2 | RF08 | Concluída |
| **3** | Alta (5) | **US13 - Sortear questão para o candidato:** Como candidato, quero receber uma questão sorteada aleatoriamente para cada tema para realizar a certificação conforme as regras da avaliação. | 2 | 2 | RF06 | Concluída |
| **4** | Alta (3) | **US14 - Armazenar alternativas e resposta correta:** Como responsável pelo sistema, quero armazenar alternativas e a resposta correta para cada questão. | 2 | 2 | RF08 / RP04 | Concluída |
| **5** | Alta (3) | **US15 - Visualizar temas da certificação:** Como candidato, quero visualizar os temas da certificação para acompanhar quais ainda preciso responder. | 2 | 2 | RF05 / RF21 | Concluída |
| **6** | Alta (5) | **US16 - Iniciar questão de um tema:** Como candidato, quero iniciar a questão de um tema pendente para avançar na certificação. | 2 | 2 | RF05 | Concluída |
| **7** | Alta (5) | **US17 - Responder questão da certificação:** Como candidato, quero selecionar e enviar uma alternativa para registrar minha resposta à questão. | 2 | 2 | RF08 | Concluída |
| **8** | Alta (3) | **US18 - Visualizar correção da questão:** Como candidato, quero visualizar a resposta correta após responder uma questão para saber qual era a alternativa correta. | 2 | 2 | RF09 | Concluída |
| **9** | Alta (3) | **US19 - Escolher continuidade da certificação:** Como candidato, quero decidir após cada questão se desejo continuar a certificação ou encerrar a sessão para poder realizá-la em momentos diferentes. | 3 | 2 | RF12 / RF13 | Concluída |
| **10** | Alta (5) | **US20 - Controlar tempo de resposta da questão:** Como candidato, quero visualizar o tempo restante para responder uma questão para saber quanto tempo tenho disponível. | 3 | 2 | RF10 | Concluída |
| **11** | Alta (5) | **US21 - Encerrar questão por tempo esgotado:** Como candidato, quero ser informado quando o tempo da questão terminar para saber que aquela tentativa foi encerrada. | 5 | 2 | RF11 | Concluída |
| **12** | Alta (8) | **US22 - Tratar interrupção durante uma questão:** Como sistema, quero encerrar uma questão quando ocorrer uma interrupção durante sua resolução para garantir que cada tema tenha apenas uma tentativa. | 8 | 2 | RF14 / RF15 | Concluída |
| **13** | Alta (5) | **US23 - Retomar certificação interrompida:** Como candidato, quero retomar uma certificação interrompida para continuar respondendo aos temas ainda pendentes. | 8 | 2 | RF13 | Concluída |
| **14** | Média (2) | **US43 - Reestruturação da tela de realização da questão:** Como candidato, quero uma tela de questão clara e organizada, com enunciado,imagem seleção de alternativas e confirmar minha resposta. | 2 | 2 | RF08, RNF01 | Concluída |
| **15** | Baixa (1) | **US44 - Elaborar diagramas de Classes, Casos de Uso e Sequência:** Como integrante da equipe, quero documentar o Portal de Certificação com diagramas UML para facilitar a compreensão de seus atores, sua estrutura e seus fluxos. | 2 | 2 | RNF06 | Concluída |
| **16** | Alta (8) | **US45 - Produzir o vídeo da Sprint 2:** Como professor, quero assistir um vídeo que mostre todas as funcionalidades entregues da sprint 2 na plataforma. | 8 | 2 | RNF05 | Concluída |

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

ABP-1-Portal-de-Certifcacao-Scrum/
├── backend/                        # API Node.js (Express) que também serve o front-end
│   ├── server.js                   # Ponto de entrada: sobe o servidor na porta configurada
│   ├── package.json                # Dependências e scripts do backend
│   ├── src/
│   │   ├── app.js                  # Configuração do Express: sessão, rotas, arquivos estáticos
│   │   ├── config/
│   │   │   ├── db.js               # Conexão com o PostgreSQL (pool)
│   │   │   └── sessao.js           # Sessão e cookie de autenticação
│   │   ├── controllers/
│   │   │   ├── authController.js         # Login, logout e usuário logado
│   │   │   ├── candidatoController.js    # Cadastro de candidato e validações
│   │   │   └── recuperacaoController.js  # Recuperação de senha
│   │   ├── middlewares/
│   │   │   └── autenticacao.js     # Proteção de rotas e páginas (menu) e checagem de JSON
│   │   ├── models/
│   │   │   ├── candidatoModel.js         # Acesso aos dados de candidatos
│   │   │   └── recuperacaoModel.js       # Acesso aos dados de recuperação de senha
│   │   ├── routes/
│   │   │   ├── auth.js             # /api/auth (login, logout, usuário)
│   │   │   ├── candidatos.js       # /api/candidatos (cadastro)
│   │   │   ├── recuperacao.js      # /api/auth/recuperacao
│   │   │   └── temas.js            # /temas (12 temas de estudo)
│   │   └── services/
│   │       ├── senha.js                  # Hash e verificação de senha
│   │       ├── codigoRecuperacao.js      # Geração e validação do código de recuperação
│   │       └── emailRecuperacao.js       # Envio do código (SMTP ou console, em desenvolvimento)
│   └── tests/                      # Testes automatizados (node --test)
│       ├── auth.test.js
│       ├── recuperacao.test.js
│       └── recuperacao.postgres.test.js  # Teste com PostgreSQL real (opcional)
│
├── frontend/                       # Interface em HTML, CSS e JavaScript puro
│   ├── pages/                      # Telas
│   │   ├── index.html              # Tela inicial
│   │   ├── cadastro.html, login.html
│   │   ├── menu.html               # Menu principal (exige login)
│   │   ├── temas.html              # Área de estudos: 12 temas
│   │   ├── exames.html, certificados.html, pop-up.html
│   │   └── recuperar_senha.html, verificar_codigo.html, redefinir_senha.html
│   ├── css/                        # Estilos de cada tela e componente
│   ├── js/                         # Scripts de cadastro, formulário, menu, temas, logout e recuperação
│   └── assets/                     # Reservado para ícones e imagens do front-end
│
├── database/                       # Banco de dados PostgreSQL
│   ├── ddl/schema.sql              # Criação das tabelas
│   ├── dml/seed.sql                # Carga inicial: os 12 temas de estudo
│   ├── temas/                      # Conteúdo estruturado dos 12 temas
│   ├── migrations/                 # Atualizações para bancos já existentes
│   │   ├── 001_recuperacao_senha.sql
│   │   ├── 002_progresso_estudos.sql
│   │   ├── 003_carga_questoes.sql
│   │   ├── 004_conteudo_temas.sql
│   │   ├── 005_alternativas_questao.sql
│   │   └── 006_sinal_questao.sql
│   └── diagrams/                   # Reservado para diagramas do banco
│
├── imagens/                        # Logos do BorB, modelos conceitual e lógico, imagens das questões (temas 1 a 3)
├── docs/                           # Documentação técnica
│   ├── login.md                    # Fluxo de autenticação
│   ├── recuperacao-senha.md        # Fluxo de recuperação de senha
│   └── api/, installation/, requirements/   # Reservadas para as próximas sprints
│
├── Dockerfile                      # Imagem da aplicação (Node.js 22)
├── docker-compose.yml              # Orquestração: PostgreSQL + preparação do banco + app
├── .dockerignore                   # Arquivos excluídos da imagem
├── .env.example                    # Modelo de variáveis de ambiente (execução fora do Docker)
├── package.json, package-lock.json # Metadados npm da raiz do repositório
└── README.md                       # Documentação principal


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

Não é preciso instalar Node.js nem PostgreSQL, nem criar arquivos `.env`: o `docker-compose.yml` já traz toda a configuração.

### 🚀 Executando a Aplicação

1. **Clonar o Repositório:**
```bash
git clone https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum.git
cd ABP-1-Portal-de-Certifcacao-Scrum
```

2. **Subir os Contêineres (Docker Compose):**
```bash
docker compose up -d --build
```
O serviço `db` inicia o PostgreSQL 16; em um volume novo, executa o schema e o seed. Depois, `preparar-banco` aplica as migrações e importa os materiais e questões dos JSONs. A `app` (API Node.js que também serve o front-end) inicia somente após o sucesso da preparação. É esperado que `preparar-banco` apareça como `Exited (0)`. A primeira execução baixa as imagens e pode levar alguns minutos.

Para atualizar uma instalação em uso, pare a aplicação antes de preparar o banco. Consulte os [comandos de preparação, atualização e validação](docs/preparacao-banco.md).

3. **Acessar a Aplicação:**
Abra o navegador em `http://localhost:3000/pages/index.html`

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
* A recuperação de senha roda em modo `console`: sem servidor SMTP, o código de verificação é impresso no log do serviço `app`.
* Se a porta 3000 já estiver em uso, altere o mapeamento `ports` do serviço `app` no `docker-compose.yml` (por exemplo, `"3001:3000"`).
* Os segredos do `docker-compose.yml` servem apenas para demonstração local. Para usar outros valores, defina `SESSION_SECRET` e `RECUPERACAO_SECRET` (32 caracteres ou mais) no ambiente.

---

## 📂 Link para Pasta de Documentação 

Toda a documentação complementar, checklists, manuais e critérios de qualidade do projeto estão centralizados em nossa pasta oficial:
👉 https://1drv.ms/w/c/e8fba6c9b965020d/IQAEdC8AzIp_QbojhheMglW7AZ6KTPoo0g9ohUsBH44cuIs

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
