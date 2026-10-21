#SPRINT 1 

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

## 📋 Backlog do Produto - SPRINT 1

| Rank | Prioridade | User Story | Story Points | Sprint | Requisito Relacionado | Status |
| --- | --- | --- | --- | --- | --- | --- |
| **1** | Alta (1) | **US03 - Acessar cadastro:** Como candidato, quero acessar a tela de cadastro para iniciar o registro. | 1 | 1 | RF03 | Concluído |
| **2** | Alta (2) | **US01 - Visualizar informações:** Como candidato, quero ler as regras da certificação antes de iniciar. | 2 | 1 | RF01 | 🛠️ Em Progresso |
| **3** | Alta (2) | **US05 - Ação pós-cadastro:** Como candidato, quero escolher entre ir ao menu ou iniciar a prova. | 2 | 1 | RF01 | Concluído |
| **4** | Alta (2) | **US06 - Acessar Menu Principal:** Como candidato, quero navegar pelo menu após autenticado. | 2 | 1 | RF01 | Concluído |
| **5** | Alta (2) | **US07 - Navegar entre áreas:** Como candidato, quero alternar entre as sessões do portal. | 2 | 1 | RF01 | Concluído |
| **6** | Alta (2) | **US08 - Visualizar temas:** Como candidato, quero ver os 12 temas disponíveis para estudo. | 2 | 1 | RF08 | Concluído |
| **7** | Alta (2) | **US10 - Navegar no conteúdo:** Como candidato, quero alternar entre os temas de estudo livremente. | 2 | 1 | RF08 | 🛠️ Em Progresso |
| **8** | Alta (2) | **US41 - Pesquisar 12 temas** Como candidato, quero ter acesso aos conteúdos sobre os 12 temas. | 2 | 1 | RF05 | Concluído |
| **9** | Alta (3) | **US02 - Realizar login:** Como candidato, quero autenticar com CPF e senha para acessar o portal. | 3 | 1 | RF04 | Concluído |
| **10** | Alta (3) | **US09 - Acessar conteúdo de estudo:** Como candidato, quero ler o material didático de um tema. | 3 | 1 | RF08 | 🛠️ Em Progresso |
| **11** | Alta (5) | **US04 - Cadastrar candidato:** Como candidato, quero registrar meus dados com validação de CPF único. | 5 | 1 | RF03 | Concluído |
| **12** | Alta (8) | **US36 - Banco PostgreSQL:** Como equipe, queremos persistir os dados da aplicação no PostgreSQL. | 8 | 1 | RP02 | Concluído |
| **13** | Alta (8) | **US37 - Arquitetura Web:** Como equipe, queremos conectar Front-End, Back-End e Banco de Dados. | 8 | 1 | RP01 / RP05 | Concluído |
| **14** | Alta (8) | **US40 - Protótipo Figma:** Como equipe, queremos visualizar o design de todas as telas em um protótipo no Figma.| 8 | 1 | RF01 / RF07 | Concluído |
| **15** | Alta (2) | **US41 - Pesquisa dos temas:** Como candidato, quero ter acesso a conteúdos pesquisados, confiáveis e organizados sobre os 12 temas previstos, para estudar os conceitos antes de realizar a avaliação.| 2 | 1 | RF08 | Concluído |
| **16** | Alta (8) | **US42 - Recuperar senha:** Como candidato cadastrado que esqueceu sua senha, quero redefinir minha senha por meio do e-mail cadastrado para recuperar o acesso ao Portal de Certificação Scrum.| 8 | 1 | RF03 /  RF04 | Concluído |

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
| 🔖 **Sprint 1** | 28/09/2026 - 22/10/2026 | [Documentação Sprint 1]  https://1drv.ms/w/c/e8fba6c9b965020d/IQDOWyoHSerXRZCcQcG9aSZqAfishYPsgG40xmFV8EMGJ0I | [Vídeo do Incremento 1](https://www.google.com/search?q=https://youtube.com) | 🛠️ Em Andamento |

