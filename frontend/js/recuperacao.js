(function () {
  "use strict";
  const solicitarForm = document.getElementById("form-solicitar");
  const redefinirForm = document.getElementById("form-redefinir");
  const solicitarBotao = document.getElementById("solicitar");
  const redefinirBotao = document.getElementById("redefinir");
  const cpf = document.getElementById("cpf");
  const email = document.getElementById("email");
  const codigo = document.getElementById("codigo");
  const senha = document.getElementById("senha");
  const confirmar = document.getElementById("confirmarSenha");
  let solicitacaoId = null;
  let liberarEm = 0;
  let enviando = false;
  let concluido = false;

  function mensagem(id, texto, erro) {
    const aviso = document.getElementById(id);
    aviso.classList.toggle("aviso--erro", erro);
    aviso.classList.toggle("aviso--sucesso", !erro);
    aviso.textContent = texto;
  }
  function atualizarBotoes() {
    const segundos = Math.max(0, Math.ceil((liberarEm - Date.now()) / 1000));
    solicitarBotao.disabled = enviando || concluido || segundos > 0;
    redefinirBotao.disabled = enviando || concluido;
    cpf.disabled = email.disabled = enviando || concluido;
    document.getElementById("tempo-reenvio").textContent = segundos ? "Você pode pedir outro código em " + segundos + " segundos." : "";
  }
  async function enviar(destino, dados) {
    const resposta = await fetch("/api/auth/recuperacao/" + destino, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados),
    });
    const corpo = await resposta.json();
    return { resposta, corpo };
  }
  cpf.addEventListener("input", function () {
    cpf.value = cpf.value.replace(/\D/g, "").slice(0, 11);
    cpf.setCustomValidity( /^\d{11}$/.test(cpf.value) ? "" : "Informe os 11 dígitos do CPF." );
  });
  codigo.addEventListener("input", function () { codigo.value = codigo.value.replace(/\D/g, ""); });
  senha.addEventListener("input", function () { senha.setCustomValidity(""); confirmar.setCustomValidity(""); });
  confirmar.addEventListener("input", function () { confirmar.setCustomValidity(""); });
  // Alterar a identidade exige um novo pedido; evita misturar duas contas na tela.
  [cpf, email].forEach(function (campo) {
    campo.addEventListener("input", function () { solicitacaoId = null; redefinirForm.hidden = true; });
  });
  solicitarForm.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (enviando || concluido || Date.now() < liberarEm) return;
    cpf.setCustomValidity(/^\d{11}$/.test(cpf.value.replace(/\D/g, "")) ? "" : "Informe os 11 dígitos do CPF.");
    if (!solicitarForm.reportValidity()) return;
    const dados = { cpf: cpf.value, email: email.value.trim() };
    enviando = true;
    // Mesmo uma falha de rede pode ter chegado ao servidor: aguarde para reenviar.
    liberarEm = Date.now() + 60000;
    atualizarBotoes();
    try {
      const { resposta, corpo } = await enviar("solicitar", dados);
      if (Number.isFinite(corpo.aguardarSegundos)) liberarEm = Date.now() + corpo.aguardarSegundos * 1000;
      mensagem("aviso-solicitar", corpo.mensagem, !resposta.ok);
      if (resposta.ok) {
        solicitacaoId = corpo.solicitacaoId;
        redefinirForm.hidden = false;
        codigo.value = "";
        solicitarBotao.textContent = "Enviar outro código";
        codigo.focus();
      }
    } catch { mensagem("aviso-solicitar", "Não foi possível solicitar o código. Tente novamente.", true); }
    finally { enviando = false; atualizarBotoes(); }
  });
  redefinirForm.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (enviando || concluido || !solicitacaoId) return;
    senha.setCustomValidity(senha.value.length >= 8 && /[A-Za-z]/.test(senha.value) && /\d/.test(senha.value) ? "" : "Use pelo menos 8 caracteres, incluindo letras e números.");
    confirmar.setCustomValidity(senha.value === confirmar.value ? "" : "As senhas não coincidem.");
    if (!redefinirForm.reportValidity()) return;
    const dados = { solicitacaoId, codigo: codigo.value, senha: senha.value, confirmarSenha: confirmar.value };
    enviando = true; atualizarBotoes();
    try {
      const { resposta, corpo } = await enviar("redefinir", dados);
      mensagem("aviso-redefinir", corpo.mensagem, !resposta.ok);
      if (resposta.ok) {
        concluido = true;
        senha.value = confirmar.value = codigo.value = "";
        // Volta ao login; a recuperação não cria uma sessão autenticada.
        window.setTimeout(function () { window.location.replace("/pages/login.html"); }, 2500);
      }
    } catch { mensagem("aviso-redefinir", "Não foi possível alterar a senha. Tente novamente.", true); }
    finally { enviando = false; atualizarBotoes(); }
  });
  window.setInterval(atualizarBotoes, 1000);
})();
