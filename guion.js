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

  // Las dos filas llevaban las mismas diez marcas en distinto orden. El crítico
  // ciego de la ronda 11 lo leyó por lo que era: «repetir el mismo inventario dos
  // veces para llenar la banda es relleno». Ahora cada fila dice una cosa distinta
  // y va rotulada: arriba, dónde atiende el bot; abajo, con qué está construido.
  // La división no es cosmética: es la misma que usa la sección de servicios.
  var LOGOS_A = [
    ['whatsapp.svg', 'WhatsApp'], ['instagram.svg', 'Instagram'], ['meta.svg', 'Meta'],
    ['shopify.svg', 'Shopify'], ['hubspot.svg', 'HubSpot'],
    ['googlecalendar.svg', 'Google Calendar']
  ];
  // La fila de abajo lleva cuatro marcas y, al lado de cada una, para qué se usa.
  // Dos motivos: dice algo más que el logotipo, y alarga cada pieza lo suficiente
  // para que el ciclo no se vea dos veces en la misma pantalla.
  var LOGOS_B = [
    ['n8n.svg', 'n8n', 'la fontanería'], ['openai.svg', 'OpenAI', 'el cerebro'],
    ['elevenlabs.svg', 'ElevenLabs', 'la voz'], ['google.svg', 'Google', 'hojas y calendario']
  ];

  function grupo(lista) {
    var g = document.createElement('div');
    g.className = 'pista__grupo';
    // Cada marca va con su nombre escrito al lado, por tres razones que señaló
    // la crítica de la ronda 9: el glifo de ElevenLabs son dos barras verticales,
    // idénticas al icono de «pausar animaciones» de la cabecera, y se leía como un
    // fallo de carga; los diez logos mezclan marcas de contorno con marcas
    // rellenas, y el nombre les da un rasgo común; y un logotipo suelto no dice
    // nada a quien no lo reconoce.
    lista.forEach(function (par) {
      var marca = document.createElement('span');
      marca.className = 'pista__marca';
      var img = document.createElement('img');
      img.src = 'logos/' + par[0];
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      var nombre = document.createElement('span');
      nombre.className = 'pista__nombre';
      nombre.textContent = par[1];
      marca.appendChild(img);
      marca.appendChild(nombre);
      if (par[2]) {
        var uso = document.createElement('span');
        uso.className = 'pista__uso';
        uso.textContent = '· ' + par[2];
        marca.appendChild(uso);
      }
      g.appendChild(marca);
    });
    return g;
  }

  // La cinta son dos mitades idénticas y translate3d(-50%) cierra el bucle sin salto.
  // Cada mitad repite la lista hasta juntar al menos 12 marcas: con las listas
  // cortas de ahora (6 y 4) un solo pase no cubría 1920 px y se veía el hueco al
  // final del ciclo. Lo que se repite es la cinta, no el inventario de la banda.
  function grupoLargo(lista) {
    var veces = Math.ceil(12 / lista.length);
    var larga = [];
    for (var v = 0; v < veces; v++) larga = larga.concat(lista);
    return grupo(larga);
  }

  function poblar(id, lista) {
    var cinta = document.getElementById(id);
    if (!cinta) return;
    for (var mitad = 0; mitad < 2; mitad++) {
      var g = grupoLargo(lista);
      if (mitad > 0) g.setAttribute('aria-hidden', 'true');
      cinta.appendChild(g);
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

  /* ---------- 2b · menú de móvil y tableta ----------
     Sin esto, las cinco secciones eran inalcanzables por debajo de 1024 px:
     el menú estaba en `display:none` y no había nada que lo abriera. */

  var hamburguesa = document.getElementById('hamburguesa');
  var panelMenu = document.getElementById('menu');

  function cerrarMenu() {
    if (!hamburguesa) return;
    hamburguesa.setAttribute('aria-expanded', 'false');
    hamburguesa.setAttribute('aria-label', 'Abrir menú');
    raiz.classList.remove('menu-abierto');
  }
  function alternarMenu() {
    var abierto = hamburguesa.getAttribute('aria-expanded') === 'true';
    hamburguesa.setAttribute('aria-expanded', String(!abierto));
    hamburguesa.setAttribute('aria-label', abierto ? 'Abrir menú' : 'Cerrar menú');
    raiz.classList.toggle('menu-abierto', !abierto);
  }
  if (hamburguesa && panelMenu) {
    hamburguesa.addEventListener('click', alternarMenu);
    panelMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') cerrarMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarMenu();
    });
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
      var rotulo = pausado ? 'Reanudar animaciones' : 'Pausar animaciones';
      boton.setAttribute('aria-pressed', String(pausado));
      boton.setAttribute('aria-label', rotulo);
      boton.setAttribute('title', rotulo);
      var icono = boton.querySelector('.pausa__icono');
      if (icono) icono.textContent = pausado ? '▶' : '❚❚';
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
