/*
 * Menu principal + perfil. Carrega a sessão, o progresso dos estudos e o do
 * exame, e monta a constelação, o botão principal e os atalhos.
 */
(function () {
  "use strict";
  const TOTAL_TEMAS = 12;
  const aviso = document.getElementById("aviso-menu");
  const sair = document.getElementById("sair");
  const perfil = document.getElementById("perfil");
  const legenda = document.getElementById("constelacao-legenda");
  const certificados = document.getElementById("atalho-certificados");
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Texto padrão da legenda ("N de 12 temas estudados"), guardado como nós
  // para ser restaurado depois do destaque sem usar innerHTML.
  // A referência direta ao <strong> funciona mesmo enquanto ele está fora da
  // legenda (durante o destaque de um tema).
  const legendaPadrao = Array.from(legenda.childNodes);
  const temasEstudados = document.getElementById("temas-estudados");

  function texto(id, valor) { document.getElementById(id).textContent = valor; }

  function limparAviso() {
    aviso.classList.remove("aviso--erro");
    aviso.textContent = "";
  }

  function mostrarErro(mensagem) {
    aviso.classList.add("aviso--erro");
    aviso.textContent = mensagem || "Não foi possível concluir a solicitação. Tente novamente.";
  }

  async function pedirJson(url) {
    const resposta = await fetch(url, { cache: "no-store" });
    if (!resposta.ok) throw new Error(url);
    return resposta.json();
  }

  function destacarNaLegenda(descricao) {
    if (descricao) legenda.textContent = descricao;
    else legenda.replaceChildren.apply(legenda, legendaPadrao);
  }

  function desenharConstelacao(temas) {
    window.Constelacao.desenhar(document.getElementById("constelacao"), temas, destacarNaLegenda);
  }

  // Perfil: constelação e contagem dos temas estudados.
  function mostrarEstudos(temas) {
    const estudados = temas.filter(function (tema) { return tema.percentual === 100; }).length;
    temasEstudados.textContent = estudados + " de " + TOTAL_TEMAS;
    texto("atalho-temas", estudados + "/" + TOTAL_TEMAS);
    desenharConstelacao(temas);
  }

  function configurarContinuar(acao, detalhe, destino) {
    texto("continuar-acao", acao);
    texto("continuar-detalhe", detalhe);
    document.getElementById("btn-continuar").href = destino;
  }

  function bloquearCertificados(faltam) {
    certificados.classList.add("is-bloqueado");
    certificados.setAttribute("aria-disabled", "true");
    texto("certificados-desc", "Libera ao concluir o exame: " +
      (faltam === 1 ? "falta 1 tema" : "faltam " + faltam + " temas"));
  }

  // Certificação: botão principal, resumo do exame e trava de Certificados.
  function mostrarExame(progresso) {
    const temas = Array.isArray(progresso.temas) ? progresso.temas : [];
    const respondidos = temas.filter(function (tema) { return tema.estado === "concluido"; }).length;
    const emAndamento = temas.find(function (tema) { return tema.estado === "em_andamento"; });
    texto("exame-respondidos", respondidos + " de " + TOTAL_TEMAS + " temas");
    texto("atalho-exames", respondidos + "/" + TOTAL_TEMAS);

    if (progresso.certificacao_concluida) {
      const nota = Number(progresso.nota_final).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
      const situacao = progresso.aprovado ? "aprovado" : "não aprovado";
      texto("exame-nota", nota + " (" + situacao + ")");
      configurarContinuar("Ver resultado", "Nota " + nota + ", " + situacao, "certificados.html");
      certificados.classList.remove("is-bloqueado");
      certificados.removeAttribute("aria-disabled");
      texto("certificados-desc", "Consulte o resultado da sua certificação");
      return;
    }

    texto("exame-nota", "Sai ao concluir");
    bloquearCertificados(TOTAL_TEMAS - respondidos);

    // Questão aberta: vai para a lista de exames, que trata a interrupção.
    // Nunca para exame.html, porque reabrir o tema encerraria a questão como errada.
    if (emAndamento) {
      configurarContinuar("Retomar exame",
        "O tema " + emAndamento.ordem + ", " + emAndamento.nome + ", tem uma questão aberta", "exames.html");
      return;
    }
    const proximo = progresso.proximo_tema == null ? null : temas.find(function (tema) {
      return Number(tema.ordem) === Number(progresso.proximo_tema);
    });
    if (proximo) {
      configurarContinuar(respondidos === 0 ? "Iniciar exame" : "Continuar exame",
        "Próximo: tema " + proximo.ordem + ", " + proximo.nome, "exame.html?tema=" + Number(proximo.ordem));
    } else {
      configurarContinuar("Ir para o exame", "Veja a situação de cada tema", "exames.html");
    }
  }

  async function carregarUsuario() {
    limparAviso();
    let resposta;
    try {
      resposta = await fetch("/api/auth/usuario", { cache: "no-store" });
    } catch {
      mostrarErro("Sem conexão com o servidor. Verifique a internet e recarregue a página.");
      return;
    }
    if (resposta.status === 401) { window.location.replace("/pages/login.html"); return; }
    if (!resposta.ok) { mostrarErro(); return; }

    let usuario;
    try { usuario = await resposta.json(); } catch { mostrarErro(); return; }
    // textContent apresenta o nome como texto, sem executar HTML.
    texto("nome-usuario", usuario.nome);
    texto("perfil-nome", usuario.nome);

    const [estudos, exame] = await Promise.allSettled([
      pedirJson("/api/estudos"),
      pedirJson("/api/exames/progresso"),
    ]);
    if (estudos.status === "fulfilled" && Array.isArray(estudos.value)) mostrarEstudos(estudos.value);
    else desenharConstelacao([]);
    if (exame.status === "fulfilled") mostrarExame(exame.value);
    else configurarContinuar("Ir para o exame", "Progresso do exame indisponível agora", "exames.html");
    if (estudos.status === "rejected" || exame.status === "rejected") {
      mostrarErro("Parte do seu progresso não carregou. Recarregue a página para tentar de novo.");
    }
  }

  certificados.addEventListener("click", function (evento) {
    if (certificados.classList.contains("is-bloqueado")) evento.preventDefault();
  });

  // Perfil no topo: leva à coluna do perfil e marca onde ela está.
  function destacarPerfil() {
    perfil.classList.remove("is-destaque");
    void perfil.offsetWidth; // reinicia a animação se o botão for clicado de novo
    perfil.classList.add("is-destaque");
    perfil.focus({ preventScroll: true });
  }
  perfil.addEventListener("animationend", function (evento) {
    // As estrelas da constelação também animam; só a animação do próprio perfil encerra o destaque.
    if (evento.target === perfil) perfil.classList.remove("is-destaque");
  });
  document.getElementById("ir-perfil").addEventListener("click", function (evento) {
    evento.preventDefault();
    perfil.scrollIntoView({ behavior: reduzirMovimento.matches ? "auto" : "smooth", block: "start" });
    destacarPerfil();
  });
  if (window.location.hash === "#perfil") destacarPerfil();

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
