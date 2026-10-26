// Cronômetro da questão do exame: contagem regressiva e bloqueio da resposta ao esgotar o tempo.
(function () {
  "use strict";
  const DURACAO = 150;
  const MARCOS = [60, 30, 10];

  const tempo = document.getElementById("cronometro-tempo");
  const aviso = document.getElementById("cronometro-aviso");
  const alternativas = document.getElementById("alternativas");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const feedback = document.getElementById("feedback");

  let restante = DURACAO;
  let intervalo = null;

  function formatar(segundos) {
    const minutos = Math.floor(segundos / 60);
    return minutos + ":" + String(segundos % 60).padStart(2, "0");
  }

  function mostrarTempo() {
    tempo.textContent = formatar(restante);
    tempo.dateTime = "PT" + restante + "S";
    // Leitor de tela ouve só os marcos, não cada segundo.
    if (MARCOS.includes(restante)) aviso.textContent = "Restam " + restante + " segundos.";
  }

  function esgotar() {
    clearInterval(intervalo);
    alternativas.disabled = true;
    btnConfirmar.disabled = true;
    feedback.classList.add("feedback--erro");
    feedback.textContent = "Tempo esgotado.";
  }

  function contar() {
    restante -= 1;
    mostrarTempo();
    if (restante === 0) esgotar();
  }

  mostrarTempo();
  intervalo = setInterval(contar, 1000);
})();
