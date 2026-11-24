// Recuperação de senha em uma página só: (a) e-mail, (b) código, (c) nova senha.
// E-mail e código ficam apenas nestas variáveis: nunca em localStorage, sessionStorage ou URL.
(function () {
  "use strict";
  const API = "/api/auth/recuperacao/";
  // Só um aviso sem dados pessoais para o login exibir a mensagem de sucesso.
  const CHAVE_SENHA_REDEFINIDA = "borb:senhaRedefinida";
  const ESPERA_PADRAO_SEGUNDOS = 60;

  const formularios = {
    email: document.getElementById("form-email"),
    codigo: document.getElementById("form-codigo"),
    senha: document.getElementById("form-senha"),
  };
  const campoEmail = document.getElementById("email");
  const campoCodigo = document.getElementById("codigo");
  const campoSenha = document.getElementById("senha");
  const campoConfirmar = document.getElementById("confirmar-senha");
  const botaoEnviar = document.getElementById("enviar-codigo");
  const botaoConfirmar = document.getElementById("confirmar-codigo");
  const botaoAlterar = document.getElementById("alterar-senha");
  const botaoReenviar = document.getElementById("reenviar");
  const botaoTrocarEmail = document.getElementById("trocar-email");

  let email = "";
  let codigo = "";
  let liberarReenvioEm = 0;
  let enviando = false;
  let concluido = false;

  // ---------- Regras espelhadas do servidor (o servidor continua sendo a fonte de verdade) ----------
  function normalizarEmail(valor) {
    return valor.trim().toLowerCase();
  }
  function erroEmail(valor) {
    if (!valor) return "Informe o e-mail cadastrado.";
    if (valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return "Informe um e-mail válido.";
    return "";
  }
  function erroCodigo(valor) {
    return /^\d{6}$/.test(valor) ? "" : "Informe os seis dígitos do código.";
  }
  function erroSenha(valor) {
    if (valor.length < 8 || valor.length > 1024) return "A senha deve ter de 8 a 1024 caracteres.";
    if (!/[A-Za-z]/.test(valor) || !/\d/.test(valor)) return "A senha deve ter letras e números.";
    return "";
  }

  // ---------- Mensagens ----------
  function mostrarErroCampo(campo, texto) {
    const erro = document.getElementById(campo.id + "-erro");
    erro.textContent = texto;
    campo.setAttribute("aria-invalid", texto ? "true" : "false");
  }
  function mostrarAviso(etapa, texto, tipo) {
    const aviso = document.getElementById("aviso-" + etapa);
    aviso.classList.remove("aviso--erro", "aviso--sucesso");
    if (tipo) aviso.classList.add("aviso--" + tipo);
    aviso.textContent = texto || "";
  }
  function limparMensagens() {
    [campoEmail, campoCodigo, campoSenha, campoConfirmar].forEach(function (campo) { mostrarErroCampo(campo, ""); });
    Object.keys(formularios).forEach(function (etapa) { mostrarAviso(etapa, ""); });
  }

  // ---------- Etapas ----------
  function irPara(etapa) {
    Object.keys(formularios).forEach(function (nome) { formularios[nome].hidden = nome !== etapa; });
    document.querySelectorAll(".etapas__item").forEach(function (item) {
      if (item.dataset.etapa === etapa) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    const foco = { email: campoEmail, codigo: campoCodigo, senha: campoSenha }[etapa];
    foco.focus();
  }

  // ---------- Reenvio: respeita o intervalo informado pelo servidor ----------
  function segundosParaReenvio() {
    return Math.max(0, Math.ceil((liberarReenvioEm - Date.now()) / 1000));
  }
  function aguardarReenvio(segundos) {
    liberarReenvioEm = Date.now() + Math.max(0, segundos) * 1000;
    atualizarBotoes();
  }
  function atualizarBotoes() {
    const restante = segundosParaReenvio();
    botaoEnviar.disabled = enviando || concluido || restante > 0;
    botaoEnviar.textContent = restante > 0 ? "Aguarde " + restante + " s" : "Enviar código";
    botaoReenviar.disabled = enviando || concluido || restante > 0;
    botaoReenviar.textContent = restante > 0 ? "Reenviar código em " + restante + " s" : "Reenviar código";
    botaoConfirmar.disabled = botaoAlterar.disabled = botaoTrocarEmail.disabled = enviando || concluido;
  }

  // ---------- Comunicação com a API: sempre POST com JSON ----------
  async function enviar(rota, dados) {
    const resposta = await fetch(API + rota, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(dados),
      credentials: "same-origin",
      cache: "no-store",
    });
    let corpo = {};
    try { corpo = await resposta.json(); } catch (e) { corpo = {}; }
    return { status: resposta.status, corpo: corpo };
  }
  function esperaInformada(corpo) {
    return Number.isFinite(corpo.aguardarSegundos) ? corpo.aguardarSegundos : ESPERA_PADRAO_SEGUNDOS;
  }
  async function executar(acao) {
    if (enviando || concluido) return;
    enviando = true; atualizarBotoes();
    try { await acao(); }
    finally { enviando = false; atualizarBotoes(); }
  }

  // ---------- (a) Solicitar código ----------
  async function solicitarCodigo(etapaDoAviso) {
    const { status, corpo } = await enviar("solicitar", { email: email });
    if (status === 202) {
      aguardarReenvio(esperaInformada(corpo));
      const minutos = Number.isFinite(corpo.expiraEmMinutos) ? corpo.expiraEmMinutos : null;
      document.getElementById("email-informado").textContent = email;
      document.getElementById("validade").textContent = minutos
        ? "Ele vale por " + minutos + (minutos === 1 ? " minuto" : " minutos") + " e só pode ser usado uma vez."
        : "";
      return true;
    }
    if (status === 429) aguardarReenvio(esperaInformada(corpo));
    mostrarAviso(etapaDoAviso, corpo.mensagem || "Não foi possível enviar o código. Tente novamente.", "erro");
    return false;
  }

  formularios.email.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limparMensagens();
    const valor = normalizarEmail(campoEmail.value);
    const erro = erroEmail(valor);
    if (erro) { mostrarErroCampo(campoEmail, erro); campoEmail.focus(); return; }
    executar(async function () {
      email = valor;
      try {
        if (await solicitarCodigo("email")) {
          campoCodigo.value = ""; codigo = "";
          irPara("codigo");
        }
      } catch (e) {
        mostrarAviso("email", "Não foi possível enviar o código. Verifique sua conexão e tente novamente.", "erro");
      }
    });
  });

  // ---------- (b) Verificar código ----------
  // Sem maxlength no HTML: um código colado como "123 456" ou "123-456" não pode ser cortado antes do filtro.
  campoCodigo.addEventListener("input", function () {
    campoCodigo.value = campoCodigo.value.replace(/\D/g, "").slice(0, 6);
    mostrarErroCampo(campoCodigo, "");
  });

  formularios.codigo.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mostrarAviso("codigo", "");
    const valor = campoCodigo.value;
    const erro = erroCodigo(valor);
    if (erro) { mostrarErroCampo(campoCodigo, erro); campoCodigo.focus(); return; }
    executar(async function () {
      try {
        const { status, corpo } = await enviar("verificar", { email: email, codigo: valor });
        if (status === 200) {
          // Só avança com o código confirmado pelo servidor.
          codigo = valor;
          mostrarAviso("senha", "");
          irPara("senha");
          return;
        }
        if (status === 400) {
          mostrarErroCampo(campoCodigo, corpo.mensagem || "Código inválido.");
          campoCodigo.focus();
          return;
        }
        mostrarAviso("codigo", corpo.mensagem || "Não foi possível verificar o código. Tente novamente.", "erro");
      } catch (e) {
        mostrarAviso("codigo", "Não foi possível verificar o código. Verifique sua conexão e tente novamente.", "erro");
      }
    });
  });

  botaoReenviar.addEventListener("click", function () {
    if (segundosParaReenvio() > 0) return;
    mostrarAviso("codigo", "");
    mostrarErroCampo(campoCodigo, "");
    executar(async function () {
      try {
        if (await solicitarCodigo("codigo")) {
          campoCodigo.value = ""; codigo = "";
          mostrarAviso("codigo", "Pedimos um novo código. Use o mais recente; o anterior deixou de valer.", "sucesso");
          campoCodigo.focus();
        }
      } catch (e) {
        mostrarAviso("codigo", "Não foi possível reenviar o código. Verifique sua conexão e tente novamente.", "erro");
      }
    });
  });

  botaoTrocarEmail.addEventListener("click", function () {
    email = ""; codigo = "";
    campoCodigo.value = "";
    // O intervalo de reenvio vale por e-mail; outro e-mail pode ser pedido na hora.
    liberarReenvioEm = 0;
    limparMensagens();
    atualizarBotoes();
    irPara("email");
  });

  // ---------- (c) Nova senha ----------
  document.querySelectorAll(".btn-olho").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const campo = document.getElementById(botao.getAttribute("aria-controls"));
      const mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      botao.setAttribute("aria-pressed", String(mostrar));
      botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    });
  });
  campoSenha.addEventListener("input", function () { mostrarErroCampo(campoSenha, ""); });
  campoConfirmar.addEventListener("input", function () { mostrarErroCampo(campoConfirmar, ""); });

  formularios.senha.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mostrarAviso("senha", "");
    const senha = campoSenha.value;
    const confirmar = campoConfirmar.value;
    const erro = erroSenha(senha);
    mostrarErroCampo(campoSenha, erro);
    mostrarErroCampo(campoConfirmar, !erro && senha !== confirmar ? "As senhas não coincidem." : "");
    if (erro) { campoSenha.focus(); return; }
    if (senha !== confirmar) { campoConfirmar.focus(); return; }
    executar(async function () {
      try {
        const { status, corpo } = await enviar("redefinir", { email: email, codigo: codigo, senha: senha, confirmarSenha: confirmar });
        if (status === 200) {
          concluido = true;
          email = ""; codigo = "";
          campoSenha.value = campoConfirmar.value = campoCodigo.value = campoEmail.value = "";
          try { sessionStorage.setItem(CHAVE_SENHA_REDEFINIDA, "1"); } catch (e) { /* o login só não exibirá o aviso */ }
          mostrarAviso("senha", (corpo.mensagem || "Senha alterada com sucesso.") + " Redirecionando para o login…", "sucesso");
          // Todas as sessões foram encerradas; o candidato entra de novo com a nova senha.
          window.setTimeout(function () { window.location.replace("/pages/login.html"); }, 1500);
          return;
        }
        if (status === 400) {
          // As regras de senha já foram conferidas aqui; um 400 indica que o código deixou de valer
          // (expirou, foi substituído ou atingiu o limite de tentativas). Volta para a etapa do código.
          codigo = "";
          campoCodigo.value = "";
          irPara("codigo");
          mostrarAviso("codigo", corpo.mensagem || "Código inválido. Solicite outro código.", "erro");
          return;
        }
        mostrarAviso("senha", corpo.mensagem || "Não foi possível alterar a senha. Tente novamente.", "erro");
      } catch (e) {
        mostrarAviso("senha", "Não foi possível alterar a senha. Verifique sua conexão e tente novamente.", "erro");
      }
    });
  });

  window.setInterval(atualizarBotoes, 1000);
  atualizarBotoes();
  campoEmail.focus();
})();
