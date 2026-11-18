(function () {
  "use strict";

  const parametros = new URLSearchParams(window.location.search);
  let veioDoMenu = parametros.get("origem") === "menu";

  if (!veioDoMenu && document.referrer) {
    try {
      veioDoMenu = new URL(document.referrer).pathname.endsWith("/menu.html");
    } catch (_) {
      veioDoMenu = false;
    }
  }

  if (!veioDoMenu) return;

  const marca = document.querySelector(".legal-marca");
  if (marca) marca.setAttribute("href", "menu.html");

  document.querySelectorAll('a[href$="privacidade.html"], a[href^="privacidade.html"], a[href$="termos.html"], a[href^="termos.html"]').forEach(function (link) {
    const destino = new URL(link.getAttribute("href"), window.location.href);
    destino.searchParams.set("origem", "menu");
    link.setAttribute("href", destino.pathname.split("/").pop() + destino.search);
  });

  const acoes = document.querySelector(".legal-acoes");
  if (!acoes) return;

  acoes.replaceChildren();

  const voltar = document.createElement("a");
  voltar.className = "legal-voltar";
  voltar.href = "menu.html";
  voltar.textContent = "← Voltar ao menu";
  acoes.appendChild(voltar);
})();
