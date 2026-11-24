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
│   └── diagrams/                         # Diagramas do banco
├── docs/                                 # Guias técnicos e documentação funcional
│   ├── recuperacao-senha.md              # Fluxo, segurança, configuração e testes
│   ├── login.md, cadastro.md              # Autenticação e cadastro
│   ├── preparacao-banco.md                # Preparação e atualização do banco
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

## 🔖 SPRINT 2 – Desenvolvimento do Núcleo da Certificação e Área de Estudos
**Período:** 23/10/2026 a 05/11/2026

### 🏃 DoR da Sprint 2 (Definition of Ready)
- [x] **Modelagem de Dados Aprovada:** Modelagem do banco de dados validada (PostgreSQL) para suportar os 12 temas, 48 questões (4 por tema), alternativas, imagens ilustrativas, tentativas únicas por tema e histórico de interrupções.
- [x] **Carga e Conteúdo Homologados:** Definição final dos 12 temas da certificação e estruturação dos arquivos JSON/scripts de migração contendo o conteúdo didático e as questões com imagens.
- [x] **Protótipos de Alta Fidelidade (Figma):** Telas aprovadas pela equipe para a Área de Estudos, Fluxo da Prova (com cronômetro, enunciado, imagem e alternativas conforme a US43) e fluxo de interrupção/retomada.
- [x] **Especificação de Regras de Negócio:** Critérios de aceite detalhados para o sorteio randômico de questões (US13), controle do cronômetro regressivo (US20), encerramento por tempo esgotado (US21) e tratamento de interrupções de sessão (US22/US23).

### 🏆 DoD da Sprint 2 (Definition of Done)
- [x] **Banco de Dados e Povoamento:** Schema DDL e seeds DML executados via Docker Compose, com carga íntegra dos 12 temas e das 48 questões (4 por tema) e migrações (`001` a `005`) testadas e integradas.
- [x] **Núcleo de Back-end (Motor do Simulado & Regras):** Endpoints implementados em Node.js para sorteio aleatório (US13), tentativa única (US16, US19), controle de cronômetro, tempo esgotado (US21) e tratamento/retomada de interrupções (US22, US23).
- [x] **Área de Estudos & Interface (Front-end):** Telas desenvolvidas em HTML5, CSS3 e JavaScript puro, estruturadas nos 12 temas (US11, US15) e com reestruturação da tela de prova (US43) para enunciado, imagens e alternativas.
- [x] **Feedback, Diagramas UML e Entrega:** Exibição da resposta correta após submissão (US18), diagramas UML de Classes, Casos de Uso e Sequência documentados (US44), e vídeo de apresentação da Sprint 2 publicado no YouTube (US45).


## Carga de questões

Consulte [as instruções de importação](docs/carga-questoes.md), [o mapeamento curricular](docs/questoes/mapeamento-temas.md) e [o relatório de integração](docs/relatorio-integracao-2026-11-02.md).

## Carga dos temas

Consulte [as instruções de importação dos conteúdos de estudo](docs/carga-temas.md). Os arquivos JSON em `database/temas` substituem o antigo conteúdo HTML centralizado no backend.