---

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
Portal-Certificacao-Agiles/
├── docs/                       # Pasta de Documentação do Projeto
│   ├── DoR-DoD.md             # Definições de DoR e DoD por Sprint
│   ├── manual-usuario.md      # Manual do Usuário
│   └── checklist.md           # Checklist de Validação
├── src/
│   ├── backend/               # Código-fonte da API Node.js
│   ├── frontend/              # Interface HTML/CSS/JS puro
│   └── database/              # Scripts DDL/DML do PostgreSQL
├── docker-compose.yml         # Orquestração dos serviços
└── README.md                  # Documentação Principal

```

---

## 🧰 Como Executar, Usar e Testar o Projeto

### 🛠️ Pré-requisitos

* [Git](https://git-scm.com) instalado.
* [Docker Desktop](https://www.google.com/search?q=https://www.docker.com/) em execução.

### 🚀 Executando a Aplicação

1. **Clonar o Repositório:**
```bash
git clone [https://github.com/seu-usuario/Portal-Certificacao-Agiles.git](https://github.com/bit-or-byte-devs/ABP-1-Portal-de-Certifcacao-Scrum )
cd ABP-1-Portal-de-Certifcacao-Scru

```


2. **Subir os Contêineres (Docker Compose):**
```bash
docker-compose up -d --build

```


3. **Acessar a Aplicação:**
Abra o navegador no endereço: `http://localhost:3000`

---

## 📂 Link para Pasta de Documentação

Toda a documentação complementar, checklists, manuais e critérios de qualidade do projeto estão centralizados em nossa pasta oficial:
👉 https://1drv.ms/w/c/e8fba6c9b965020d/IQDOWyoHSerXRZCcQcG9aSZqAfishYPsgG40xmFV8EMGJ0I

---

## 👥 Equipe **[Bit or Byte]**

| Foto | Nome Completo | Papel no Scrum | GitHub | LinkedIn |
| --- | --- | --- | --- | --- |
|  | **Matheus Oliveira Dantas de Souza** | Product Owner | https://github.com/Matheus7souza | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
|  | **Sarah Cristiny de Souza Mendes** | Scrum Master | https://github.com/sarahcris152 | [LinkedIn](https://www.linkedin.com/in/sarah-cristiny-de-souza-mendes-74aa881b7) |
|  | **João Vitor Maximiano de Carvalho** | Desenvolvedor | https://github.com/JoaoCbca | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
|  | **Luiz Felipe Nogueira** | Desenvolvedor | https://github.com/luiz274 | [LinkedIn](https://www.linkedin.com/in/luiz-felipe-nogueira-bb2430270) |
|  | **Nikolas Gabriel Alves de Araujo** | Desenvolvedor | https://github.com/NikoRamid | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
|  | **Pedro Lucas Matias** | Desenvolvedor | [GitHub](https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
|  | **Ryan Cesar Candido Alves** | Desenvolvedor | https://github.com/ryancesar22 | [LinkedIn](https://www.linkedin.com/in/ryan-cesar-candido-alves-814887231) |
|  | **Willian de Paula Barreto** | Desenvolvedor | https://github.com/will1907 | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |


## 🔖 SPRINT 1 – Fundações, Infraestrutura e Base de Dados
Período: 28/09/2026 a 22/10/2026

🏃 DoR da Sprint 1
Protótipos das telas de Login, Cadastro, Menu Principal e Área de Estudos finalizados no Figma.

Modelagem conceitual e lógica do banco de dados PostgreSQL aprovada pelo desenvolvedor responsável.

Arquitetura em contêineres isolados (Front-End, Back-End e PostgreSQL) definida no docker-compose.yml.

🏆 DoD da Sprint 1
Scripts DDL/DML para criação e povoamento das tabelas de Usuários, Temas e Questões rodando perfeitamente no PostgreSQL via Docker.

Telas estáticas e fluxo de navegação entre Login, Cadastro e Menu Principal funcionais em HTML/CSS/JS nativo.

Endpoints de autenticação (CPF e Senha) e cadastro integrados com o banco de dados.
