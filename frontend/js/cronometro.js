// Cronômetro da questão do exame: contagem regressiva e bloqueio da resposta ao esgotar o tempo.
(function () {
  "use strict";
  const MARCOS = [60, 30, 10];
  const tempo = document.getElementById("cronometro-tempo");
  const aviso = document.getElementById("cronometro-aviso");
  const alternativas = document.getElementById("alternativas");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const feedback = document.getElementById("feedback");
  let intervalo = null;

  function formatar(segundos) {
    const minutos = Math.floor(segundos / 60);
    return minutos + ":" + String(segundos % 60).padStart(2, "0");
  }

  function parar() {
    clearInterval(intervalo);
    intervalo = null;
  }

  function iniciar(segundosRestantes, aoEsgotar) {
    parar();
    const horarioFinal = Date.now() + Math.max(0, segundosRestantes) * 1000;
    let anterior = Infinity;
    aviso.textContent = "";

    function contar() {
      const restante = Math.max(0, Math.ceil((horarioFinal - Date.now()) / 1000));
      tempo.textContent = formatar(restante);
      tempo.dateTime = "PT" + restante + "S";
      // Anuncia também quando um tique atrasado atravessa um marco.
      const marco = MARCOS.some(segundos => anterior > segundos && restante <= segundos);
      if (marco && restante > 0) aviso.textContent = "Restam " + restante + " segundos.";
      anterior = restante;
      if (restante === 0) {
        parar();
        alternativas.disabled = true;
        btnConfirmar.disabled = true;
        feedback.classList.add("feedback--erro");
        feedback.textContent = "Tempo esgotado, confirmando...";
        aoEsgotar();
      }
    }

    intervalo = setInterval(contar, 1000);
    contar();
  }

  window.cronometro = { iniciar, parar };
})();
