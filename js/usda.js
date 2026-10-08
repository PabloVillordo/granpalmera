(function() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = window.gsap && window.ScrollTrigger;

  if (hasGSAP) {
    if (!reduce) document.documentElement.classList.add('js-motion');
    gsap.registerPlugin(ScrollTrigger);

    if (window.CustomEase) {
      CustomEase.create('e-out', 'M0,0 C0.22,1 0.36,1 1,1');
      CustomEase.create('e-out-lg', 'M0,0 C0.16,1 0.3,1 1,1');
      CustomEase.create('e-inout', 'M0,0 C0.76,0 0.24,1 1,1');
      CustomEase.create('e-soft', 'M0,0 C0.33,0 0.2,1 1,1');
    }
    var EOUT = window.CustomEase ? 'e-out' : 'power3.out';
    var EOUTLG = window.CustomEase ? 'e-out-lg' : 'power4.out';

    var lenis = null;
    if (!reduce && window.Lenis) {
      lenis = new Lenis({
        duration: 1.1,
        easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        var targetId = a.getAttribute('href');
        var target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        
        if (target.tagName.toLowerCase() === 'details') target.open = true;

        if (lenis) lenis.scrollTo(target, { offset: -80 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    var nav = document.getElementById('nav');
    ScrollTrigger.create({
      start: 'top -50',
      onUpdate: function(self) { nav.classList.toggle('is-scrolled', self.scroll() > 50); }
    });

    if (!reduce) {
      var wash = document.getElementById('bgwash');
      if (wash) {
        gsap.timeline({ scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
        .to(wash, { backgroundColor: '#F4EEE4', ease: 'none' })
        .to(wash, { backgroundColor: '#EDE3D5', ease: 'none' });
      }
      var ctaEl = document.querySelector('.cta');
      if (ctaEl) {
        gsap.fromTo(ctaEl, { backgroundColor: '#EDE3D5' }, { backgroundColor: '#5b4638', ease: 'none', scrollTrigger: { trigger: ctaEl, start: 'top bottom', end: 'top 86%', scrub: 0.4 } });
      }
    }

    if (!reduce) {
      gsap.fromTo('#cueLine', { scaleY: 0.2, opacity: 0.3 }, { scaleY: 1, opacity: 1, duration: 1.4, ease: EOUT, repeat: -1, yoyo: true });
      gsap.to('.scrollcue', { opacity: 0, scrollTrigger: { start: 40, end: 220, scrub: true } });
      gsap.set('[data-rise]', { yPercent: 110, opacity: 0 });
      gsap.set('.hero__line>span', { yPercent: 110, opacity: 0 });
      
      gsap.timeline({ delay: 0.15 })
        .to('.hero__line>span', { yPercent: 0, opacity: 1, duration: 1.1, ease: EOUTLG, stagger: 0.09 })
        .to('[data-rise]', { yPercent: 0, opacity: 1, duration: 0.9, ease: EOUT, stagger: 0.08 }, '-=0.7');
    }

    if (!reduce) {
      gsap.utils.toArray('.stagger').forEach(function(el) {
        gsap.fromTo(el.children, { opacity: 0, y: 66 }, { opacity: 1, y: 0, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 56%', scrub: 0.7 } });
      });
      gsap.utils.toArray('.reveal').forEach(function(el) {
        gsap.fromTo(el, { opacity: 0, y: 58 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 60%', scrub: 0.7 } });
      });
      gsap.utils.toArray('.faq .faq__item').forEach(function(item) {
        gsap.fromTo(item, { opacity: 0, x: -100 }, { opacity: 1, x: 0, ease: 'none', scrollTrigger: { trigger: item, start: 'top 92%', end: 'top 62%', scrub: 0.6 } });
      });
    }
  }

  window.addEventListener('load', function() {
    requestAnimationFrame(function() { document.documentElement.classList.remove('preload'); });
    if (hasGSAP) ScrollTrigger.refresh();
  });

  var burger = document.getElementById('navBurger');
  if (burger) {
    var closeMenu = function() {
      nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    };
    burger.addEventListener('click', function() {
      var open = nav.classList.toggle('is-open'); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('#navLinks a').forEach(function(a) { a.addEventListener('click', closeMenu); });
  }

  // LÓGICA DE ACORDEÓN INTERACTIVO INDEPENDIENTE PARA EL CENTRO DE CONTROL CLIMÁTICO
  var climateAccordionItems = document.querySelectorAll('.climate-accordion-item');
  climateAccordionItems.forEach(function(item) {
    var header = item.querySelector('.climate-accordion-header');
    if (!header) return;

    header.addEventListener('click', function() {
      var isOpen = item.classList.contains('is-open');

      if (isOpen) {
        item.classList.remove('is-open');
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
      }

      setTimeout(function() {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      }, 350);
    });
  });

  // CANVAS 2D: PARTÍCULAS ATMOSFÉRICAS / COPOS
  (function() {
    var canvas = document.getElementById('petals');
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W, H, bits = [], running = true, raf = 0;
    var COUNT = window.innerWidth < 760 ? 16 : 32;

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
        r: (6 + Math.random() * 10) * DPR, 
        vy: (0.22 + Math.random() * 0.42) * DPR, 
        sway: 0.8 + Math.random() * 1.5, 
        ph: Math.random() * Math.PI * 2, 
        rot: Math.random() * Math.PI, 
        vr: (Math.random() - 0.5) * 0.008, 
        alpha: 0.25 + Math.random() * 0.5 
      }; 
    }

    function init() { resize(); bits = []; for (var i = 0; i < COUNT; i++) bits.push(mk()); }

    function drawSnowflakeVector(r) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(1, r * 0.12);
      for (var k = 0; k < 6; k++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(-r * 0.35, -r * 0.72);
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(r * 0.35, -r * 0.72);
        ctx.rotate(Math.PI / 3);
      }
      ctx.stroke();
    }

    function draw() { 
      if (!running) return; 
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bits.length; i++) { 
        var p = bits[i]; 
        p.y += p.vy; 
        p.ph += 0.008; 
        p.x += Math.sin(p.ph) * p.sway * 0.4 * DPR; 
        p.rot += p.vr;

        if (p.y - p.r * 2 > H) { bits[i] = mk(-30); p = bits[i]; }

        ctx.save(); 
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.rot); 
        ctx.globalAlpha = p.alpha; 
        ctx.strokeStyle = '#699DBE';
        drawSnowflakeVector(p.r);
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

  // LÓGICA DE DATOS Y MAPA LEAFLET CON PRESETS DE VISTA ARGENTINA
  document.addEventListener("DOMContentLoaded", function() {
    if(typeof L === 'undefined') return;

    const tip = document.getElementById('geo-tip');

    const boundsArgentina = L.latLngBounds(
      L.latLng(-55.5, -75.0),
      L.latLng(-20.5, -50.0)
    );

    const map = L.map('map', {
      preferCanvas: true,
      center: [-38.416097, -63.616672],
      zoom: 4,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: boundsArgentina,
      maxBoundsViscosity: 1.0,
      zoomSnap: 0.25,
      zoomDelta: 0.5
    });

    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { 
      maxZoom: 18, 
      attribution: '© OpenStreetMap' 
    }).addTo(map);

    let capasActivas = L.layerGroup().addTo(map);
    let capaEstacionesSMN = L.layerGroup();
    let estacionesCargadas = false;
    let marcadorUsuario = null;

    const ZONAS_INICIALES = ['11a', '10b', '10a'];
    let zonasActivas = new Set(ZONAS_INICIALES);
    let capasPorZona = {};

    function parseSMNCoord(val) {
      if (!val) return null;
      const partes = val.trim().split(/\s+/);
      if (partes.length === 2) {
        const deg = parseFloat(partes[0]), min = parseFloat(partes[1]);
        if (isNaN(deg) || isNaN(min)) return null;
        return deg < 0 ? deg - (min / 60.0) : deg + (min / 60.0);
      } else if (partes.length === 1) { return isNaN(parseFloat(partes[0])) ? null : parseFloat(partes[0]); }
      return null;
    }

    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        presetBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const p = this.dataset.preset;
        
        if (p === 'arg') {
          map.flyTo([-38.416097, -63.616672], 4, { duration: 1.2 });
        } else if (p === 'ba') {
          map.flyTo([-36.6, -60.0], 6.5, { duration: 1.2 });
        } else if (p === 'caba') {
          map.flyTo([-34.603722, -58.381592], 11.5, { duration: 1.2 });
        }
      });
    });

    const ResetControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function(m) {
        const c = L.DomUtil.create('div', 'leaflet-bar');
        const b = L.DomUtil.create('button', 'map-custom-btn', c);
        b.innerHTML = '<i class="fa-solid fa-rotate-left"></i>'; b.title = "Limpiar mapa";
        b.onclick = function(e) {
          e.stopPropagation(); m.setView([-38.416097, -63.616672], 4); 
          actualizarZonasActivas([], true);
          if (capaArbolesUrbano) capaArbolesUrbano.clearLayers();
          if (m.hasLayer(capaEstacionesSMN)) m.removeLayer(capaEstacionesSMN);
          if (marcadorUsuario) { m.removeLayer(marcadorUsuario); marcadorUsuario = null; }
          document.querySelectorAll('.map-custom-btn').forEach(btn => btn.classList.remove('active'));
          ['input-plantas', 'input-palmeras', 'input-zonas', 'input-ciudades', 'input-arbolado-especie'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
          const lista = document.getElementById('lista-sugerencias'); if(lista) lista.style.display = 'none';
          filtrarTarjetasEspecies();
        };
        return c;
      }
    });

    const GeoControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function(m) {
        const c = L.DomUtil.create('div', 'leaflet-bar'); c.style.marginTop = '8px';
        const b = L.DomUtil.create('button', 'map-custom-btn', c);
        b.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>'; b.title = "Mi ubicación";
        b.onclick = function(e) {
          e.stopPropagation();
          if (navigator.geolocation) {
            b.innerHTML = '<i class="fa-solid fa-spinner fa-spin-fast"></i>';
            navigator.geolocation.getCurrentPosition(
              function(pos) {
                const lat = pos.coords.latitude, lng = pos.coords.longitude;
                if (marcadorUsuario) m.removeLayer(marcadorUsuario);
                marcadorUsuario = L.marker([lat, lng], { icon: L.divIcon({ className: 'custom-user-marker', html: '<i class="fa-solid fa-location-dot" style="color:#e74c3c; font-size:28px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4));"></i>', iconSize: [28,28], iconAnchor: [14,28], popupAnchor: [0,-25] }) }).addTo(m).bindPopup("<b>Tu ubicación</b>").openPopup();
                m.flyTo([lat, lng], 11, { duration: 1.5 });
                b.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
              },
              function() { alert("Acceso a ubicación denegado."); b.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>'; },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }
        };
        return c;
      }
    });

    const SMNControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function(m) {
        const c = L.DomUtil.create('div', 'leaflet-bar'); c.style.marginTop = '8px';
        const b = L.DomUtil.create('button', 'map-custom-btn', c);
        b.innerHTML = '<i class="fa-solid fa-cloud-sun-rain"></i>'; b.title = "Estaciones SMN";
        b.onclick = function(e) {
          e.stopPropagation();
          if (m.hasLayer(capaEstacionesSMN)) { m.removeLayer(capaEstacionesSMN); b.classList.remove('active'); return; }
          if (!estacionesCargadas) {
            b.innerHTML = '<i class="fa-solid fa-spinner fa-spin-fast"></i>';
            Papa.parse('diccionario_estaciones.csv', {
              download: true, header: true, skipEmptyLines: true,
              complete: function(results) {
                capaEstacionesSMN.clearLayers();
                results.data.forEach(est => {
                  const lat = parseSMNCoord(est.LATITUD), lng = parseSMNCoord(est.LONGITUD);
                  if (lat !== null && lng !== null && est.NOMBRE) {
                    L.marker([lat, lng], { icon: L.divIcon({ className: 'smn-marker-icon', html: '<i class="fa-solid fa-temperature-high"></i>', iconSize: [26,26], iconAnchor: [13,13], popupAnchor: [0,-12] }) })
                      .bindPopup(`<div style="text-align:left;"><h4 style="margin:0;color:var(--verde-atardecer);"><i class="fa-solid fa-tower-observation"></i> ${est.NOMBRE.trim()}</h4><span style="font-size:12px;"><b>Provincia:</b> ${est.PROVINCIA || 'N/A'}</span><br><span style="font-size:12px;"><b>Altitud:</b> ${est.ALTURA ? est.ALTURA + ' m.s.n.m.' : 'N/A'}</span></div>`)
                      .addTo(capaEstacionesSMN);
                  }
                });
                capaEstacionesSMN.addTo(m); estacionesCargadas = true;
                b.innerHTML = '<i class="fa-solid fa-cloud-sun-rain"></i>'; b.classList.add('active');
              }
            });
          } else { capaEstacionesSMN.addTo(m); b.classList.add('active'); }
        };
        return c;
      }
    });

    map.addControl(new ResetControl());
    map.addControl(new GeoControl());
    map.addControl(new SMNControl());

    const coloresUSDA = { '1a': '#3c3c3c', '1b': '#FFFFFF', '2a': '#DDDFE3', '2b': '#B8BABE', '3a': '#EBD8FD', '3b': '#F779E0', '4a': '#B979D1', '4b': '#D6EDFD', '5a': '#77A7F0', '5b': '#77DCFD', '6a': '#779FB7', '6b': '#DCF1CB', '7a': '#A2F97D', '7b': '#8AB37D', '8a': '#F7F97D', '8b': '#F7CE7D', '9a': '#B19F7D', '9b': '#CB797D', '10a': '#F7B9BD', '10b': '#F7797D', '11a': '#D81B60' };
    const temperaturasUSDA = { '1a': '-51.1°C a -48.3°C', '1b': '-48.3°C a -45.6°C', '2a': '-45.6°C a -42.8°C', '2b': '-42.8°C a -40.0°C', '3a': '-40.0°C a -37.2°C', '3b': '-37.2°C a -34.4°C', '4a': '-34.4°C a -31.7°C', '4b': '-31.7°C a -28.9°C', '5a': '-28.9°C a -26.1°C', '5b': '-26.1°C a -23.3°C', '6a': '-23.3°C a -20.6°C', '6b': '-20.6°C a -17.8°C', '7a': '-17.8°C a -15.0°C', '7b': '-15.0°C a -12.2°C', '8a': '-12.2°C a -9.4°C', '8b': '-9.4°C a -6.7°C', '9a': '-6.7°C a -3.9°C', '9b': '-3.9°C a -1.1°C', '10a': '-1.1°C a 1.7°C', '10b': '1.7°C a 4.4°C', '11a': '4.4°C a 7.2°C' };

    const dbPlantas = {}, dbPalmeras = {}, dbZonas = {}, dbCiudades = {};
    const bases = [
      { archivo: 'diccionario-plantas.csv', datalistId: 'list-plantas', dbTarget: dbPlantas, statusId: 'status-plantas' },
      { archivo: 'diccionario-palmeras.csv', datalistId: 'list-palmeras', dbTarget: dbPalmeras, statusId: 'status-palmeras' },
      { archivo: 'diccionario-zonas.csv', datalistId: 'list-zonas', dbTarget: dbZonas, statusId: 'status-zonas' },
      { archivo: 'diccionario-ciudades.csv', datalistId: 'list-ciudades', dbTarget: dbCiudades, statusId: 'status-ciudades' }
    ];

    bases.forEach(b => {
      Papa.parse(b.archivo, {
        download: true, header: true, skipEmptyLines: true,
        complete: function(res) {
          const list = document.getElementById(b.datalistId); if(list) list.innerHTML = '';
          res.data.forEach(fila => {
            const f = {}; Object.keys(fila).forEach(k => f[k.replace(/^\uFEFF/, '').trim().toLowerCase()] = fila[k]);
            const zonasRaw = f["zonas usda"] || f["zonas"] || "";
            let et = "";
            if (b.archivo.includes("zonas")) {
              if (f["nombre zona"]) et = `${f["nombre zona"].trim()} - Temp mínima ${f["rango"] || ""}`;
            } else if (b.archivo.includes("ciudades") || f["ciudad (provincia)"]) {
              const z = f["zonas usda"] ? f["zonas usda"].trim() : "";
              if (f["ciudad (provincia)"] && z) et = `${f["ciudad (provincia)"].trim()} - Zona: ${z.toUpperCase()} - Temp: ${(f["rango"] || temperaturasUSDA[z.toLowerCase()] || "")}`;
            } else if (f["nombre común"] && f["nombre científico"]) {
              if (f["zonas usda"]) et = `${f["nombre común"].trim()} (${f["nombre científico"].trim()}) - Zona: ${f["zonas usda"].toUpperCase()}`;
            }

            if (zonasRaw && et) {
              const zArr = zonasRaw.split(/[, -]+/).map(z => z.trim().toLowerCase()).filter(z => z.length > 0);
              b.dbTarget[et.toLowerCase()] = zArr;
              if(f["nombre común"]) b.dbTarget[f["nombre común"].trim().toLowerCase()] = zArr;
              if(f["nombre científico"]) b.dbTarget[f["nombre científico"].trim().toLowerCase()] = zArr;
              if(list) { const opt = document.createElement('option'); opt.value = et; list.appendChild(opt); }
            }
          });
          const stEl = document.getElementById(b.statusId);
          if (stEl) { stEl.innerText = "Base lista"; stEl.classList.add("success"); }
        },
        error: function() {
          const stEl = document.getElementById(b.statusId);
          if (stEl) { stEl.innerText = "Error al cargar"; stEl.classList.add("error"); }
        }
      });
    });

    function cargarCapaGeoJSONZona(z) {
      const colorIsotermico = coloresUSDA[z] || '#5b4638';

      fetch(`https://gm-pm.s3.amazonaws.com/gj/hz/AR_HZ_${z}.geojson`)
        .then(r => { if(!r.ok) throw new Error("GeoJSON no disponible"); return r.json(); })
        .then(d => {
          if (!zonasActivas.has(z)) return;

          const geoLayer = L.geoJson(d, {
            style: {
              fillColor: colorIsotermico,
              weight: 2,
              color: '#5b4638',
              fillOpacity: 0.70
            },
            onEachFeature: function(feature, layer) {
              layer.on({
                mouseover: function(e) {
                  e.target.setStyle({ fillOpacity: 0.9, weight: 3, color: '#1c241c' });
                  if (tip) {
                    tip.textContent = `Zona USDA ${z.toUpperCase()} (${temperaturasUSDA[z] || ''})`;
                    tip.hidden = false;
                  }
                },
                mousemove: function(e) {
                  if (tip) {
                    tip.style.left = (e.originalEvent.clientX + 12) + 'px';
                    tip.style.top = (e.originalEvent.clientY + 12) + 'px';
                  }
                },
                mouseout: function(e) {
                  geoLayer.resetStyle(e.target);
                  if (tip) tip.hidden = true;
                }
              });
            }
          }).bindPopup(`<b>Zona USDA: ${z.toUpperCase()}</b><br>Temp. Mínima Promedio: ${temperaturasUSDA[z] || 'N/A'}`);
          
          capasPorZona[z] = geoLayer;
          capasActivas.addLayer(geoLayer);
        })
        .catch(e => console.log("GeoJSON no encontrado para la zona " + z));
    }

    function actualizarZonasActivas(nuevasZonas, syncInput = true) {
      const targetZonas = new Set(nuevasZonas.map(z => z.toLowerCase()));
      zonasActivas = targetZonas;

      Object.keys(capasPorZona).forEach(z => {
        if (!zonasActivas.has(z)) {
          if (capasPorZona[z] && capasActivas.hasLayer(capasPorZona[z])) {
            capasActivas.removeLayer(capasPorZona[z]);
          }
          delete capasPorZona[z];
        }
      });

      zonasActivas.forEach(z => {
        if (!capasPorZona[z]) {
          cargarCapaGeoJSONZona(z);
        }
      });

      const zoneGrid = document.querySelector('.zone-grid');
      if (zoneGrid) {
        zoneGrid.querySelectorAll('button').forEach(btn => {
          const btnZone = btn.dataset.zone ? btn.dataset.zone.toLowerCase() : '';
          const isActive = zonasActivas.has(btnZone);
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      }

      actualizarFeedbackTexto();
      filtrarTarjetasEspecies();

      if (syncInput) {
        const inputZonas = document.getElementById('input-zonas');
        if (inputZonas) {
          const arr = Array.from(zonasActivas).map(z => z.toUpperCase());
          inputZonas.value = arr.length > 0 ? `Zona ${arr.join(', ')}` : '';
        }
      }
    }

    function toggleZonaUSDA(z) {
      z = z.toLowerCase();
      const listaActual = Array.from(zonasActivas);
      if (zonasActivas.has(z)) {
        actualizarZonasActivas(listaActual.filter(item => item !== z), true);
      } else {
        actualizarZonasActivas([...listaActual, z], true);
      }
    }

    function actualizarFeedbackTexto() {
      const zoneFeedback = document.getElementById('zone-feedback');
      if (!zoneFeedback) return;

      if (zonasActivas.size === 0) {
        zoneFeedback.innerHTML = `Sin zonas seleccionadas — <em>Hacé clic en una o más zonas de la botonera para visualizarlas en el mapa.</em>`;
        return;
      }

      const ordenZonas = ['1a','1b','2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a'];
      const activasOrdenadas = Array.from(zonasActivas)
        .map(z => z.toLowerCase())
        .sort((a, b) => ordenZonas.indexOf(a) - ordenZonas.indexOf(b));

      const masFria = activasOrdenadas[0];
      const masCalida = activasOrdenadas[activasOrdenadas.length - 1];
      const tempMasFria = temperaturasUSDA[masFria] || 'N/A';

      let textoRango = '';
      if (activasOrdenadas.length > 2) {
        const limiteInferior = activasOrdenadas[1];
        textoRango = `"Zona ${masCalida}" a "Zona ${limiteInferior}"`;
      } else if (activasOrdenadas.length === 2) {
        textoRango = `"Zona ${masCalida}" a "Zona ${masFria}"`;
      } else {
        textoRango = `"Zona ${masFria}"`;
      }

      zoneFeedback.innerHTML = `Zonas activas: ${textoRango} &nbsp;-&nbsp; Zona más fria "Zona ${masFria}" (Temp. Mínima Promedio: ${tempMasFria})`;
    }

    let expandirEspecies = false;

    function filtrarTarjetasEspecies() {
      const speciesCards = Array.from(document.querySelectorAll('.species-card'));
      if (speciesCards.length === 0) return;

      const countMsg = document.getElementById('species-count-msg');
      const jumpBox = document.getElementById('species-jump-box');
      const speciesGrid = document.getElementById('species-grid');
      const emptyState = document.getElementById('species-empty-state');
      const btnMore = document.getElementById('btn-show-more-cards');
      const selectSheet = document.getElementById('select-direct-sheet');

      const coincidentes = speciesCards.filter(card => {
        if (zonasActivas.size === 0) return true;
        const rawZones = card.dataset.zones || '';
        const cardZones = rawZones.toLowerCase().split(/\s+/);
        return Array.from(zonasActivas).some(z => cardZones.includes(z));
      });

      const total = coincidentes.length;

      if (total === 0) {
        if (speciesGrid) speciesGrid.style.display = 'none';
        if (countMsg) countMsg.style.display = 'none';
        if (jumpBox) jumpBox.style.display = 'none';
        if (btnMore) btnMore.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (speciesGrid) speciesGrid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      if (jumpBox) jumpBox.style.display = 'flex';
      if (countMsg) countMsg.style.display = 'block';

      speciesCards.forEach(card => card.classList.add('is-hidden'));

      const limite = expandirEspecies ? total : 3;

      coincidentes.forEach((card, index) => {
        if (index < limite) {
          card.classList.remove('is-hidden');
        }
      });

      if (countMsg) {
        if (total <= 3) {
          countMsg.innerHTML = `Encontramos <strong>${total}</strong> ${total === 1 ? 'especie' : 'especies'} de plantas resistentes a las mínimas de tu zona, que habitualmente comercializamos. Muestra completa a continuación.`;
        } else if (!expandirEspecies) {
          countMsg.innerHTML = `Encontramos <strong>${total}</strong> especies de plantas resistentes a las mínimas de tu zona, que habitualmente comercializamos. Aquí las 3 primeras vistas previas. Sigue los enlaces para ver las fichas completas de cuidados.`;
        } else {
          countMsg.innerHTML = `Mostrando las <strong>${total}</strong> especies compatibles con las zonas climáticas seleccionadas.`;
        }
      }

      if (btnMore) {
        if (total > 3) {
          btnMore.style.display = 'inline-flex';
          if (!expandirEspecies) {
            const restantes = total - 3;
            btnMore.innerHTML = `Ver las restantes ${restantes} vistas previas <i class="fa-solid fa-chevron-down"></i>`;
          } else {
            btnMore.innerHTML = `Ver menos vistas previas <i class="fa-solid fa-chevron-up"></i>`;
          }
        } else {
          btnMore.style.display = 'none';
        }
      }

      if (selectSheet) {
        selectSheet.innerHTML = '<option value="">Selecciona una planta para ir directo a su ficha...</option>';
        coincidentes.forEach(card => {
          const linkEl = card.querySelector('h3 a');
          if (linkEl) {
            const opt = document.createElement('option');
            opt.value = linkEl.getAttribute('href');
            opt.textContent = linkEl.textContent.trim();
            selectSheet.appendChild(opt);
          }
        });
      }
    }

    const btnMoreCards = document.getElementById('btn-show-more-cards');
    if (btnMoreCards) {
      btnMoreCards.addEventListener('click', function() {
        expandirEspecies = !expandirEspecies;
        filtrarTarjetasEspecies();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      });
    }

    const selectSheetEl = document.getElementById('select-direct-sheet');
    if (selectSheetEl) {
      selectSheetEl.addEventListener('change', function() {
        if (this.value) {
          window.location.href = this.value;
        }
      });
    }

    const zoneGrid = document.querySelector('.zone-grid');
    if (zoneGrid) {
      zoneGrid.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
          const z = btn.dataset.zone;
          if (z && tip) {
            const tempRango = temperaturasUSDA[z.toLowerCase()] || 'Rango no especificado';
            tip.textContent = `Zona USDA ${z.toUpperCase()} (${tempRango})`;
            tip.hidden = false;
          }
        });

        btn.addEventListener('mousemove', function(e) {
          if (tip) {
            tip.style.left = (e.clientX + 12) + 'px';
            tip.style.top = (e.clientY + 12) + 'px';
          }
        });

        btn.addEventListener('mouseleave', function() {
          if (tip) tip.hidden = true;
        });
      });

      zoneGrid.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const selectedZone = btn.dataset.zone;
        if (selectedZone) {
          ['input-plantas', 'input-palmeras', 'input-ciudades', 'input-arbolado-especie'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
          toggleZonaUSDA(selectedZone);
        }
      });
    }

    function configBuscador(id, dbTarget) {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('input', function(e) {
        const val = e.target.value.trim().toLowerCase();
        let zonas = dbTarget[val] || (val.length >= 2 ? Object.values(dbTarget).find((_, i) => Object.keys(dbTarget)[i].includes(val)) : null);
        
        if (zonas) {
          ['input-plantas', 'input-palmeras', 'input-zonas', 'input-ciudades'].forEach(i => { if(i !== id) { const input = document.getElementById(i); if(input) input.value = ''; } });
          actualizarZonasActivas(zonas, false);
          map.setView([-38.416097, -63.616672], 4);
        }
      });
    }
    configBuscador('input-plantas', dbPlantas); configBuscador('input-palmeras', dbPalmeras);
    configBuscador('input-zonas', dbZonas); configBuscador('input-ciudades', dbCiudades);

    let todasLasEspecies = [], cacheArboles = [];
    let capaArbolesUrbano = L.layerGroup().addTo(map);
    const inputEspecie = document.getElementById('input-arbolado-especie'), 
          listaSug = document.getElementById('lista-sugerencias'), 
          conStatus = document.getElementById('status-arbolado');

    async function initArbolado() {
      try {
        const [resEsp, resArb] = await Promise.all([
          fetch('/api-arbolado/especies'), 
          fetch('/api-arbolado/arboles')
        ]);
        todasLasEspecies = await resEsp.json(); 
        cacheArboles = await resArb.json();
        if (conStatus) { conStatus.innerText = 'API lista'; conStatus.classList.add('success'); }
      } catch (e) {
        if (conStatus) { conStatus.innerText = 'API no disponible'; conStatus.classList.add('error'); }
      }
    }
    initArbolado();

    let timeout;
    if (inputEspecie) {
      inputEspecie.addEventListener('input', function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const txt = e.target.value.trim().toLowerCase();
          if (txt.length < 2) { if(listaSug) listaSug.style.display = 'none'; capaArbolesUrbano.clearLayers(); return; }
          
          const fil = todasLasEspecies.filter(esp => {
            const comun = (esp.nombre_comun || esp.nombre || '').toLowerCase();
            const cientifico = (esp.nombre_cientifico || esp.nombre_científico || '').toLowerCase();
            return comun.includes(txt) || cientifico.includes(txt);
          }).slice(0, 6);

          if (fil.length === 0) { if(listaSug) listaSug.style.display = 'none'; return; }

          if (listaSug) {
            listaSug.innerHTML = fil.map(esp => {
              const comun = esp.nombre_comun || esp.nombre || esp.slug || 'Especie';
              const cientifico = esp.nombre_cientifico || esp.nombre_científico || '';
              const etiqueta = cientifico ? `${comun} <em>(${cientifico})</em>` : comun;
              const completo = cientifico ? `${comun} (${cientifico})` : comun;
              
              return `<li data-id="${esp.id || ''}" 
                          data-url="${esp.url || ''}" 
                          data-slug="${esp.slug || ''}" 
                          data-comun="${comun}" 
                          data-cientifico="${cientifico}" 
                          data-completo="${completo}">
                        <strong>${etiqueta}</strong>
                      </li>`;
            }).join('');
            listaSug.style.display = 'block';
          }
        }, 300);
      });
    }

    if (listaSug) {
      listaSug.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        const getCleanSegment = str => {
          if (!str) return "";
          const partes = String(str).trim().split('/').filter(Boolean);
          return partes[partes.length - 1].toLowerCase().trim();
        };

        const slugify = str => str ? str.toLowerCase().trim().replace(/[\s_]+/g, '-') : "";

        const rawId = li.getAttribute('data-id') || '';
        const rawUrl = li.getAttribute('data-url') || '';
        const rawSlug = li.getAttribute('data-slug') || '';
        const rawCientifico = li.getAttribute('data-cientifico') || '';
        const rawComun = li.getAttribute('data-comun') || '';
        const nomCompleto = li.getAttribute('data-completo') || rawComun;

        const targetId = getCleanSegment(rawId);
        const targetUrl = rawUrl.trim().toLowerCase();
        const targetUrlSeg = getCleanSegment(rawUrl);
        const targetSlug = slugify(rawSlug || rawCientifico || rawComun);
        const targetCientifico = rawCientifico.trim().toLowerCase();
        const targetComun = rawComun.trim().toLowerCase();

        if (inputEspecie) inputEspecie.value = nomCompleto; 
        listaSug.style.display = 'none';
        
        capaArbolesUrbano.clearLayers();
        if (!cacheArboles || cacheArboles.length === 0) return;

        const filtrados = cacheArboles.filter(a => {
          if (!a) return false;

          let spObj = a.species || a.especie || a.species_id || a.especie_id || '';
          let spStr = '';
          
          if (typeof spObj === 'object' && spObj !== null) {
            spStr = JSON.stringify(spObj).toLowerCase();
          } else {
            spStr = String(spObj).trim().toLowerCase();
          }

          const spSeg = getCleanSegment(spStr);
          const spSlug = slugify(spStr);

          if (targetId && (spSeg === targetId || spStr.includes(`/species/${targetId}/`) || spStr.includes(`"id":${targetId}`) || spStr.includes(`"id":"${targetId}"`))) {
            return true;
          }

          if (targetUrl && (spStr.includes(targetUrl) || (targetUrlSeg && spSeg === targetUrlSeg))) {
            return true;
          }

          if (targetSlug && (spSlug === targetSlug || spSeg === targetSlug || spStr.includes(targetSlug))) {
            return true;
          }

          if (targetCientifico && (spStr.includes(targetCientifico) || spSlug.includes(slugify(targetCientifico)))) {
            return true;
          }

          if (targetComun && (spStr.includes(targetComun) || spSlug.includes(slugify(targetComun)))) {
            return true;
          }

          return false;
        });

        const bounds = [];
        
        filtrados.forEach(a => {
          const lat = parseFloat(a.lat || a.latitude || a.latitud);
          const lng = parseFloat(a.lng || a.longitude || a.longitud);
          if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
              radius: 6,
              fillColor: '#2e7d32',
              color: '#ffffff',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.85
            }).bindPopup(`<b>Árbol #${a.id || 'S/N'}</b><br><em>${nomCompleto}</em>`);

            capaArbolesUrbano.addLayer(marker);
            bounds.push([lat, lng]);
          }
        });

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } else {
          alert(`No se encontraron ejemplares geolocalizados para: ${nomCompleto}`);
        }
      });
    }

    actualizarZonasActivas(ZONAS_INICIALES, true);
  });
})();