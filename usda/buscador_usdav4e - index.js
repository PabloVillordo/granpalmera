// ARBOLADO URBANO API
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
      inputEspecie.addEventListener('input', function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const txt = e.target.value.trim().toLowerCase();
          if (txt.length < 2) { listaSug.style.display = 'none'; capaArbolesUrbano.clearLayers(); return; }
          
          const fil = todasLasEspecies.filter(esp => {
            const comun = (esp.nombre_comun || esp.nombre || '').toLowerCase();
            const cientifico = (esp.nombre_cientifico || esp.nombre_científico || '').toLowerCase();
            return comun.includes(txt) || cientifico.includes(txt);
          }).slice(0, 6);

          if (fil.length === 0) { listaSug.style.display = 'none'; return; }

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
        }, 300);
      });

      listaSug.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        // Función para aislar el ID o segmento final de una URL/cadena
        const getCleanSegment = str => {
          if (!str) return "";
          const partes = String(str).trim().split('/').filter(Boolean);
          return partes[partes.length - 1].toLowerCase().trim();
        };

        const slugify = str => str ? str.toLowerCase().trim().replace(/\s+/g, '-') : "";

        // Obtener identificadores limpios de la opción seleccionada
        const espId = getCleanSegment(li.getAttribute('data-id'));
        const espUrlSeg = getCleanSegment(li.getAttribute('data-url'));
        const espSlug = getCleanSegment(li.getAttribute('data-slug'));
        const espComun = (li.getAttribute('data-comun') || '').trim().toLowerCase();
        const espCientifico = (li.getAttribute('data-cientifico') || '').trim().toLowerCase();
        const nomCompleto = li.getAttribute('data-completo') || espComun;
        
        inputEspecie.value = nomCompleto; 
        listaSug.style.display = 'none';
        
        capaArbolesUrbano.clearLayers();
        if (!cacheArboles || cacheArboles.length === 0) return;

        // Conjunto de identificadores exactos esperados
        const exactTargets = new Set();
        if (espId) exactTargets.add(espId);
        if (espUrlSeg) exactTargets.add(espUrlSeg);
        if (espSlug) exactTargets.add(espSlug);

        // Conjunto de nombres exactos esperados
        const textTargets = new Set();
        if (espCientifico) {
          textTargets.add(espCientifico);
          textTargets.add(slugify(espCientifico));
        }
        if (espComun) {
          textTargets.add(espComun);
          textTargets.add(slugify(espComun));
        }

        // Filtrar evaluando únicamente coincidencias exactas
        const filtrados = cacheArboles.filter(a => {
          if (!a) return false;
          const valRaw = String(a.species || a.species_id || a.especie || a.especie_id || '').trim().toLowerCase();
          if (!valRaw) return false;

          const valSeg = getCleanSegment(valRaw);

          // 1. Coincidencia exacta por ID / Slug / Segmento de URL
          if (exactTargets.has(valRaw) || exactTargets.has(valSeg)) {
            return true;
          }

          // 2. Coincidencia exacta por Nombre Científico o Común
          if (textTargets.has(valRaw) || textTargets.has(valSeg)) {
            return true;
          }

          return false;
        });

        const bounds = [];
        
        // Renderizado vectorial ligero con L.circleMarker
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