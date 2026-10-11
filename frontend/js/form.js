/* Validação e envio dos formulários de cadastro e login */

(function () {
  "use strict";

  const CHAVE_CPF = "borb:cpfCadastrado";
  const PAGINA_LOGIN = "login.html";
  const DURACAO_SUCESSO = 3000;

  const MSG_OBRIGATORIO = "Preencha este campo.";
  const MSG_CPF_DUPLICADO = "Este CPF já possui cadastro.";
  const MSG_ERRO_GENERICO = "Não foi possível concluir a solicitação. Tente novamente.";

  function somenteDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  function mascararCpf(valor) {
    const d = somenteDigitos(valor).slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }

  // Confere os dois dígitos verificadores
  function cpfValido(valor) {
    const d = somenteDigitos(valor);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (let t = 9; t < 11; t++) {
      let soma = 0;
      for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
      if (((soma * 10) % 11) % 10 !== Number(d[t])) return false;
    }
    return true;
  }

  function erroDoCampo(campo) {
    return document.getElementById(campo.id + "-erro");
  }

  function marcarErro(campo, mensagem) {
    const el = erroDoCampo(campo);
    if (el) el.textContent = mensagem;
    campo.setAttribute("aria-invalid", "true");
  }

  function limparErro(campo) {
    const el = erroDoCampo(campo);
    if (el) el.textContent = "";
    campo.removeAttribute("aria-invalid");
  }

  // Retorna a mensagem de erro do campo (vazia quando está válido)
  function validarCampo(form, campo) {
    const valor = campo.type === "checkbox" ? campo.checked
      : (campo.name === "senha" || campo.name === "confirmarSenha") ? campo.value : campo.value.trim();

    if (campo.required && !valor) {
      return campo.dataset.msgObrigatorio || MSG_OBRIGATORIO;
    }
    if (campo.type === "checkbox" || !valor) return "";

    if (campo.hasAttribute("data-nome-completo") && valor.split(/\s+/).length < 2) {
      return "Informe nome e sobrenome.";
    }
    if (campo.hasAttribute("data-cpf") && !cpfValido(valor)) {
      return "Informe um CPF válido.";
    }
    if (campo.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      return "Informe um e-mail válido.";
    }
    if (campo.name === "senha" && valor.length > 1024) return "A senha deve ter no máximo 1024 caracteres.";
    if (campo.dataset.min && valor.length < Number(campo.dataset.min)) {
      return "A senha deve ter pelo menos " + campo.dataset.min + " caracteres.";
    }
    if (campo.hasAttribute("data-senha-forte") && !(/[A-Za-z]/.test(valor) && /\d/.test(valor))) {
      return "A senha deve ter letras e números.";
    }
    if (campo.dataset.igual) {
      const outro = form.querySelector("#" + campo.dataset.igual);
      if (outro && outro.value !== campo.value) return "As senhas não coincidem.";
    }
    return "";
  }

  function validarFormulario(form) {
    let primeiroInvalido = null;
    form.querySelectorAll("input").forEach(function (campo) {
      const mensagem = validarCampo(form, campo);
      if (mensagem) {
        marcarErro(campo, mensagem);
        if (!primeiroInvalido) primeiroInvalido = campo;
      } else {
        limparErro(campo);
      }
    });
    if (primeiroInvalido) primeiroInvalido.focus();
    return !primeiroInvalido;
  }

  // Campos com data-nao-enviar ficam fora do corpo da requisição
  function montarDados(form) {
    const dados = {};
    form.querySelectorAll("input[name]").forEach(function (campo) {
      if (campo.hasAttribute("data-nao-enviar")) return;
      if (campo.type === "checkbox") dados[campo.name] = campo.checked;
      else if (campo.hasAttribute("data-cpf")) dados[campo.name] = somenteDigitos(campo.value);
      else if (campo.name === "senha" || campo.name === "confirmarSenha") dados[campo.name] = campo.value;
      else dados[campo.name] = campo.value.trim();
    });
    return dados;
  }

  function mostrarAviso(form, mensagem, tipo) {
    const aviso = form.querySelector(".aviso");
    if (!aviso) return;
    aviso.classList.remove("aviso--sucesso", "aviso--erro");
    if (tipo) aviso.classList.add("aviso--" + tipo);
    aviso.textContent = mensagem;
  }

  // Guarda o CPF para o login sem expor o dado na URL
  function salvarCpfCadastrado(cpf) {
    try {
      sessionStorage.setItem(CHAVE_CPF, cpf);
    } catch (e) {
      // Sem storage o login apenas abre com o campo vazio
    }
  }

  function lerCpfCadastrado() {
    try {
      const cpf = sessionStorage.getItem(CHAVE_CPF);
      sessionStorage.removeItem(CHAVE_CPF);
      return cpf;
    } catch (e) {
      return null;
    }
  }

  function preencherCpf(form) {
    const cpf = somenteDigitos(lerCpfCadastrado());
    const campoCpf = form.querySelector("[data-cpf]");
    if (cpf.length !== 11 || !campoCpf) return;
    campoCpf.value = mascararCpf(cpf);
    const senha = form.querySelector('input[type="password"]');
    if (senha) senha.focus();
  }

  // Só o 201 mostra a notificação e leva ao login
  function concluirCadastro(form, dados) {
    if (dados.cpf) salvarCpfCadastrado(dados.cpf);

    function irParaLogin() {
      window.location.href = PAGINA_LOGIN;
    }

    if (!window.Notificacao) {
      irParaLogin();
      return;
    }
    window.Notificacao.sucesso(form.dataset.sucessoTitulo || "", form.dataset.sucesso || "", {
      duracao: DURACAO_SUCESSO,
      aoFechar: irParaLogin,
    });
  }

  function mostrarCpfDuplicado(form, mensagem) {
    const campoCpf = form.querySelector("[data-cpf]");
    if (!campoCpf) {
      mostrarAviso(form, mensagem, "erro");
      return;
    }
    marcarErro(campoCpf, mensagem);
    campoCpf.focus();
  }

  async function lerJson(resposta) {
    try {
      return await resposta.json();
    } catch (e) {
      return {};
    }
  }

  async function enviar(evento) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const botao = form.querySelector('[type="submit"]');

    // requestSubmit() dispara o submit mesmo com o botão desabilitado
    if (botao && botao.disabled) return;

    mostrarAviso(form, "");
    if (!validarFormulario(form)) return;

    const dados = montarDados(form);
    if (botao) botao.disabled = true;

    let resposta;
    try {
      resposta = await fetch(form.dataset.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
    } catch (e) {
      mostrarAviso(form, MSG_ERRO_GENERICO, "erro");
      if (botao) botao.disabled = false;
      return;
    }

    const corpo = await lerJson(resposta);

    // O botão continua desabilitado até o redirecionamento
    if (resposta.status === 201 && form.dataset.sucesso) {
      concluirCadastro(form, dados);
      return;
    }

    // O cadastro mantém o fluxo de notificação acima.
    if (resposta.ok && form.dataset.redirecionar) {
      window.location.href = form.dataset.redirecionar;
      return;
    }
    if (botao) botao.disabled = false;

    if (resposta.status === 409) {
      mostrarCpfDuplicado(form, corpo.mensagem || MSG_CPF_DUPLICADO);
    } else if (resposta.status === 401 && form.dataset.redirecionar) {
      mostrarAviso(form, "CPF ou senha incorretos", "erro");
    } else if (resposta.ok) {
      mostrarAviso(form, corpo.mensagem || "", "sucesso");
    } else {
      mostrarAviso(form, MSG_ERRO_GENERICO, "erro");
    }
  }

  function configurarOlhos(form) {
    form.querySelectorAll(".btn-olho").forEach(function (btn) {
      const campo = document.getElementById(btn.getAttribute("aria-controls"));
      if (!campo) return;
      btn.addEventListener("click", function () {
        const mostrar = campo.type === "password";
        campo.type = mostrar ? "text" : "password";
        btn.setAttribute("aria-pressed", String(mostrar));
        btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      });
    });
  }

  function iniciar(form) {
    form.querySelectorAll("[data-cpf]").forEach(function (campo) {
      campo.addEventListener("input", function () {
        campo.value = mascararCpf(campo.value);
      });
    });

    // Limpa o erro do campo assim que o usuário corrige
    form.querySelectorAll("input").forEach(function (campo) {
      const evento = campo.type === "checkbox" ? "change" : "input";
      campo.addEventListener(evento, function () {
        if (campo.getAttribute("aria-invalid") === "true" && !validarCampo(form, campo)) {
          limparErro(campo);
        }
      });
    });

    configurarOlhos(form);
    if (form.hasAttribute("data-preencher-cpf")) preencherCpf(form);
    form.addEventListener("submit", enviar);
  }

  document.querySelectorAll("form[data-validar]").forEach(iniciar);
})();
