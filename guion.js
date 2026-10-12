/* ============================================================
   PhinodIA v7 · comportamiento
   Sin dependencias. Todo degrada a contenido visible si falla.
   ============================================================ */
(function () {
  'use strict';

  var raiz = document.documentElement;
  raiz.classList.add('js');

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pausado = sinMovimiento.matches;

  /* ---------- 1 · marquesina de tecnologías ---------- */

  var LOGOS_A = [
    ['meta.svg', 'Meta'], ['whatsapp.svg', 'WhatsApp'], ['instagram.svg', 'Instagram'],
    ['google.svg', 'Google'], ['openai.svg', 'OpenAI']
  ];
  var LOGOS_B = [
    ['n8n.svg', 'n8n'], ['elevenlabs.svg', 'ElevenLabs'], ['shopify.svg', 'Shopify'],
    ['hubspot.svg', 'HubSpot'], ['googlecalendar.svg', 'Google Calendar']
  ];

  function grupo(lista) {
    var g = document.createElement('div');
    g.className = 'pista__grupo';
    lista.forEach(function (par) {
      var img = document.createElement('img');
      img.src = 'logos/' + par[0];
      img.alt = par[1];
      img.loading = 'lazy';
      img.decoding = 'async';
      g.appendChild(img);
    });
    return g;
  }

  // La cinta son dos mitades idénticas y translate3d(-50%) cierra el bucle sin salto.
  // Cada mitad lleva 2 grupos: con uno solo la cinta no llegaba a cubrir 1920 px
  // y se veía el hueco al final del ciclo.
  function poblar(id, lista) {
    var cinta = document.getElementById(id);
    if (!cinta) return;
    for (var mitad = 0; mitad < 2; mitad++) {
      for (var i = 0; i < 2; i++) {
        var g = grupo(lista);
        if (mitad > 0 || i > 0) g.setAttribute('aria-hidden', 'true');
        cinta.appendChild(g);
      }
    }
  }
  poblar('cinta-a', LOGOS_A);
  poblar('cinta-b', LOGOS_B);

  /* ---------- 2 · animación de entrada al scroll ---------- */

  var secciones = [].slice.call(document.querySelectorAll('section'));
  secciones.forEach(function (s) { if (s.id !== 'inicio') s.classList.add('revela'); });

  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('dentro');
          observador.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    secciones.forEach(function (s) { observador.observe(s); });
  } else {
    secciones.forEach(function (s) { s.classList.add('dentro'); });
  }

  /* ---------- 3 · cabecera al posarse ---------- */

  var cabecera = document.getElementById('cabecera');
  var ultimo = -1;
  function alDesplazar() {
    var y = window.scrollY > 40;
    if (y !== ultimo) { cabecera.classList.toggle('posado', y); ultimo = y; }
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();

  /* ---------- 4 · lienzo: campo de flujo ---------- */

  var lienzo = document.getElementById('lienzo');
  var ctx = lienzo && lienzo.getContext ? lienzo.getContext('2d') : null;
  var particulas = [];
  var anchoL = 0, altoL = 0, dpr = 1, peticion = null, t = 0;

  function dimensionar() {
    if (!lienzo) return;
    var r = lienzo.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    anchoL = Math.max(1, Math.round(r.width));
    altoL = Math.max(1, Math.round(r.height));
    lienzo.width = Math.round(anchoL * dpr);
    lienzo.height = Math.round(altoL * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b1026';
    ctx.fillRect(0, 0, anchoL, altoL);
    sembrar();
  }

  function sembrar() {
    // Densidad proporcional al área, con tope para no castigar equipos lentos.
    var n = Math.round(Math.min(300, Math.max(90, (anchoL * altoL) / 5200)));
    particulas = [];
    for (var i = 0; i < n; i++) {
      particulas.push({
        x: Math.random() * anchoL,
        y: Math.random() * altoL,
        v: 0.22 + Math.random() * 0.62,
        vida: Math.random() * 420,
        lima: Math.random() < 0.13
      });
    }
  }

  // Campo de flujo barato: suma de senos. Sin librerías de ruido.
  function angulo(x, y) {
    var a = Math.sin(x * 0.0021 + t * 0.00022) * 1.7;
    var b = Math.cos(y * 0.0026 - t * 0.00017) * 1.7;
    var c = Math.sin((x + y) * 0.0012 + t * 0.00009);
    return a + b + c;
  }

  function fotograma() {
    t += 16;

    // Velo tenue en vez de borrar: deja estela y repinta TODO el lienzo cada cuadro.
    // Cuanto más bajo el alfa, más larga la estela y más visible el campo.
    ctx.fillStyle = 'rgba(11, 16, 38, 0.026)';
    ctx.fillRect(0, 0, anchoL, altoL);

    for (var i = 0; i < particulas.length; i++) {
      var p = particulas[i];
      var ang = angulo(p.x, p.y);
      var nx = p.x + Math.cos(ang) * p.v * 2.0;
      var ny = p.y + Math.sin(ang) * p.v * 2.0;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = p.lima ? 'rgba(212, 255, 58, 0.78)' : 'rgba(96, 136, 255, 0.62)';
      ctx.lineWidth = p.lima ? 1.5 : 1.15;
      ctx.stroke();

      p.x = nx; p.y = ny; p.vida--;

      // Reaparece cuando se sale o se agota, repartida por todo el lienzo.
      if (p.vida < 0 || p.x < -20 || p.x > anchoL + 20 || p.y < -20 || p.y > altoL + 20) {
        p.x = Math.random() * anchoL;
        p.y = Math.random() * altoL;
        p.vida = 240 + Math.random() * 420;
      }
    }
    peticion = window.requestAnimationFrame(fotograma);
  }

  function arrancar() {
    if (!ctx || peticion !== null || pausado) return;
    peticion = window.requestAnimationFrame(fotograma);
  }
  function detener() {
    if (peticion !== null) { window.cancelAnimationFrame(peticion); peticion = null; }
  }

  if (ctx) {
    dimensionar();
    var reloj = null;
    window.addEventListener('resize', function () {
      clearTimeout(reloj);
      reloj = setTimeout(dimensionar, 180);
    }, { passive: true });

    // No gastar CPU con el hero fuera de pantalla.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) arrancar(); else detener();
      }, { threshold: 0 }).observe(lienzo);
    }
    arrancar();
  }

  /* ---------- 5 · botón de pausa ---------- */

  var boton = document.getElementById('pausa');

  function aplicar() {
    raiz.classList.toggle('sin-animacion', pausado);
    if (boton) {
      boton.setAttribute('aria-pressed', String(pausado));
      boton.querySelector('.pausa__texto').textContent = pausado ? 'Reanudar animaciones' : 'Pausar animaciones';
      boton.firstElementChild.textContent = pausado ? '▶' : '❚❚';
    }
    if (pausado) detener(); else arrancar();
  }

  if (boton) {
    boton.addEventListener('click', function () { pausado = !pausado; aplicar(); });
  }
  if (sinMovimiento.addEventListener) {
    sinMovimiento.addEventListener('change', function (e) { pausado = e.matches; aplicar(); });
  }
  aplicar();
})();
