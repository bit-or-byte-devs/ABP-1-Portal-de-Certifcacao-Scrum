/* O form.js mantém a validação e o envio; este módulo apresenta a confirmação. */
(function () {
  "use strict";
  const form = document.querySelector('form[data-endpoint="/api/candidatos"]');
  const modal = document.getElementById("successModal");
  if (!form || !modal) return;
  const iniciar = document.getElementById("btnIniciar");
  const fechar = document.getElementById("btnFechar");
  function irParaMenu() { window.location.href = "menu.html"; }
  form.addEventListener("cadastro:sucesso", function (evento) {
    evento.preventDefault();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    iniciar.focus();
  });
  iniciar.addEventListener("click", function () { window.location.href = "exames.html"; });
  fechar.addEventListener("click", irParaMenu);
  modal.addEventListener("click", function (evento) {
    if (evento.target === modal) irParaMenu();
  });
  modal.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") irParaMenu();
    if (evento.key === "Tab") {
      evento.preventDefault();
      (document.activeElement === iniciar ? fechar : iniciar).focus();
    }
  });
})();
