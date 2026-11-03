# Complemento curricular

Foram criadas 15 questões autorais para os temas atuais do portal: User Stories (1), Gestão do Product Backlog (3), Kanban (4), Planejamento Ágil (1), Métricas Ágeis (2) e Qualidade em Projetos Ágeis (4).

As questões autorais usam códigos q50 em diante e estão nos respectivos arquivos tema-XX.json, junto às questões dos PDFs. Os antigos arquivos complemento-tema-XX.json foram removidos após a consolidação. As sete questões sem equivalência foram removidas do catálogo JSON. Os códigos, conteúdos e hashes das 56 questões importáveis foram preservados.

O catálogo passa a ter 56 questões importáveis e 224 alternativas, com pelo menos quatro questões por tema. Preservar as questões extras dos temas 3, 4 e 5 faz o total superar 48. São 12 questões com imagem e 44 sem imagem. As novas questões possuem quatro alternativas, uma correta e uma justificativa; são autorais e não transcrições dos PDFs.

Referências conceituais: [Scrum Guide 2020, Ken Schwaber e Jeff Sutherland](https://scrumguides.org/scrum-guide.html), [Kanban Guide](https://kanbanguides.org/the-kanban-guide) e os conteúdos existentes em backend/src/services/conteudoTemas.js. A redação das questões é própria. As referências orientam conceitos; testes automatizados verificam estrutura e integração, não substituem o aceite pedagógico.

Execute a migração 003 se necessária e a carga conforme docs/carga-questoes.md. A atualização dos arquivos não altera automaticamente o banco da aplicação.
