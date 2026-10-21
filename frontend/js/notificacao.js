/* Notificação de sucesso para cadastro */

(function () {
  "use strict";

  // Ícones Lucide "check-check" e "x" (constantes, sem dados do usuário)
  const ICONE_SUCESSO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>';
  const ICONE_FECHAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  const DURACAO_PADRAO = 4000;
  const DURACAO_SAIDA = 600;

  // Cria um container para as notificações
  function container() {
    let el = document.querySelector(".notif-container");
    if (!el) {
      el = document.createElement("div");
      el.className = "notif-container";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }

  function criarElemento(tag, classe) {
    const el = document.createElement(tag);
    el.className = classe;
    return el;
  }

  function sucesso(titulo, mensagem, opcoes) {
    const config = Object.assign({ duracao: DURACAO_PADRAO, aoFechar: null }, opcoes);
    const duracao = Number(config.duracao) > 0 ? Number(config.duracao) : DURACAO_PADRAO;

    const notif = criarElemento("div", "notif");

    const icone = criarElemento("div", "notif__icone");
    icone.innerHTML = ICONE_SUCESSO;

    const fechar = criarElemento("button", "notif__fechar");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar notificação");
    fechar.innerHTML = ICONE_FECHAR;

    // Define a criação dos elementos
    const h = criarElemento("h3", "notif__titulo");
    h.textContent = titulo;
    const p = criarElemento("p", "notif__mensagem");
    p.textContent = mensagem;

    const timer = criarElemento("div", "notif__timer");
    const barra = criarElemento("span", "notif__barra");
    barra.style.animationDuration = duracao + "ms";
    timer.appendChild(barra);

    notif.append(icone, fechar, h, p, timer);
    container().appendChild(notif);

    let restante = duracao;
    let inicio = 0;
    let temporizador = null;
    let fechada = false;
    let mouseDentro = false;
    let focoDentro = false;

    function rodar() {
      if (fechada || temporizador) return;
      inicio = Date.now();
      temporizador = setTimeout(remover, restante);
      notif.classList.remove("notif--pausada");
    }

    function pausar() {
      if (!temporizador) return;
      clearTimeout(temporizador);
      temporizador = null;
      restante = Math.max(0, restante - (Date.now() - inicio));
      notif.classList.add("notif--pausada");
    }

    // Pausa a contagem com o mouse ou teclado
    function atualizarPausa() {
      if (mouseDentro || focoDentro) pausar();
      else rodar();
    }

    function remover() {
      if (fechada) return;
      fechada = true;
      clearTimeout(temporizador);
      temporizador = null;
      notif.classList.add("notif--saindo");
      setTimeout(function () {
        notif.remove();
        if (typeof config.aoFechar === "function") config.aoFechar();
      }, DURACAO_SAIDA);
    }

    notif.addEventListener("mouseenter", function () { mouseDentro = true; atualizarPausa(); });
    notif.addEventListener("mouseleave", function () { mouseDentro = false; atualizarPausa(); });
    notif.addEventListener("focusin", function () { focoDentro = true; atualizarPausa(); });
    notif.addEventListener("focusout", function () { focoDentro = false; atualizarPausa(); });
    fechar.addEventListener("click", remover);

    rodar();

    return { fechar: remover };
  }

  window.Notificacao = { sucesso: sucesso };
})();
