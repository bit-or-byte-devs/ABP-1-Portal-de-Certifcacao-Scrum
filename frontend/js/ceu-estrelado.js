/*
 * Céu estrelado de fundo: estrelas fixas que cintilam e estrelas cadentes.
 *
 * Estrelas cadentes: exatamente CADENTES_POR_CICLO a cada CICLO_MS (8 por
 * minuto), uma em cada fatia do ciclo, cada uma numa direção diferente
 * (direções espalhadas pelos 360 graus, em ordem embaralhada). Cada estrela
 * nasce fora da tela, atravessa a área visível e sai pelo lado oposto.
 *
 * Uso: incluir o script em qualquer página. O canvas é criado sozinho como
 * primeiro filho do <body>, fica fixo atrás do conteúdo e não recebe cliques.
 * Com "prefers-reduced-motion: reduce" ficam só as estrelas paradas.
 */
(function () {
  "use strict";

  const CONFIG = {
    PIXELS_POR_ESTRELA: 6500,   // densidade: 1 estrela a cada N px² de tela
    MAX_ESTRELAS: 280,
    CADENTES_POR_CICLO: 8,
    CICLO_MS: 60000,
    TRAVESSIA_MIN_MS: 850,      // tempo para cruzar a tela inteira
    TRAVESSIA_MAX_MS: 1250,
    CAUDA_PX: 170,
  };

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  const canvas = document.createElement("canvas");
  canvas.className = "ceu-estrelado";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let largura = 0;
  let altura = 0;
  let estrelas = [];
  let cadentes = [];       // estrelas cadentes em voo
  let agenda = [];         // lançamentos pendentes do ciclo atual
  let inicioCiclo = 0;
  let quadro = 0;

  function aleatorio(min, max) {
    return min + Math.random() * (max - min);
  }

  function embaralhar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  function redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = window.innerWidth;
    altura = window.innerHeight;
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    criarEstrelas();
    if (reduzirMovimento.matches) desenhar(performance.now());
  }

  function criarEstrelas() {
    const total = Math.min(CONFIG.MAX_ESTRELAS, Math.round((largura * altura) / CONFIG.PIXELS_POR_ESTRELA));
    estrelas = [];
    for (let i = 0; i < total; i++) {
      const grande = Math.random() < 0.08;
      estrelas.push({
        x: Math.random() * largura,
        y: Math.random() * altura,
        raio: grande ? aleatorio(1.1, 1.7) : aleatorio(0.4, 1.05),
        brilho: aleatorio(0.35, 0.95),
        cintila: Math.random() < 0.55,
        fase: Math.random() * Math.PI * 2,
        velocidade: aleatorio(0.0007, 0.0022),
      });
    }
  }

  // Monta os 8 lançamentos do ciclo: um por fatia de tempo, cada um com uma
  // direção diferente (passo de 45° com leve variação, ordem embaralhada).
  function planejarCiclo(agora) {
    inicioCiclo = agora;
    const n = CONFIG.CADENTES_POR_CICLO;
    const fatia = CONFIG.CICLO_MS / n;
    const giro = Math.random() * Math.PI * 2;
    const passo = (Math.PI * 2) / n;
    const angulos = embaralhar(
      Array.from({ length: n }, function (_, i) {
        return giro + i * passo + aleatorio(-0.2, 0.2) * passo;
      })
    );
    agenda = angulos.map(function (angulo, i) {
      return { momento: agora + i * fatia + aleatorio(0.1, 0.9) * fatia, angulo: angulo };
    });
  }

  // Distância do ponto (px, py) até a borda da tela, andando na direção (dx, dy).
  function ateABorda(px, py, dx, dy) {
    const tx = dx > 0 ? (largura - px) / dx : dx < 0 ? -px / dx : Infinity;
    const ty = dy > 0 ? (altura - py) / dy : dy < 0 ? -py / dy : Infinity;
    return Math.min(tx, ty);
  }

  function lancar(angulo, agora) {
    const dx = Math.cos(angulo);
    const dy = Math.sin(angulo);
    // Ponto de passagem dentro da tela; a trajetória começa e termina fora dela.
    const px = aleatorio(0.2, 0.8) * largura;
    const py = aleatorio(0.15, 0.75) * altura;
    // Alcance básico: metade da diagonal + cauda + 40. Quando o ponto de
    // passagem fica perto de um canto, isso não basta para sair da tela, então
    // cada lado é estendido até a borda real (a cabeça nasce 40 px fora dela e
    // a cauda inteira sai pelo lado oposto).
    const basico = Math.hypot(largura, altura) / 2 + CONFIG.CAUDA_PX + 40;
    const atras = Math.max(basico, ateABorda(px, py, -dx, -dy) + 40);
    const adiante = Math.max(basico, ateABorda(px, py, dx, dy) + CONFIG.CAUDA_PX + 40);
    cadentes.push({
      x0: px - dx * atras,
      y0: py - dy * atras,
      dx: dx,
      dy: dy,
      distancia: atras + adiante,
      inicio: agora,
      duracao: aleatorio(CONFIG.TRAVESSIA_MIN_MS, CONFIG.TRAVESSIA_MAX_MS),
    });
  }

  function desenharEstrelas(agora) {
    for (const e of estrelas) {
      const alfa = e.cintila
        ? e.brilho * (0.55 + 0.45 * Math.sin(agora * e.velocidade + e.fase))
        : e.brilho;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.raio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function desenharCadentes(agora) {
    cadentes = cadentes.filter(function (c) {
      const progresso = (agora - c.inicio) / c.duracao;
      if (progresso >= 1) return false;
      const andado = c.distancia * progresso;
      const hx = c.x0 + c.dx * andado;
      const hy = c.y0 + c.dy * andado;
      const cauda = CONFIG.CAUDA_PX * Math.min(1, progresso * 4);
      const tx = hx - c.dx * cauda;
      const ty = hy - c.dy * cauda;

      const rastro = ctx.createLinearGradient(hx, hy, tx, ty);
      rastro.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      rastro.addColorStop(0.25, "rgba(190, 255, 220, 0.45)");
      rastro.addColorStop(1, "rgba(0, 255, 102, 0)");
      ctx.strokeStyle = rastro;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
      halo.addColorStop(0, "rgba(255, 255, 255, 1)");
      halo.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }

  function desenhar(agora) {
    ctx.clearRect(0, 0, largura, altura);
    desenharEstrelas(agora);
    if (!reduzirMovimento.matches) desenharCadentes(agora);
  }

  function animar(agora) {
    while (agenda.length && agenda[0].momento <= agora) {
      lancar(agenda.shift().angulo, agora);
    }
    if (!agenda.length && agora - inicioCiclo >= CONFIG.CICLO_MS) {
      planejarCiclo(inicioCiclo + CONFIG.CICLO_MS);
    }
    desenhar(agora);
    quadro = requestAnimationFrame(animar);
  }

  function iniciar() {
    cancelAnimationFrame(quadro);
    cadentes = [];
    if (reduzirMovimento.matches) {
      desenhar(performance.now());
      return;
    }
    planejarCiclo(performance.now());
    quadro = requestAnimationFrame(animar);
  }

  // Aba oculta: pausa. Ao voltar, começa um ciclo novo em vez de disparar de
  // uma vez as estrelas que ficaram atrasadas.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) cancelAnimationFrame(quadro);
    else iniciar();
  });
  reduzirMovimento.addEventListener("change", iniciar);
  window.addEventListener("resize", redimensionar);

  redimensionar();
  iniciar();
})();
