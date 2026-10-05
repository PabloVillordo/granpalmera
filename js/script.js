(function() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = window.gsap && window.ScrollTrigger;

  if (!hasGSAP) return;
  if (!reduce) document.documentElement.classList.add('js-motion');

  var gsap = window.gsap;
  gsap.registerPlugin(ScrollTrigger);

  if (window.CustomEase) {
    CustomEase.create('e-out', 'M0,0 C0.22,1 0.36,1 1,1');
    CustomEase.create('e-out-lg', 'M0,0 C0.16,1 0.3,1 1,1');
    CustomEase.create('e-inout', 'M0,0 C0.76,0 0.24,1 1,1');
    CustomEase.create('e-soft', 'M0,0 C0.33,0 0.2,1 1,1');
  }
  var EOUT = window.CustomEase ? 'e-out' : 'power3.out';
  var EOUTLG = window.CustomEase ? 'e-out-lg' : 'power4.out';

  // Integración Lenis Smooth Scroll
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('visibilitychange', function() {
      document.hidden ? lenis.stop() : lenis.start();
    });
  }

  // Desplazamiento suave para enlaces de ancla
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // Estado de Navegación con Glassmorphism
  var nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -50',
    end: 99999,
    onUpdate: function(self) {
      nav.classList.toggle('is-scrolled', self.scroll() > 50);
    }
  });

  window.addEventListener('load', function() {
    requestAnimationFrame(function() {
      document.documentElement.classList.remove('preload');
    });
  });

  // Menú Hamburguesa Móvil
  var burger = document.getElementById('navBurger');
  if (burger) {
    var closeMenu = function() {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    burger.addEventListener('click', function() {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('#navLinks a').forEach(function(a) {
      a.addEventListener('click', closeMenu);
    });
    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) closeMenu();
    });
  }

  // LÓGICA DE ACORDEÓN EXCLUSIVO PARA EL ECOSISTEMA
  var accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(function(item) {
    var header = item.querySelector('.accordion-header');
    if (!header) return;

    header.addEventListener('click', function() {
      var isOpen = item.classList.contains('is-open');

      accordionItems.forEach(function(otherItem) {
        if (otherItem !== item) {
          otherItem.classList.remove('is-open');
          var otherHeader = otherItem.querySelector('.accordion-header');
          if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
      }

      setTimeout(function() {
        ScrollTrigger.refresh();
      }, 350);
    });
  });

  // Fondo Dinámico Ambiental
  if (!reduce) {
    var wash = document.getElementById('bgwash');
    if (wash) {
      gsap.timeline({
        scrollTrigger: {
          trigger: 'main',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8
        }
      })
      .to(wash, { backgroundColor: '#F4EEE4', ease: 'none' })
      .to(wash, { backgroundColor: '#EDE3D5', ease: 'none' })
      .to(wash, { backgroundColor: '#F6F1E9', ease: 'none' });
    }

    var ctaEl = document.querySelector('.cta');
    if (ctaEl) {
      gsap.fromTo(ctaEl, { backgroundColor: '#EDE3D5' }, {
        backgroundColor: '#5b4638',
        ease: 'none',
        scrollTrigger: {
          trigger: ctaEl,
          start: 'top bottom',
          end: 'top 86%',
          scrub: 0.4
        }
      });
    }
  }

  // Animaciones del Hero Section
  if (!reduce) {
    gsap.fromTo('#cueLine', { scaleY: 0.2, opacity: 0.3 }, { scaleY: 1, opacity: 1, duration: 1.4, ease: EOUT, repeat: -1, yoyo: true });
    gsap.to('.scrollcue', { opacity: 0, scrollTrigger: { start: 40, end: 220, scrub: true } });
    gsap.set('[data-rise]', { yPercent: 110, opacity: 0 });
    gsap.set('.hero__line>span', { yPercent: 0, opacity: 1 });
    
    gsap.timeline({ delay: 0.15 })
      .to('.hero__line>span', { yPercent: 0, opacity: 1, duration: 1.1, ease: EOUTLG, stagger: 0.09 })
      .to('[data-rise]', { yPercent: 0, opacity: 1, duration: 0.9, ease: EOUT, stagger: 0.08 }, '-=0.7');
  }

  // Manifiesto con animación palabra por palabra (text-reveal scrub)
  (function() {
    var lines = gsap.utils.toArray('#manifesto .manifesto__line');
    if (!lines.length) return;
    lines.forEach(function(p) {
      var words = p.textContent.split(' ');
      p.innerHTML = words.map(function(w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    });
    if (reduce) {
      gsap.set('#manifesto .w', { color: '#4A4040' });
      return;
    }
    gsap.to('#manifesto .w', {
      color: '#4A4040',
      stagger: 0.2,
      ease: 'none',
      scrollTrigger: {
        trigger: '#manifesto',
        start: 'top 75%',
        end: 'bottom 60%',
        scrub: 0.5
      }
    });
  })();

  // ════ COREOGRAFÍA DEL ESCENARIO (#jardinStage): CONSTRUCCIÓN VEGETAL EN CAPAS ════
  if (!reduce) {
    gsap.set("#cubresuelos", { scaleY: 0, opacity: 0, transformOrigin: "bottom center" });
    gsap.set("[id^=tronco]", { scaleY: 0, transformOrigin: "bottom center" });
    gsap.set("[id^=copa]", { scale: 0, opacity: 0, transformOrigin: "center center" });
    gsap.set("[id^=arbusto]", { scale: 0, opacity: 0, transformOrigin: "center bottom" });

    var stageTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#jardinStage",
        start: "top top",
        end: "+=250%",
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    stageTL
      .to("#cubresuelos", { scaleY: 1, opacity: 1, duration: 2, ease: "power2.out" }, 0)
      .to("[id^=tronco]", { scaleY: 1, duration: 3, stagger: 0.5, ease: "power1.inOut" }, 1)
      .to("[id^=copa]", { scale: 1, opacity: 1, duration: 2.5, stagger: 0.5, ease: "back.out(1.5)" }, 3)
      .to(".texto-1", { y: -30, opacity: 0, duration: 1.5 }, 3.5)
      .to(".texto-2", { y: 0, opacity: 1, duration: 1.5 }, 4.5)
      .to("[id^=arbusto]", { scale: 1, opacity: 1, duration: 2, stagger: 0.4, ease: "back.out(1.2)" }, 4);
  }

  // Animaciones de Tarjetas, Hub Grid y FAQ atadas al Scroll
  if (!reduce) {
    gsap.utils.toArray('.stagger').forEach(function(el) {
      gsap.fromTo(el.children, { opacity: 0, y: 66 }, {
        opacity: 1,
        y: 0,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          end: 'top 56%',
          scrub: 0.7
        }
      });
    });

    gsap.utils.toArray('.reveal').forEach(function(el) {
      gsap.fromTo(el, { opacity: 0, y: 58 }, {
        opacity: 1,
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          end: 'top 60%',
          scrub: 0.7
        }
      });
    });

    gsap.utils.toArray('#sec-faq .faq__item').forEach(function(item) {
      gsap.fromTo(item, { opacity: 0, x: -130 }, {
        opacity: 1,
        x: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: item,
          start: 'top 92%',
          end: 'top 62%',
          scrub: 0.6
        }
      });
    });
  }

  // ════ CANVAS 2D: SIMULACIÓN FÍSICA DE HOJAS DE MONSTERA DELICIOSA (img/monstera.png) ════
  (function() {
    var canvas = document.getElementById('petals');
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W, H, bits = [], running = true, raf = 0;
    var COUNT = window.innerWidth < 760 ? 5 : 9;
    
    var monsteraImg = new Image();
    monsteraImg.src = 'img/monstera.png';
    var imgReady = false;
    monsteraImg.onload = function() { imgReady = true; };

    function resize() { 
      W = canvas.width = Math.floor(window.innerWidth * DPR); 
      H = canvas.height = Math.floor(window.innerHeight * DPR); 
      canvas.style.width = window.innerWidth + 'px'; 
      canvas.style.height = window.innerHeight + 'px'; 
    }

    function mk(y) { 
      return {
        x: Math.random() * W, 
        y: (y != null ? y : Math.random() * H), 
        r: (18 + Math.random() * 14) * DPR, 
        vy: (0.10 + Math.random() * 0.20) * DPR, 
        sway: 0.5 + Math.random() * 1.2, 
        ph: Math.random() * Math.PI * 2, 
        rot: Math.random() * Math.PI, 
        vr: (Math.random() - 0.5) * 0.008, 
        alpha: 0.24 + Math.random() * 0.18 
      }; 
    }

    function init() { resize(); bits = []; for (var i = 0; i < COUNT; i++) bits.push(mk()); }

    function draw() { 
      if (!running) return; 
      ctx.clearRect(0, 0, W, H);
      
      for (var i = 0; i < bits.length; i++) { 
        var p = bits[i]; 
        p.y += p.vy; 
        p.ph += 0.005; 
        p.x += Math.sin(p.ph) * p.sway * 0.35 * DPR; 
        p.rot += p.vr;
        
        if (p.y - p.r * 2 > H) { 
          bits[i] = mk(-40); 
          p = bits[i]; 
        }
        
        ctx.save(); 
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.rot); 
        ctx.globalAlpha = p.alpha;
        
        if (imgReady) {
          ctx.drawImage(monsteraImg, -p.r, -p.r * 1.1, p.r * 2, p.r * 2.2);
        }
        
        ctx.restore(); 
      }
      raf = requestAnimationFrame(draw);
    }

    init(); 
    draw();
    
    window.addEventListener('resize', function() { 
      cancelAnimationFrame(raf); 
      init(); 
      if (running) draw(); 
    }, { passive: true });
    
    document.addEventListener('visibilitychange', function() { 
      running = !document.hidden; 
      if (running) draw(); 
      else cancelAnimationFrame(raf); 
    });
  })();

  // Lógica del Buscador Interactivo en el Hero con redirección directa
  var inputBuscador = document.getElementById('input-buscador-hub');
  if (inputBuscador) {
    inputBuscador.addEventListener('change', function(e) {
      var val = e.target.value.toLowerCase();
      if (val.includes('usda') || val.includes('mapa') || val.includes('resistencia')) window.location.href = 'usda/buscador_usda.html';
      else if (val.includes('pinterest')) window.open('https://ar.pinterest.com/granpalmera/_saved/', '_blank');
      else if (val.includes('tienda nube') || val.includes('tienda online')) window.open('https://granpalmera.mitiendanube.com/', '_blank');
      else if (val.includes('mercado libre')) window.open('https://www.mercadolibre.com.ar/pagina/granpalmera', '_blank');
      else if (val.includes('vía cargo')) window.open('https://viacargo.com.ar/agencies/', '_blank');
      else if (val.includes('andreani')) window.open('https://www.andreani.com/buscar-sucursal', '_blank');
      else if (val.includes('oca')) window.open('https://www.oca.com.ar/Busquedas/Sucursales', '_blank');
      else if (val.includes('correo argentino')) window.open('https://www.correoargentino.com.ar/formularios/sucursales', '_blank');
      else if (val.includes('envío') || val.includes('país')) window.location.href = 'envios/envios_granpalmera.html';
      else if (val.includes('vivero') || val.includes('ubicación')) window.location.href = 'direccion/direccion_granpalmera.html';
      else if (val.includes('diseño') || val.includes('ejecución') || val.includes('paisajismo')) window.location.href = 'paisajismo/paisajismo_granpalmera.html';
      else if (val.includes('residencial')) window.location.href = 'paisajismo/paisajismo_residencial_granpalmera.html';
      else if (val.includes('profesionales') || val.includes('b2b')) window.location.href = 'paisajismo/paisajismo_profesional_granpalmera.html';
      else if (val.includes('asesor') || val.includes('chat')) window.open('https://api.whatsapp.com/send?phone=5493764149835', '_blank');
      else if (val.includes('catálogo')) window.open('https://wa.me/c/5493764149835', '_blank');
      else if (val.includes('canal') || val.includes('novedades')) window.open('https://whatsapp.com/channel/0029VbDNEdM6rsR2btM00y2Z', '_blank');
    });
  }

  window.addEventListener('load', function() { 
    ScrollTrigger.refresh(); 
  });
})();