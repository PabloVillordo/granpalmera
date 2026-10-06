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

  // Desplazamiento suave para enlaces de ancla (Botonera Hero e Íconos)
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

  // Animaciones de Entradas Heroicas (Aplica a logo, títulos, buscador, botones y Deslizá)
  if (!reduce) {
    gsap.set('[data-rise]', { yPercent: 100, opacity: 0 });
    gsap.to('[data-rise]', { 
      yPercent: 0, 
      opacity: 1, 
      duration: 1.0, 
      ease: EOUT, 
      stagger: 0.08, 
      delay: 0.15 
    });
  }

  // Coreografía de Tarjetas y Secciones Atadas al Scroll
  if (!reduce) {
    gsap.utils.toArray('.stagger').forEach(function(el) {
      gsap.fromTo(el.children, { opacity: 0, y: 60 }, {
        opacity: 1,
        y: 0,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          end: 'top 58%',
          scrub: 0.7
        }
      });
    });

    gsap.utils.toArray('.reveal').forEach(function(el) {
      gsap.fromTo(el, { opacity: 0, y: 50 }, {
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
  }

  // ════ CANVAS 2D: SIMULACIÓN FÍSICA DE HOJAS DE MONSTERA DELICIOSA ════
  (function() {
    var canvas = document.getElementById('petals');
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W, H, bits = [], running = true, raf = 0;
    var COUNT = window.innerWidth < 760 ? 5 : 9;
    
    var monsteraImg = new Image();
    monsteraImg.src = '../img/monstera.webp';
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
        } else {
          ctx.fillStyle = '#8A9E87';
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2);
          ctx.fill();
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

  // ════ FILTRADO INTERACTIVO EN VIVO PARA EL BUSCADOR DE ARTÍCULOS ════
  var inputSearch = document.getElementById('input-blog-search');
  if (inputSearch) {
    inputSearch.addEventListener('input', function(e) {
      var query = e.target.value.toLowerCase().trim();
      var articles = document.querySelectorAll('.article-card');
      var categories = document.querySelectorAll('.category-card');

      articles.forEach(function(card) {
        var text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });

      categories.forEach(function(card) {
        var text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });

      setTimeout(function() { ScrollTrigger.refresh(); }, 100);
    });
  }

  window.addEventListener('load', function() { 
    ScrollTrigger.refresh(); 
  });
})();