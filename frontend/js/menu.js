(function () {
  "use strict";
  const aviso = document.getElementById("aviso-menu");
  const sair = document.getElementById("sair");
  function mostrarErro() {
    aviso.classList.add("aviso--erro");
    aviso.textContent = "Não foi possível concluir a solicitação. Tente novamente.";
  }
  async function carregarUsuario() {
    try {
      const resposta = await fetch("/api/auth/usuario", { cache: "no-store" });
      if (resposta.status === 401) { window.location.replace("/pages/login.html"); return; }
      if (!resposta.ok) throw new Error("Falha ao carregar usuário");
      const usuario = await resposta.json();
      // textContent apresenta o nome como texto, sem executar HTML.
      document.getElementById("boas-vindas").textContent = "Boas-vindas, " + usuario.nome + "!";
      document.querySelectorAll("[data-em-breve]").forEach(function (botao) { botao.disabled = false; });
    } catch { mostrarErro(); }
  }
  document.querySelectorAll("[data-em-breve]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      aviso.classList.remove("aviso--erro"); aviso.textContent = "Em breve";
    });
  });
  sair.addEventListener("click", async function () {
    sair.disabled = true;
    try {
      const resposta = await fetch("/api/auth/logout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      if (!resposta.ok) throw new Error("Falha ao sair");
      window.location.replace("/pages/login.html");
    } catch { mostrarErro(); sair.disabled = false; }
  });
  // Confere a sessão também quando o botão Voltar restaura a página.
  window.addEventListener("pageshow", carregarUsuario);
})();
