/*
 * Constelação dos 12 temas no perfil. Cada tema é uma estrela ligada à
 * seguinte, na ordem de estudo; o brilho mostra quanto do tema foi estudado:
 * 100% = estrela acesa, parcial = estrela média com anel de progresso,
 * 0% = estrela pequena apagada. Cada estrela abre o tema em estudos.html.
 *
 * Uso: Constelacao.desenhar(svg, [{ordem, nome, percentual}], aoDestacar).
 * aoDestacar(descricao) é chamada no mouseenter/focus e aoDestacar(null) no
 * mouseleave/blur. O nome entra no aria-label via setAttribute e na legenda
 * via textContent (no menu.js), nunca como HTML.
 */
(function () {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";
  const PONTOS = [
    [30, 44], [80, 24], [126, 62], [92, 108], [40, 142], [88, 192],
    [150, 166], [198, 122], [178, 64], [234, 34], [288, 80], [264, 172],
  ];

  function el(nome, atributos) {
    const no = document.createElementNS(SVG, nome);
    for (const chave in atributos) no.setAttribute(chave, atributos[chave]);
    return no;
  }

  // Estrela de quatro pontas com lados côncavos.
  function brilho(r) {
    return `M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z`;
  }

  function estado(percentual) {
    if (percentual >= 100) return "acesa";
    if (percentual > 0) return "parcial";
    return "apagada";
  }

  function desenhar(svg, temas, aoDestacar) {
    const destacar = typeof aoDestacar === "function" ? aoDestacar : function () {};
    // A entrada em sequência acontece só no primeiro desenho; redesenhos
    // (ex.: pageshow ao voltar pelo navegador) mostram as estrelas direto.
    if (svg.childElementCount) svg.classList.add("sem-entrada");
    svg.replaceChildren();
    const porOrdem = new Map((temas || []).map(function (t) { return [Number(t.ordem), t]; }));

    const linhas = el("g", { class: "constelacao-linhas" });
    for (let i = 0; i < PONTOS.length - 1; i++) {
      const a = porOrdem.get(i + 1);
      const b = porOrdem.get(i + 2);
      const acesa = a && b && a.percentual >= 100 && b.percentual > 0;
      linhas.append(el("line", {
        x1: PONTOS[i][0], y1: PONTOS[i][1], x2: PONTOS[i + 1][0], y2: PONTOS[i + 1][1],
        class: acesa ? "linha-acesa" : "linha-apagada",
      }));
    }
    svg.append(linhas);

    PONTOS.forEach(function (ponto, i) {
      const ordem = i + 1;
      const tema = porOrdem.get(ordem) || { ordem: ordem, nome: "Tema " + ordem, percentual: 0 };
      const percentual = Math.max(0, Math.min(100, Number(tema.percentual) || 0));
      const tipo = estado(percentual);
      const nome = tema.nome || "Tema " + ordem;
      const descricao = `Tema ${ordem}, ${nome}: ${percentual}% estudado`;

      const link = el("a", {
        href: `estudos.html?tema=${ordem}`,
        class: `estrela estrela--${tipo}`,
        "aria-label": descricao,
        style: `--i:${i}`,
      });
      const grupo = el("g", { transform: `translate(${ponto[0]} ${ponto[1]})` });
      grupo.append(el("circle", { r: 18, class: "estrela-alvo" }));

      if (tipo === "acesa") {
        grupo.append(el("circle", { r: 13, class: "estrela-halo" }));
        grupo.append(el("path", { d: brilho(12), class: "estrela-forma" }));
      } else if (tipo === "parcial") {
        const raio = 14;
        const volta = 2 * Math.PI * raio;
        grupo.append(el("circle", { r: raio, class: "estrela-trilho" }));
        grupo.append(el("circle", {
          r: raio, class: "estrela-anel",
          "stroke-dasharray": `${(volta * percentual) / 100} ${volta}`,
          transform: "rotate(-90)",
        }));
        grupo.append(el("path", { d: brilho(6 + percentual / 25), class: "estrela-forma" }));
      } else {
        grupo.append(el("path", { d: brilho(6), class: "estrela-forma" }));
      }

      const numero = el("text", { x: 0, y: tipo === "apagada" ? 20 : 28, class: "estrela-numero" });
      numero.textContent = ordem;
      grupo.append(numero);

      link.append(grupo);
      ["mouseenter", "focus"].forEach(function (evento) {
        link.addEventListener(evento, function () { destacar(descricao); });
      });
      ["mouseleave", "blur"].forEach(function (evento) {
        link.addEventListener(evento, function () { destacar(null); });
      });
      svg.append(link);
    });
  }

  window.Constelacao = { desenhar: desenhar };
})();
