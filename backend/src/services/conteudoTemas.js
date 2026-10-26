module.exports = {
    1: `
        <p>A agilidade ganhou espaço como resposta às dificuldades de planejar projetos de software como se fossem obras previsíveis. Em vez de esperar até o fim para entregar tudo, o time trabalha em ciclos curtos, recebe feedback e entrega partes funcionais do produto.</p>
        <figure>
            <img src="../imagens/temas/tema-1-cascata-e-agil.jpg" alt="Comparação entre o desenvolvimento em cascata e o desenvolvimento ágil">
            <figcaption>O modelo em cascata segue etapas sequenciais; a abordagem ágil trabalha em ciclos com entregas frequentes.</figcaption>
        </figure>
        <h3>O contexto e a crise do software</h3>
        <h4>Modelo tradicional de engenharia</h4>
        <p>Entre as décadas de 1960 e 1980, o desenvolvimento tentou espelhar processos industriais e de engenharia civil. O modelo em cascata era linear: levantamento completo de requisitos, arquitetura, codificação, testes e implantação final. Cada etapa precisava ser concluída, aprovada e documentada antes da seguinte.</p>
        <h4>A ilusão da previsibilidade</h4>
        <p>O modelo partia da ideia de que todas as necessidades, problemas e tecnologias poderiam ser antecipados e congelados no início. Projetos de software, porém, não se comportam como construir uma ponte: requisitos e contexto mudam enquanto o produto é desenvolvido.</p>
        <h4>A crise do software</h4>
        <p>O termo ganhou repercussão na Conferência da OTAN de 1968 para descrever falhas sistêmicas da indústria de TI: atrasos de anos, orçamentos estourados, sistemas com bugs críticos e projetos cancelados antes do lançamento.</p>
        <h4>Incerteza e mudança</h4>
        <p>Mercado, economia, tecnologia e comportamento dos usuários mudam rapidamente. Em ciclos longos, o sistema podia ficar pronto conforme o plano antigo, mas obsoleto e distante da necessidade real do negócio.</p>

        <h3>Desenvolvimento tradicional versus desenvolvimento ágil</h3>
        <ul>
            <li><strong>Tradicional:</strong> sequencial e inflexível; mudanças tardias geram custo e retrabalho. Prioriza aderência ao plano, contratos de escopo fechado e documentação prévia. O cliente participa principalmente no início e no aceite final.</li>
            <li><strong>Ágil:</strong> iterativo e incremental; o trabalho é dividido em ciclos curtos, com incrementos testados, integrados e funcionais. Prioriza adaptação, colaboração e entrega contínua de valor. O cliente participa regularmente para validar resultados e redirecionar os próximos passos.</li>
        </ul>

        <h3>Benefícios da agilidade</h3>
        <ul>
            <li><strong>Mitigação precoce de riscos:</strong> testes e integrações frequentes revelam problemas antes que se acumulem.</li>
            <li><strong>Retorno sobre o investimento antecipado:</strong> funcionalidades úteis podem chegar aos usuários antes do encerramento do projeto.</li>
            <li><strong>Alinhamento com o usuário e menos desperdício:</strong> validações frequentes ajudam a construir o que o mercado realmente precisa.</li>
            <li><strong>Flexibilidade e competitividade:</strong> o time pode incorporar mudanças de tecnologia, legislação e estratégia com menos burocracia.</li>
            <li><strong>Sustentabilidade e engajamento:</strong> autonomia, transparência e colaboração favorecem motivação e reduzem o risco de burnout e rotatividade.</li>
        </ul>
        <p class="study-reference">Fontes do material: relatório da Conferência da OTAN de 1968; artigo de Winston W. Royce (1970); Manifesto Ágil; Scrum Guide; Engenharia de Software Moderna.</p>
    `,
    2: `
        <p>O Manifesto para o Desenvolvimento Ágil de Software foi criado em 2001, em Snowbird, Utah, por 17 profissionais que buscavam alternativas a processos pesados, burocráticos e muito dependentes de planos rígidos. O grupo reuniu práticas que já funcionavam em equipes e destacou colaboração, flexibilidade e entrega rápida de valor.</p>
        <figure>
            <img src="../imagens/temas/tema-2-valores-manifesto.jpg" alt="Os quatro valores do Manifesto Ágil">
            <figcaption>Os quatro valores do Manifesto Ágil.</figcaption>
        </figure>
        <p>A frase que resume sua intenção é: “Estamos descobrindo maneiras melhores de desenvolver software, fazendo-o nós mesmos e ajudando outros a fazerem o mesmo”. O Manifesto não rejeita os itens à direita; valoriza mais os itens à esquerda.</p>

        <h3>Os quatro valores</h3>
        <ol>
            <li><strong>Indivíduos e interações mais que processos e ferramentas:</strong> ferramentas e processos ajudam, mas a comunicação e a colaboração entre as pessoas são essenciais.</li>
            <li><strong>Software em funcionamento mais que documentação abrangente:</strong> documentação tem valor, mas o produto funcional valida o negócio e gera valor ao cliente.</li>
            <li><strong>Colaboração com o cliente mais que negociação de contratos:</strong> cliente e equipe trabalham em parceria para ajustar rotas e prioridades.</li>
            <li><strong>Responder a mudanças mais que seguir um plano:</strong> um plano é útil, mas deve ser adaptado quando o mercado e a realidade mudam.</li>
        </ol>

        <h3>Os doze princípios</h3>
        <ol>
            <li>Satisfazer o cliente por meio da entrega contínua e antecipada de software com valor.</li>
            <li>Aceitar mudanças de requisitos, mesmo tarde no desenvolvimento, para gerar vantagem ao cliente.</li>
            <li>Entregar software funcionando com frequência, preferindo ciclos curtos.</li>
            <li>Manter pessoas de negócios e desenvolvedores trabalhando juntos diariamente.</li>
            <li>Construir projetos ao redor de pessoas motivadas, dando ambiente, suporte e confiança.</li>
            <li>Preferir a conversa direta como forma eficiente de transmitir informações à equipe.</li>
            <li>Usar software funcionando como medida primária de progresso.</li>
            <li>Promover um ritmo sustentável que patrocinadores, desenvolvedores e usuários consigam manter.</li>
            <li>Manter atenção contínua à excelência técnica e ao bom design para aumentar a agilidade.</li>
            <li>Valorizar a simplicidade: maximizar o trabalho que não precisa ser feito.</li>
            <li>Permitir que equipes auto-organizáveis criem as melhores arquiteturas, requisitos e designs.</li>
            <li>Refletir regularmente sobre como se tornar mais eficaz e ajustar o comportamento.</li>
        </ol>
        <p>Na prática, ciclos curtos e feedback permitem adaptar o produto; conversa frequente evita mal-entendidos; excelência técnica reduz dívida; e retrospectivas apoiam a melhoria contínua.</p>
        <p class="study-reference">Fontes do material: <a href="https://agilemanifesto.org/iso/ptbr/manifesto.html" target="_blank" rel="noopener">Manifesto Ágil</a> e seus <a href="https://agilemanifesto.org/iso/ptbr/principles.html" target="_blank" rel="noopener">doze princípios</a>.</p>
    `,
    3: `
        <p>O Scrum é um framework leve que ajuda pessoas, times e organizações a gerar valor por meio de soluções adaptativas para problemas complexos. Define elementos essenciais e as regras entre eles, sem prescrever todas as técnicas de programação, teste ou design.</p>
        <figure>
            <img src="../imagens/temas/tema-3-ciclo-scrum.jpg" alt="Ciclo Scrum: Product Backlog, Sprint, eventos, Incremento e feedback">
            <figcaption>O ciclo Scrum conecta planejamento, execução, inspeção e adaptação.</figcaption>
        </figure>
        <h3>Como o Scrum funciona</h3>
        <ol>
            <li>O Product Owner organiza o trabalho necessário no Product Backlog.</li>
            <li>O Scrum Team transforma parte desse trabalho em um Incremento de valor durante uma Sprint.</li>
            <li>O time e as partes interessadas inspecionam resultados e fazem ajustes.</li>
            <li>O ciclo se repete, usando o que foi aprendido para orientar o trabalho seguinte.</li>
        </ol>
        <p>O Scrum é propositalmente incompleto: define somente as partes necessárias para aplicar sua teoria. As pessoas completam o restante com práticas adequadas ao contexto. Papéis, eventos, artefatos e regras essenciais são interligados; retirar partes fundamentais significa deixar de usar o Scrum em sua totalidade.</p>

        <h3>Origem e evolução</h3>
        <p>O nome vem do rugby, em que os jogadores se agrupam e avançam como uma unidade. Em 1986, Hirotaka Takeuchi e Ikujiro Nonaka usaram essa metáfora ao descrever equipes multidisciplinares que desenvolviam produtos juntas, em vez de passar o trabalho em etapas isoladas. Jeff Sutherland e Ken Schwaber aplicaram ideias semelhantes ao desenvolvimento de software e apresentaram o Scrum em 1995. Em 2010 publicaram a primeira versão do Scrum Guide; o guia foi atualizado ao longo dos anos, e a versão de 2020 é a referência usada neste material.</p>

        <h3>Por que usar Scrum?</h3>
        <ul>
            <li><strong>Reduz riscos:</strong> ciclos de até um mês limitam o tempo investido antes de inspecionar o resultado.</li>
            <li><strong>Entrega valor mais cedo:</strong> o trabalho é ordenado para que funcionalidades importantes possam ser disponibilizadas antes.</li>
            <li><strong>Aumenta a transparência:</strong> progresso, trabalho pronto e problemas ficam visíveis.</li>
            <li><strong>Permite adaptação:</strong> eventos regulares oferecem momentos para incorporar mudanças.</li>
            <li><strong>Valoriza as pessoas:</strong> o time tem autonomia para decidir como fazer o trabalho.</li>
        </ul>
        <p>Scrum não é uma fórmula mágica: não resolve sozinho falta de habilidade técnica, liderança autoritária ou metas impossíveis. Torna problemas visíveis para que possam ser tratados.</p>

        <h3>Empirismo, pensamento Lean e os pilares</h3>
        <p>O empirismo parte da experiência e do que é observado para produzir conhecimento e tomar decisões. O pensamento Lean procura reduzir desperdício e concentrar esforço no que gera valor. Na prática, o empirismo se apoia em três pilares:</p>
        <ul>
            <li><strong>Transparência:</strong> trabalho e processo visíveis para quem realiza e para quem recebe.</li>
            <li><strong>Inspeção:</strong> verificar regularmente artefatos e progresso para perceber desvios.</li>
            <li><strong>Adaptação:</strong> ajustar o plano ou o trabalho quando a inspeção revela diferenças importantes.</li>
        </ul>

        <h3>Os cinco valores do Scrum</h3>
        <p><strong>Comprometimento, foco, abertura, respeito e coragem</strong> criam um ambiente de confiança. O time se compromete com objetivos e apoio mútuo, mantém foco na Sprint, compartilha desafios com abertura, respeita as pessoas e tem coragem para fazer a coisa certa e enfrentar problemas difíceis.</p>
        <p class="study-reference">Referência: <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">Scrum Guide 2020</a>.</p>
    `,
    4: `
        <p>O Scrum Team é a unidade fundamental do Scrum. É um time pequeno, autogerenciado e multidisciplinar, formado por Product Owner, Scrum Master e Developers. Não há hierarquia interna entre essas responsabilidades: todos compartilham a responsabilidade pelo Incremento e pela Sprint Goal.</p>
        <figure>
            <img src="../imagens/temas/tema-4-scrum-team.jpg" alt="Product Owner, Scrum Master e Developers no Scrum Team">
            <figcaption>As três responsabilidades que compõem o Scrum Team.</figcaption>
        </figure>
        <h3>Product Owner</h3>
        <p>Responsável por maximizar o valor do produto. Cria e comunica a visão e o Product Goal, gere o Product Backlog e mantém seus itens claros, ordenados e alinhados às necessidades dos usuários e do negócio. Comunica-se com stakeholders para alinhar expectativas e decisões. Entre as habilidades úteis estão tomada de decisão, comunicação, conhecimento do domínio e priorização baseada em valor.</p>

        <h3>Scrum Master</h3>
        <p>Responsável por promover o entendimento e a aplicação correta do Scrum. Atua como facilitador, mentor e agente de mudança, apoiando o Product Owner e os Developers na colaboração e na melhoria de práticas. Ajuda a remover impedimentos e trabalha com a organização para eliminar barreiras à agilidade. Facilitação, coaching, liderança servidora e conhecimento do Scrum são habilidades importantes.</p>

        <h3>Developers</h3>
        <p>Responsáveis por criar um Incremento que atenda à Definition of Done. Planejam o trabalho da Sprint, participam do refinamento do backlog, cuidam da qualidade técnica e adaptam o plano conforme aprendem. Colaboração, engenharia de software, estimativa, planejamento e autogestão são competências úteis.</p>

        <h3>Como as responsabilidades colaboram</h3>
        <ul>
            <li><strong>Product Owner e Developers:</strong> refinam o backlog, esclarecem critérios de aceitação e planejam a Sprint.</li>
            <li><strong>Scrum Master e Product Owner:</strong> melhoram a transparência do backlog, a comunicação com stakeholders e a priorização.</li>
            <li><strong>Scrum Master e Developers:</strong> colaboram na remoção de impedimentos, facilitação dos eventos e melhoria contínua.</li>
            <li><strong>Todo o Scrum Team:</strong> participa da Sprint Planning, Daily Scrum, Sprint Review e Sprint Retrospective conforme as responsabilidades de cada evento.</li>
        </ul>
        <p>Uma pessoa que acumula outra responsabilidade pode participar da Daily Scrum como Developer quando contribui com itens do Sprint Backlog. O acúmulo exige tempo e atenção e pode ter custos para o trabalho.</p>
        <h3>Resumo das responsabilidades</h3>
        <ul>
            <li><strong>Product Owner:</strong> maximizar o valor e gerir o Product Backlog — “O que é mais valioso fazer agora?”</li>
            <li><strong>Developers:</strong> criar o Incremento, planejar a Sprint e garantir qualidade — “Como transformar isso em algo pronto e utilizável?”</li>
            <li><strong>Scrum Master:</strong> estabelecer o Scrum e a eficácia do time — “Estamos usando bem o Scrum e melhorando a cada ciclo?”</li>
        </ul>
        <p class="study-reference">Referência: <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">Scrum Guide</a>.</p>
    `,
    5: `
        <p><strong>Tempo estimado:</strong> 10 a 15 minutos.</p>
        <p><strong>Objetivo:</strong> entender a sequência dos eventos do Scrum, o propósito de cada um e como ajudam o time a inspecionar o trabalho e ajustar o caminho durante a Sprint.</p>
        <figure>
            <img src="../imagens/temas/tema-5-ciclo-da-sprint.jpg" alt="Ciclo da Sprint com Sprint Planning, Daily Scrum, Sprint Review e Sprint Retrospective">
            <figcaption>O ciclo da Sprint e os eventos que apoiam o trabalho do Scrum Team.</figcaption>
        </figure>
        <h3>O que são os eventos do Scrum?</h3>
        <p>Os eventos organizam momentos de trabalho em equipe. Eles ajudam a tornar o andamento do produto visível, verificar o que está acontecendo e adaptar o plano quando necessário. A Sprint é um evento de duração fixa, de um mês ou menos, que contém os demais. Quando uma Sprint termina, a próxima começa imediatamente.</p>
        <p>A sequência geral é: Sprint Planning, trabalho da Sprint com Daily Scrums, Sprint Review e Sprint Retrospective. As Daily Scrums acontecem ao longo da Sprint; a Review e a Retrospective ocorrem perto do encerramento, nessa ordem.</p>

        <h3>Sprint Planning — Planejamento da Sprint</h3>
        <p>A Sprint Planning abre a Sprint. Nela, o Scrum Team conversa sobre o valor esperado, o trabalho que pode ser realizado e como começar. O planejamento responde a três perguntas:</p>
        <ul>
            <li><strong>Por que esta Sprint é valiosa?</strong> A conversa ajuda a definir a Sprint Goal, ou Meta da Sprint.</li>
            <li><strong>O que pode ser feito?</strong> O time seleciona itens do Product Backlog que considera possível realizar.</li>
            <li><strong>Como o trabalho será feito?</strong> Os Developers planejam como transformar os itens selecionados em um Incremento.</li>
        </ul>
        <p>A Sprint Goal dá direção ao trabalho e comunica o resultado pretendido, mesmo que os detalhes do plano sejam ajustados. No Portal de Certificação, uma meta poderia ser permitir que o candidato crie uma conta e acesse o portal com CPF e senha. Para uma Sprint de um mês, a Planning tem duração máxima de oito horas; Sprints menores tendem a exigir menos tempo.</p>
        <figure>
            <img src="../imagens/temas/tema-5-perguntas-do-planejamento.png" alt="As três perguntas da Sprint Planning: por quê, o quê e como">
            <figcaption>As três perguntas que orientam o planejamento da Sprint.</figcaption>
        </figure>

        <h3>Daily Scrum</h3>
        <p>Evento diário de até 15 minutos em que os Developers inspecionam o progresso em direção à Sprint Goal e adaptam o plano de trabalho, se necessário. O foco é o objetivo compartilhado: o time conversa sobre avanços, reorganização do trabalho e colaboração necessária.</p>
        <p>O Scrum Guide não exige uma lista fixa de perguntas. Os Developers escolhem a estrutura que funcione melhor, desde que a conversa ajude a acompanhar o progresso e gere um plano útil para o próximo período. Por exemplo, se a validação de CPF estiver levando mais tempo que o esperado, o plano pode ser ajustado para que outra pessoa ajude nessa parte.</p>
        <p>A Daily Scrum não é uma apresentação de tarefas para um chefe nem uma prestação de contas individual. Seu propósito é ajudar os Developers a coordenar o trabalho e decidir os próximos passos.</p>

        <h3>Sprint Review — Revisão da Sprint</h3>
        <p>Perto do fim da Sprint, o Scrum Team e os principais stakeholders analisam o resultado do trabalho e conversam sobre os próximos passos do produto. A conversa pode considerar o que foi realizado, mudanças no contexto ou nas necessidades, aprendizados e oportunidades futuras.</p>
        <p>A Review é uma sessão de trabalho colaborativa, não apenas uma apresentação de telas. O que o grupo aprende pode levar à adaptação dos próximos passos e do Product Backlog. No Portal, por exemplo, os stakeholders podem notar que o candidato precisa receber uma mensagem clara quando o CPF já está cadastrado.</p>
        <p>A Sprint Review não serve para avaliar individualmente quem trabalhou mais ou menos. Para uma Sprint de um mês, dura no máximo quatro horas; em Sprints menores, costuma durar menos.</p>

        <h3>Sprint Retrospective — Retrospectiva da Sprint</h3>
        <p>Depois da Review, o Scrum Team reflete sobre como o trabalho aconteceu e planeja maneiras de melhorar a qualidade e a eficácia do time. Pode conversar sobre comunicação e colaboração, processos e ferramentas, qualidade, dificuldades e práticas que ajudaram ou atrapalharam.</p>
        <p>A conversa deve resultar em melhorias úteis e possíveis de experimentar. Se algumas dúvidas sobre critérios das tarefas aparecem perto do fim, por exemplo, o time pode combinar de discutir os itens mais cedo no refinamento. A Retrospective não busca culpados: busca compreender o que aconteceu e decidir como trabalhar melhor. Para uma Sprint de um mês, dura no máximo três horas e conclui a Sprint.</p>

        <h3>Limites de tempo e como os eventos se complementam</h3>
        <ul>
            <li>Sprint Planning: até 8 horas.</li>
            <li>Daily Scrum: até 15 minutos por dia.</li>
            <li>Sprint Review: até 4 horas.</li>
            <li>Sprint Retrospective: até 3 horas.</li>
            <li>A Sprint tem duração fixa de até um mês. Em ciclos menores, os eventos costumam ser mais curtos.</li>
        </ul>
        <p>A Planning define objetivo, trabalho possível e como começar; a Daily inspeciona o progresso e adapta o plano; a Review inspeciona o produto e discute os próximos passos; a Retrospective melhora a forma de trabalhar. Juntos, os eventos formam um ciclo de planejamento, acompanhamento, avaliação e melhoria, mantendo a Sprint Goal como referência.</p>
        <h4>Exemplo completo: uma Sprint do Portal</h4>
        <ol>
            <li>Na Planning, o time define a meta de permitir que o candidato crie uma conta e entre no portal, seleciona itens de cadastro e login e planeja o início do trabalho.</li>
            <li>Nas Daily Scrums, os Developers verificam o progresso e adaptam o plano diante de descobertas ou dificuldades.</li>
            <li>Na Review, o time demonstra o resultado e conversa com stakeholders sobre o que foi entregue e o que pode melhorar.</li>
            <li>Na Retrospective, o Scrum Team escolhe uma melhoria para experimentar na Sprint seguinte.</li>
        </ol>
        <h4>Confira seu entendimento</h4>
        <ol>
            <li>Qual evento inicia a Sprint? <strong>Sprint Planning.</strong></li>
            <li>Qual evento inspeciona diariamente o progresso rumo à Sprint Goal? <strong>Daily Scrum.</strong></li>
            <li>Em qual evento o time colabora com stakeholders para inspecionar resultados e próximos passos? <strong>Sprint Review.</strong></li>
            <li>Qual evento ajuda a planejar melhorias na forma de trabalhar? <strong>Sprint Retrospective.</strong></li>
            <li>A Daily é para provar ao Scrum Master que cada pessoa trabalhou? <strong>Não.</strong> Serve para inspecionar o progresso e adaptar o plano.</li>
            <li>A Review deve ser apenas uma demonstração de telas? <strong>Não.</strong> É uma sessão colaborativa para inspecionar o produto e discutir o que fazer a seguir.</li>
        </ol>
        <p><strong>Resumo:</strong> a Sprint contém os eventos; a Planning inicia o ciclo, a Daily acompanha o progresso, a Review inspeciona o resultado com stakeholders e a Retrospective planeja melhorias para o time.</p>
        <p class="study-reference">Referência: <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">Guia do Scrum (Scrum Guides)</a>.</p>
    `,
    6: `
        <p>Os artefatos do Scrum representam trabalho ou valor e maximizam a transparência das informações essenciais. Cada artefato tem um compromisso correspondente, que fornece foco e uma referência para medir o progresso. As associações não representam uma sequência de etapas.</p>
        <figure>
            <img src="../imagens/temas/tema-6-artefatos-e-compromissos.png" alt="Product Backlog e Product Goal, Sprint Backlog e Sprint Goal, Incremento e Definition of Done">
            <figcaption>Os três artefatos do Scrum e seus compromissos.</figcaption>
        </figure>
        <p>Os compromissos não são promessas de concluir uma quantidade fixa de tarefas. Eles orientam decisões, aumentam a transparência e apoiam a inspeção e a adaptação.</p>

        <h3>Product Backlog e Product Goal</h3>
        <p>O Product Backlog é uma lista ordenada e emergente do que é necessário para melhorar o produto e a fonte única de trabalho do Scrum Team. Ele muda conforme o produto, o mercado e o entendimento das pessoas evoluem.</p>
        <p>O Product Goal descreve um estado futuro do produto e funciona como objetivo de longo prazo do Scrum Team. O time deve cumprir ou abandonar um Product Goal antes de assumir outro. O Product Owner responde por maximizar o valor do produto e gerir o backlog de forma eficaz: comunicar o Product Goal, criar e ordenar itens e manter o backlog transparente e compreendido.</p>

        <h3>Sprint Backlog e Sprint Goal</h3>
        <p>O Sprint Backlog contém a Sprint Goal, os itens do Product Backlog selecionados para a Sprint e um plano acionável para criar o Incremento. Os Developers o criam e atualizam durante a Sprint conforme o aprendizado aumenta.</p>
        <p>A Sprint Goal é o objetivo único da Sprint. Ela cria coerência e foco, mas permite flexibilidade sobre o trabalho exato necessário. Se o trabalho se revelar diferente do esperado, os Developers colaboram com o Product Owner para negociar o escopo sem comprometer a meta.</p>
        <h4>Exemplo para o portal</h4>
        <ul>
            <li><strong>Sprint Goal:</strong> permitir que uma pessoa crie credenciais válidas e acesse o portal.</li>
            <li><strong>Itens selecionados:</strong> cadastro de candidato e autenticação por CPF e senha.</li>
            <li><strong>Plano inicial:</strong> validar dados, persistir o cadastro, proteger a senha, autenticar, tratar erros e testar o fluxo integrado.</li>
        </ul>

        <h3>Incremento e Definition of Done</h3>
        <p>Um Incremento é um passo concreto em direção ao Product Goal. Deve somar-se aos incrementos anteriores, ser verificado e permanecer utilizável. Pode haver vários incrementos em uma Sprint, e valor pode ser liberado antes da Sprint Review.</p>
        <p>A Definition of Done (DoD) descreve formalmente o estado do Incremento quando as medidas de qualidade exigidas para o produto são atendidas. Trabalho que não satisfaz a DoD não faz parte do Incremento e retorna ao Product Backlog.</p>
        <figure>
            <img src="../imagens/temas/tema-6-relacao-artefatos.png" alt="Critérios e dimensões de qualidade usados para verificar o trabalho">
            <figcaption>Exemplos de critérios usados para tornar a qualidade verificável.</figcaption>
        </figure>
        <figure>
            <img src="../imagens/temas/tema-6-criterios-de-qualidade.png" alt="Critérios de qualidade e verificação de um Incremento">
            <figcaption>Uma definição de qualidade ajuda o time a verificar se o Incremento está pronto.</figcaption>
        </figure>

        <h3>Como os três pares trabalham juntos</h3>
        <p>O Product Goal indica a direção estratégica. Em cada Sprint, a Sprint Goal define um resultado intermediário coerente. O Incremento oferece evidência concreta do progresso, desde que satisfaça a DoD. A inspeção do que foi concluído alimenta novas decisões sobre o Product Backlog.</p>
        <ul>
            <li>O compromisso do Sprint Backlog é a Sprint Goal, não a conclusão rígida de todos os itens inicialmente selecionados.</li>
            <li>A Sprint Review inspeciona resultados e pode adaptar o Product Backlog; não é uma barreira obrigatória para liberar valor.</li>
            <li>Critérios de aceitação verificam um item específico. A DoD define a qualidade comum exigida para qualquer Incremento.</li>
            <li>Todos os Scrum Teams que trabalham no mesmo produto precisam respeitar a mesma DoD.</li>
        </ul>
        <figure>
            <img src="../imagens/temas/tema-6-inspecao-dos-artefatos.png" alt="Tabela que relaciona cada artefato ao seu compromisso e à pergunta de inspeção">
            <figcaption>Os compromissos ajudam a inspecionar o estado de cada artefato.</figcaption>
        </figure>
        <p class="study-reference">Referência: Schwaber e Sutherland, <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">The Scrum Guide (2020)</a>.</p>
    `,
    7: `
        <p>User Story é uma forma breve de representar uma necessidade pela perspectiva de quem usa ou se beneficia do produto. Histórias ajudam a organizar o trabalho em incrementos funcionais que contribuem para o valor do produto. Não são um elemento obrigatório do Scrum: são uma técnica possível para escrever itens do Product Backlog.</p>
        <figure>
            <img src="../imagens/temas/tema-7-anatomia-user-story.png" alt="Anatomia de uma história de usuário: perfil, capacidade e benefício">
            <figcaption>Uma história explicita quem precisa de algo, o que deseja fazer e por que isso tem valor.</figcaption>
        </figure>

        <h3>Modelo “Como... Quero... Para...”</h3>
        <ul>
            <li><strong>Como [perfil]:</strong> quem tem a necessidade ou recebe o benefício?</li>
            <li><strong>Quero [capacidade]:</strong> o que essa pessoa precisa conseguir fazer?</li>
            <li><strong>Para [benefício]:</strong> que resultado ou valor espera alcançar?</li>
        </ul>
        <p>Esse formato, também chamado perfil–capacidade–benefício, deve ser pequeno o suficiente para servir de lembrete da conversa, não como especificação completa. Uma história útil permanece aberta à conversa, pode ser testada e expressa valor observável, em vez de apenas uma tarefa técnica.</p>
        <figure>
            <img src="../imagens/temas/tema-7-exemplo-user-story.png" alt="Exemplo de história de usuário organizada por perfil, capacidade e benefício">
            <figcaption>Exemplo de história de usuário para o portal.</figcaption>
        </figure>
        <p>Mesmo uma história clara precisa ser discutida. O time esclarece os dados necessários, regras de validação, estados de erro, limites de segurança e comportamento após o sucesso.</p>

        <h3>Os três C: cartão, conversa e confirmação</h3>
        <ul>
            <li><strong>Cartão:</strong> registra uma descrição breve da necessidade e do valor esperado.</li>
            <li><strong>Conversa:</strong> reúne Product Owner, Developers e pessoas relevantes para descobrir detalhes, exemplos e alternativas.</li>
            <li><strong>Confirmação:</strong> define exemplos ou critérios observáveis que demonstram se a história foi implementada corretamente.</li>
        </ul>
        <p>Essa leitura evita transformar a história em um contrato fechado. Os detalhes evoluem conforme a história se aproxima da implementação e o time aprende mais sobre o problema.</p>

        <h3>Critérios de aceitação</h3>
        <p>Critérios de aceitação estabelecem condições observáveis para aceitar uma história. Delimitam o comportamento esperado e ajudam produto, desenvolvimento e testes a compartilhar o mesmo entendimento. Uma forma comum de escrevê-los é <strong>Dado–Quando–Então</strong>.</p>
        <h4>História de cadastro — US-01</h4>
        <p>Como pessoa interessada em estudar Scrum, quero criar uma conta com nome completo, CPF, e-mail e senha para obter credenciais de acesso ao portal. Os critérios de aceitação para esse cenário devem ser validados pelo time durante o refinamento e a implementação.</p>
        <figure>
            <img src="../imagens/temas/tema-7-criterios-de-aceitacao.png" alt="Tabela de critérios de aceitação para o cadastro de candidato">
            <figcaption>Exemplos de critérios observáveis para validar o fluxo de cadastro.</figcaption>
        </figure>
        <p>Atender aos critérios de aceitação não dispensa a Definition of Done. Uma história pode apresentar o comportamento correto e ainda não estar pronta se falhar nas medidas comuns de qualidade, segurança ou integração.</p>
        <figure>
            <img src="../imagens/temas/tema-7-aceitacao-e-definition-of-done.png" alt="Comparação entre critérios de aceitação e Definition of Done">
            <figcaption>Critérios de aceitação tratam de uma história; a DoD define a qualidade comum do Incremento.</figcaption>
        </figure>

        <h3>Como dividir histórias grandes</h3>
        <p>Uma história deve ser pequena o suficiente para ser concluída dentro de uma iteração. Dividir consiste em criar histórias menores preservando valor mensurável em cada parte. Uma divisão vertical atravessa as camadas necessárias para entregar uma capacidade utilizável; dividir horizontalmente em “criar tela”, “criar API” e “criar tabela” gera componentes isolados sem valor observável para o candidato.</p>
        <figure>
            <img src="../imagens/temas/tema-7-divisao-de-historias.png" alt="Divisão de uma história grande em resultados menores e úteis">
            <figcaption>Divisões verticais preservam um resultado utilizável em cada etapa.</figcaption>
        </figure>
        <p>Técnicas úteis incluem dividir por etapas do fluxo (cadastrar-se, entrar, consultar material, responder questão, consultar resultado), cenários (começar pelo caminho de sucesso), regras de negócio, operações com valor próprio e variações de dados ou perfil.</p>

        <h3>Verificação da qualidade: INVEST</h3>
        <p>A heurística INVEST ajuda o time a avaliar histórias. É um conjunto de perguntas para orientar o refinamento, não uma certificação automática.</p>
        <figure>
            <img src="../imagens/temas/tema-7-invest.png" alt="Perguntas para avaliar histórias de usuário com a heurística INVEST">
            <figcaption>INVEST: independente, negociável, valiosa, estimável, pequena e testável.</figcaption>
        </figure>
        <h4>Exemplo completo para o portal</h4>
        <ul>
            <li><strong>Título:</strong> Criar conta de candidato.</li>
            <li><strong>História:</strong> Como pessoa interessada em estudar Scrum, quero criar uma conta com meus dados para obter credenciais de acesso ao portal.</li>
            <li><strong>Valor:</strong> habilitar o primeiro acesso à plataforma.</li>
            <li><strong>Fora do escopo:</strong> autenticação, recuperação de senha e emissão de certificado.</li>
            <li><strong>Dependências:</strong> persistência de candidatos e disponibilização dos termos de uso.</li>
            <li><strong>Qualidade:</strong> atender à Definition of Done do produto.</li>
        </ul>
        <p class="study-reference">Referências: <a href="https://agilealliance.org/glossary/user-stories/" target="_blank" rel="noopener">Agile Alliance — User Stories</a> e <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">The Scrum Guide</a>.</p>
    `,
    8: `
        <figure>
            <img src="../imagens/temas/tema-8-priorizacao-backlog.jpg" alt="Product Backlog ordenado por prioridade: login e cadastro, listagem de cursos e pagamento por Pix">
            <figcaption>Exemplo visual de organização de itens do Product Backlog por prioridade.</figcaption>
        </figure>
        <h3>O que é o Product Backlog?</h3>
        <p>Imagine que você está construindo uma casa e tem uma lista grande de desejos: piscina, paredes, azulejos e telhado. Tentar fazer tudo ao mesmo tempo não funciona. No desenvolvimento de software, o Product Backlog é essa lista viva e organizada de tudo que pode ser necessário para construir ou melhorar o produto.</p>
        <p>No Scrum, é a fonte única de requisitos para qualquer mudança no produto. Nunca está completo: evolui conforme o produto e o ambiente em que é usado mudam.</p>

        <h3>Responsabilidade do Product Owner</h3>
        <p>O Product Owner responde pela gestão do Product Backlog. Cabe a ele manter a lista visível, transparente e clara para todos e ordenar os itens para maximizar o valor para o negócio e os usuários.</p>

        <h3>Colaboração do time</h3>
        <p>O Product Owner organiza a ordem e o valor dos itens. O restante do time colabora estimando o esforço — por exemplo, usando Story Points — e refinando detalhes técnicos. A colaboração ajuda a criar entendimento compartilhado sobre o trabalho.</p>

        <h3>Refinamento contínuo</h3>
        <p>Backlog Refinement é a atividade contínua de detalhar, estimar e reavaliar itens para que histórias de usuário estejam compreendidas e preparadas para entrar em Sprints futuras. Épicos e funcionalidades podem ser detalhados em histórias menores com critérios claros.</p>

        <h3>Ordenação e priorização</h3>
        <p>Os itens mais valiosos para o negócio e para os usuários ficam no topo. A ordem também considera dependências e o que é necessário para entregar valor com segurança.</p>
        <h4>Exemplo do portal</h4>
        <ul>
            <li><strong>Alta prioridade:</strong> tela de login e cadastro, base essencial para o funcionamento do portal.</li>
            <li><strong>Prioridade seguinte:</strong> listagem de cursos, que entrega valor após o acesso.</li>
            <li><strong>Futuro:</strong> sistema de pagamento por Pix, que depende da base estar pronta.</li>
        </ul>
        <p>Em outro exemplo do documento, login seguro e busca rápida aparecem no topo por serem importantes para a experiência inicial. A ordem deve ser revista conforme o valor, as dependências e o contexto do produto evoluem.</p>
        <p><strong>Em resumo:</strong> o Product Backlog é dinâmico e priorizado; o Product Owner mantém sua transparência e ordenação, e o time colabora no refinamento, nas estimativas e nos detalhes técnicos.</p>
        <p class="study-reference"><strong>Fontes consultadas no material:</strong> Guia de Product Backlog (Scrum.com.br); Product Backlog no Scrum (Escritório de Projetos); boas práticas de backlog (Scrum Alliance).</p>
    `,
    9: `
        <figure>
            <img src="../imagens/temas/tema-9-quadro-kanban.jpg" alt="Quadro Kanban dividido em A Fazer, Em Andamento, Concluído e Aprovado">
            <figcaption>Um quadro torna visível o estado dos itens e ajuda a equipe a acompanhar o fluxo.</figcaption>
        </figure>
        <h3>Kanban: fluxo contínuo e eficiência</h3>
        <p>Enquanto o Scrum organiza o trabalho em ciclos (Sprints), o Kanban ajuda a visualizar e gerenciar o fluxo de ponta a ponta. Originado na indústria automobilística, associado ao Sistema Toyota de Produção, usa a visualização do trabalho para identificar gargalos, reduzir desperdícios e entregar valor de forma sustentável.</p>
        <h3>Visualização do fluxo de trabalho</h3>
        <p>Um quadro físico ou digital usa colunas que representam as etapas de cada tarefa. Um exemplo é <strong>A Fazer</strong>, <strong>Em Andamento</strong>, <strong>Concluído</strong> e, opcionalmente, <strong>Aprovado</strong>. Cartões representam as demandas e avançam conforme o trabalho progride; assim todos conseguem ver onde cada item está.</p>
        <h3>Limite de WIP</h3>
        <p>WIP (Work in Progress) é o trabalho em andamento. Limitar a quantidade de itens simultâneos evita sobrecarga e multitarefa. A equipe procura terminar o que já começou antes de puxar novos itens, respeitando sua capacidade.</p>
        <h3>Gargalos e melhoria contínua</h3>
        <p>Quando o trabalho se acumula em uma coluna, há um gargalo. A equipe identifica o ponto de espera e atua para destravá-lo antes de iniciar mais tarefas. A melhoria contínua (Kaizen) usa ajustes incrementais e métricas como Cycle Time para melhorar o fluxo.</p>
        <p><strong>Em resumo:</strong> Kanban visualiza o fluxo em colunas e cartões, limita o WIP e ajuda a equipe a detectar gargalos. As tarefas avançam continuamente conforme a capacidade, sem depender de ciclos fixos.</p>
    `,
    10: `
        <p>Planejamento ágil organiza o trabalho de forma incremental, colaborativa e adaptável. Em vez de definir todos os detalhes no início e seguir um plano rígido, a equipe planeja continuamente, entrega resultados e ajusta prioridades conforme recebe feedback.</p>
        <h3>Objetivos do planejamento ágil</h3>
        <ul>
            <li>Entregar valor continuamente, priorizando benefícios reais para o cliente.</li>
            <li>Adaptar-se a mudanças e revisar planos quando surgem novas necessidades.</li>
            <li>Melhorar previsibilidade com dados das entregas anteriores.</li>
            <li>Promover colaboração entre quem define o produto e quem realiza o trabalho.</li>
            <li>Reduzir riscos, identificando problemas e validando entregas menores.</li>
        </ul>
        <p>No planejamento tradicional, grande parte do projeto é definida de antemão e mudanças podem exigir revisões extensas. No planejamento ágil, o plano é atualizado em diferentes níveis, entregas de valor podem ocorrer a cada iteração e resultados, qualidade e adaptação também contam como sucesso. Agilidade não significa falta de planejamento: significa planejar continuamente com informações atualizadas.</p>

        <h3>Sprints e Sprint Planning</h3>
        <p>Uma Sprint é um período fixo de um mês ou menos em que a equipe trabalha para atingir um objetivo e produzir um Incremento de valor. Sprints de uma, duas ou três semanas são comuns; a duração deve se adequar ao produto e manter uma cadência consistente. O ciclo inclui Sprint Planning, Daily Scrum, desenvolvimento e testes, Sprint Review e Sprint Retrospective.</p>
        <p>O Sprint Planning define por que a Sprint é importante, o que pode ser realizado e como o trabalho será feito. Participam Product Owner, Scrum Master e Developers: o Product Owner apresenta valor e prioridades; Developers avaliam capacidade e planejam o trabalho; Scrum Master apoia a compreensão e a produtividade do evento.</p>
        <h4>Preparação e etapas</h4>
        <ol>
            <li>Definir um objetivo de Sprint claro, valioso e com flexibilidade sobre a solução.</li>
            <li>Analisar itens prioritários, critérios de aceitação, dependências, riscos e dúvidas.</li>
            <li>Avaliar a capacidade da equipe, considerando ausências, suporte e resultados anteriores.</li>
            <li>Selecionar itens viáveis em colaboração com o Product Owner.</li>
            <li>Criar um plano inicial com atividades, testes, integrações e riscos.</li>
            <li>Confirmar entendimento comum sobre Sprint Goal, itens e Definition of Done.</li>
        </ol>
        <p>Para uma Sprint de um mês, o Scrum Guide define duração máxima de oito horas para a Sprint Planning. Em Sprints menores o evento tende a ser mais curto. O resultado deve conectar o Sprint Goal, os itens selecionados, um plano inicial e o entendimento sobre qualidade.</p>
        <h4>Exemplo de Sprint Planning</h4>
        <p>Em um aplicativo de vendas, o Product Backlog pode incluir consultar catálogo e adicionar ao carrinho (alta prioridade), calcular frete e aplicar cupom (média) e criar lista de desejos (baixa). Um objetivo possível é permitir que a pessoa selecione produtos e prepare o carrinho. O time seleciona os itens coerentes com essa meta; frete pode ficar para outra Sprint se não for necessário para atingi-la.</p>

        <h3>Story Points</h3>
        <p>Story Points estimam o tamanho relativo de um item do Product Backlog. Em vez de prever horas exatas, a equipe compara esforço, complexidade, incerteza e risco. Os pontos não são uma unidade universal: cada time estabelece referências próprias.</p>
        <ul>
            <li>Uma história simples e conhecida pode receber 1 ponto.</li>
            <li>Filtrar produtos por categoria pode receber 3 pontos.</li>
            <li>Um carrinho com estado, regras e validações pode receber 5 pontos.</li>
            <li>Pagamento com provedor externo pode receber 8 pontos por integração e riscos.</li>
            <li>Uma solução complexa e ainda não validada pode receber 13 pontos ou ser dividida.</li>
        </ul>
        <figure>
            <img src="../imagens/temas/tema-10-velocity-e-estimativa.png" alt="Equipe compara estimativas relativas usando cartas numeradas">
            <figcaption>Estimativas relativas ajudam o time a conversar sobre tamanho, risco e incerteza.</figcaption>
        </figure>
        <p>Escalas como 1, 2, 3, 5, 8, 13 e 21 são comuns. Os valores não significam horas ou dias. Story Points facilitam comparação e discussão e ajudam a observar a capacidade histórica, mas dependem do entendimento do time, podem variar quando ele muda e não garantem volume fixo de trabalho.</p>

        <h3>Planning Poker</h3>
        <p>Planning Poker é uma técnica colaborativa de estimativa, especialmente útil quando há incerteza ou diferentes interpretações. O responsável apresenta a história, o grupo esclarece regras, dependências e riscos, cada pessoa escolhe uma carta em segredo, todos revelam ao mesmo tempo e quem estimou mais alto e mais baixo explica seu raciocínio. Após nova discussão, a equipe pode estimar novamente e registra um valor compartilhado, sem exigir unanimidade matemática.</p>
        <figure>
            <img src="../imagens/temas/tema-10-planning-poker.png" alt="Equipe estima uma User Story em conjunto com cartas de Planning Poker">
            <figcaption>Revelar estimativas ao mesmo tempo reduz a influência das primeiras opiniões.</figcaption>
        </figure>
        <figure>
            <img src="../imagens/temas/tema-10-story-points-exemplo.png" alt="Equipe discute estimativas de Story Points em conjunto">
            <figcaption>A conversa sobre estimativas revela diferentes interpretações, riscos e dependências.</figcaption>
        </figure>
        <p>Exemplo: para adicionar produtos ao carrinho, as primeiras estimativas podem variar de 3 a 8 pontos. A conversa revela que a persistência do carrinho não está definida; depois de esclarecer o requisito, o time pode chegar a 5 pontos. O principal benefício é descobrir riscos e interpretações diferentes, não apenas obter um número.</p>
        <p>Explicar critérios com clareza, evitar influência antes da revelação, investigar diferenças e dividir histórias grandes são boas práticas. Os pontos não devem ser usados para pressionar a equipe.</p>

        <h3>Planejamento da Sprint e velocidade</h3>
        <p>O evento formal Sprint Planning é apoiado pelo trabalho contínuo de preparação do Product Backlog: compreender necessidades, ordenar itens, definir critérios, identificar riscos e dependências, dividir itens grandes e estimar quando útil. A velocidade soma os Story Points de itens concluídos conforme os critérios do time; a média de Sprints anteriores pode orientar a conversa, mas não é garantia.</p>
        <p>O Sprint Goal descreve um resultado, não uma lista de tarefas. “Desenvolver as histórias 1, 2 e 3” enumera atividades; “Permitir que novos clientes encontrem produtos e adicionem itens ao carrinho” expressa um resultado. Durante a Sprint, Developers atualizam o Sprint Backlog conforme aprendem, e adaptam o plano sem perder a meta. Daily Scrum não é prestação de contas a um gerente.</p>
        <p>Erros comuns incluem selecionar mais trabalho do que a capacidade permite, confundir ocupação com valor, iniciar itens sem entendimento suficiente, ignorar testes e integração, transformar pontos em metas individuais e tratar o Sprint Backlog como imutável.</p>

        <h3>Planejamento de Releases</h3>
        <p>Release é a disponibilização de uma versão ou funcionalidade para um público. O planejamento coordena entregas ao longo de várias Sprints e considera objetivos de negócio, valor, risco, qualidade e previsibilidade. Uma release pode conter várias Sprints; incrementos menores também podem ser disponibilizados continuamente.</p>
        <p>Um plano de release considera objetivo e escopo prioritário, backlog ordenado por valor e dependências, estimativas e capacidade histórica, cronograma indicativo, riscos, critérios de qualidade e estratégia de implantação, monitoramento e resposta a problemas.</p>
        <h4>Etapas do planejamento de releases</h4>
        <ol>
            <li>Definir o problema do cliente e o resultado de negócio desejado.</li>
            <li>Priorizar funcionalidades por valor, risco, urgência e dependências.</li>
            <li>Estimar usando tamanho relativo e capacidade histórica.</li>
            <li>Projetar cenários com velocidades e incertezas diferentes.</li>
            <li>Identificar riscos técnicos, regulatórios e operacionais.</li>
            <li>Preparar implantação, comunicação, suporte e monitoramento.</li>
            <li>Revisar o plano após cada Sprint com base no que foi aprendido.</li>
        </ol>
        <h4>Exemplo de releases para comércio eletrônico</h4>
        <ul>
            <li><strong>Release 1 — Descoberta:</strong> catálogo, detalhes, pesquisa, filtros e testes de navegação.</li>
            <li><strong>Release 2 — Preparação da compra:</strong> adicionar/remover itens, atualizar quantidades, calcular total e frete.</li>
            <li><strong>Release 3 — Finalização:</strong> integração de pagamento, confirmação e testes de segurança e recuperação.</li>
        </ul>
        <div class="study-image-grid" aria-label="Exemplos visuais de releases de um produto">
            <figure>
                <img src="../imagens/temas/tema-10-release-1.jpg" alt="Telas de catálogo e seleção de produtos">
                <figcaption>Release 1: encontrar produtos.</figcaption>
            </figure>
            <figure>
                <img src="../imagens/temas/tema-10-release-2.jpg" alt="Telas de seleção e preparação de um pedido">
                <figcaption>Release 2: preparar a compra.</figcaption>
            </figure>
            <figure>
                <img src="../imagens/temas/tema-10-release-3.jpg" alt="Telas de finalização e confirmação do pedido">
                <figcaption>Release 3: finalizar o pedido.</figcaption>
            </figure>
        </div>
        <p>Se um backlog tem 110 pontos e a velocidade média observada é 22 pontos por Sprint, uma projeção simples indica cerca de cinco Sprints. É uma estimativa pontual: não considera variações de velocidade, mudanças de escopo, dependências ou incerteza. Releases podem ocorrer no meio ou ao final da Sprint, desde que qualidade e implantação sejam atendidas; concluir uma Sprint e liberar uma versão não são necessariamente o mesmo momento.</p>

        <h3>Como os conceitos se relacionam</h3>
        <ul>
            <li><strong>Sprint Planning:</strong> define objetivo, trabalho e plano para uma Sprint.</li>
            <li><strong>Story Points:</strong> estimam tamanho relativo de itens.</li>
            <li><strong>Planning Poker:</strong> facilita estimativa colaborativa.</li>
            <li><strong>Release Planning:</strong> organiza disponibilização e evolução ao longo de várias Sprints.</li>
        </ul>
        <p>O fluxo não é totalmente linear: o que se aprende durante a Sprint pode alterar prioridades, estimativas e releases futuras.</p>
        <h4>Exemplo integrado: aplicativo de consultas</h4>
        <p>O Product Owner ordena histórias para consultar profissionais (3 pontos), ver horários (3), agendar (5), cancelar (3) e receber confirmação por e-mail (5). No Planning Poker, a conversa sobre concorrência por horários revela riscos e esclarece regras. A equipe define como Sprint Goal permitir que pacientes consultem profissionais e horários, seleciona as duas primeiras histórias (6 pontos), planeja integração e testes, acompanha o trabalho e adapta o Sprint Backlog. Depois, as releases podem acrescentar agendamento, confirmação, cancelamento e melhorias de comunicação conforme o aprendizado.</p>
    `,
    11: `
        <p>Métricas ágeis ajudam o time a entender valor entregue, previsibilidade e eficiência do fluxo. Não devem ser usadas para punir nem para microgerenciar a produtividade individual. Funcionam como um painel de bordo: tornam o andamento visível e ajudam a corrigir a rota.</p>
        <figure>
            <img src="../imagens/temas/tema-11-metricas-ageis.jpg" alt="Comparação de Velocity, Burndown, Burnup, Cycle Time e Lead Time">
            <figcaption>Métricas diferentes respondem a perguntas diferentes sobre trabalho e fluxo.</figcaption>
        </figure>
        <h3>Velocity</h3>
        <p>Mede a quantidade de Story Points de itens que a equipe concluiu integralmente em uma Sprint. Se itens concluídos valem 3, 5 e 5 pontos, a Velocity é 13. O histórico, como a média das últimas Sprints, ajuda a prever capacidade e planejar entregas.</p>
        <p>Velocity não serve para comparar equipes, pois as escalas são próprias de cada time, nem deve virar meta de pressão para produzir mais a qualquer custo.</p>

        <h3>Burndown Chart</h3>
        <p>Mostra o trabalho restante ao longo do tempo. O eixo vertical representa o trabalho restante (horas, tarefas ou pontos) e o horizontal representa os dias. A linha ideal desce até zero; a linha real mostra o progresso observado. Se a linha real fica muito acima da ideal, o time pode investigar riscos e ajustar o plano.</p>

        <h3>Burnup Chart</h3>
        <p>Mostra o trabalho concluído e também a evolução do escopo total. Uma linha representa o trabalho acumulado entregue; outra representa o escopo. Se a linha do escopo subir, novos requisitos foram adicionados, tornando visível o efeito das mudanças nas previsões.</p>

        <h3>Lead Time e Cycle Time</h3>
        <ul>
            <li><strong>Lead Time:</strong> tempo total desde o pedido do cliente ou negócio até a entrega em produção. Inclui o tempo em que o item ficou aguardando na fila e representa a espera percebida pelo cliente.</li>
            <li><strong>Cycle Time:</strong> tempo desde que a equipe começa efetivamente a trabalhar no item até sua conclusão. Ajuda a observar a eficiência interna do processo.</li>
        </ul>
        <p>O Lead Time começa quando a demanda é solicitada; o Cycle Time começa quando o trabalho é iniciado. Por isso, Lead Time é sempre maior ou igual ao Cycle Time.</p>
        <p class="study-reference">Fontes do material: <a href="https://www.scrum.org/resources/evidence-based-management" target="_blank" rel="noopener">Scrum.org — Evidence-Based Management</a>, <a href="https://www.atlassian.com/agile/project-management/metrics" target="_blank" rel="noopener">Atlassian — Agile Metrics</a> e Kanban University.</p>
    `,
    12: `
        <p>Na agilidade, qualidade não é uma fase isolada no fim do projeto: é uma prática contínua presente em todas as etapas. Em vez de apenas procurar bugs depois que o código está pronto, a equipe busca prevenir problemas e construir software confiável, limpo, testável e útil para o usuário.</p>
        <figure>
            <img src="../imagens/temas/tema-12-qualidade-e-dod.jpg" alt="Qualidade e engenharia ágil: Definition of Done, testes, revisão, integração contínua e refatoração">
            <figcaption>Qualidade contínua combina critérios de conclusão e práticas de engenharia.</figcaption>
        </figure>
        <h3>Definition of Done</h3>
        <p>A Definition of Done (DoD) é um acordo explícito e compartilhado sobre o que significa um item estar realmente concluído. Definition of Ready (DoR) ajuda a indicar quando um item está pronto para começar; DoD define quando pode ser considerado pronto para entrega.</p>
        <p>Critérios comuns incluem código revisado por outra pessoa, testes automatizados aprovados, integração ao repositório principal, documentação técnica atualizada e validação em ambiente de homologação. Se os critérios da DoD não foram atendidos, a funcionalidade não está pronta para ser entregue.</p>

        <h3>Testes automatizados</h3>
        <p>São scripts que verificam partes do sistema automaticamente. Em ciclos curtos, repetir todos os testes manualmente após cada alteração é impraticável; automação ajuda a detectar regressões rapidamente.</p>
        <ul>
            <li><strong>Testes unitários:</strong> verificam a menor parte isolada do código, como uma função ou método.</li>
            <li><strong>Testes de integração:</strong> verificam se módulos e componentes funcionam bem juntos.</li>
            <li><strong>Testes de aceitação ou sistema:</strong> validam se o comportamento atende às regras de negócio esperadas pelo usuário.</li>
        </ul>

        <h3>Integração contínua</h3>
        <p>Na Integração Contínua (CI), as pessoas integram código ao repositório compartilhado várias vezes ao dia ou pelo menos diariamente. Cada envio pode acionar processos automatizados que compilam o sistema e executam testes. Isso revela rapidamente se uma mudança quebrou algo e evita o “inferno da integração”, quando código desenvolvido isoladamente por muito tempo só é combinado no final.</p>

        <h3>Refatoração</h3>
        <p>Refatorar é reestruturar e limpar o código sem alterar o comportamento externo nem as funcionalidades oferecidas ao usuário. O objetivo é melhorar legibilidade, reduzir complexidade e duplicação e facilitar manutenção. É como organizar uma gaveta de ferramentas sem mudar para que cada ferramenta serve. Refatoração frequente ajuda o sistema a continuar flexível e saudável.</p>

        <h3>Dívida técnica</h3>
        <p>Dívida técnica é o custo implícito de escolher uma solução rápida ou de baixa qualidade em vez de uma solução mais limpa e sustentável. Um atalho pode ajudar a aproveitar uma oportunidade no curto prazo, mas, sem tempo para corrigir e refatorar, o código fica frágil e difícil de modificar. A equipe passa a gastar mais esforço mantendo problemas antigos e menos criando valor novo.</p>
        <p><strong>Em resumo:</strong> critérios claros de pronto, testes, integração contínua e refatoração incorporam qualidade ao trabalho diário e ajudam a evitar o acúmulo de defeitos e dívida técnica.</p>
        <p class="study-reference">Fontes do material: <a href="https://martinfowler.com/articles/continuousIntegration.html" target="_blank" rel="noopener">Martin Fowler — Continuous Integration</a>, <a href="https://martinfowler.com/bliki/TechnicalDebt.html" target="_blank" rel="noopener">Technical Debt</a>, <a href="https://refactoring.guru/refactoring" target="_blank" rel="noopener">Refactoring Guru</a> e <a href="https://scrumguides.org/scrum-guide.html" target="_blank" rel="noopener">Scrum Guide</a>.</p>
    `
};
