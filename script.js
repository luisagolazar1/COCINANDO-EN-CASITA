(function(){
  "use strict";

  const CATEGORIA_INFO = {
    "Asados y parrilla":   { icono:"🔥", color:"#B23A2E", thumb:"assets/thumbs/thumb-parrilla.png" },
    "Empanadas":           { icono:"🥟", color:"#C08A28", thumb:"assets/thumbs/thumb-empanadas.png" },
    "Guisos y pucheros":   { icono:"🍲", color:"#4C6E3F", thumb:"assets/thumbs/thumb-guisos.png" },
    "Pastas":              { icono:"🍝", color:"#1F5C8A", thumb:"assets/thumbs/thumb-pastas.png" },
    "Milanesas":           { icono:"🍖", color:"#B23A2E", thumb:"assets/thumbs/thumb-milanesas.png" },
    "Sandwiches":          { icono:"🥪", color:"#C08A28", thumb:"assets/thumbs/thumb-sandwiches.png" },
    "Postres y dulces":    { icono:"🍮", color:"#8E4A8C", thumb:"assets/thumbs/thumb-postres.png" },
    "Panificados":         { icono:"🍞", color:"#4C6E3F", thumb:"assets/thumbs/thumb-panificados.png" },
    "Salsas y aderezos":   { icono:"🥄", color:"#1F5C8A", thumb:"assets/thumbs/thumb-salsas.png" },
    "Bebidas":             { icono:"🧉", color:"#3E8E7E", thumb:"assets/thumbs/thumb-bebidas.png" },
    "Comida saludable":       { icono:"🥗", color:"#3E8E5E", thumb:"assets/thumbs/thumb-saludable.png" },
    "Comida saludable viral": { icono:"🌱", color:"#2E9E6E", thumb:"assets/thumbs/thumb-saludable_viral.png" },
    "Comida internacional":   { icono:"🌍", color:"#8A5A2E", thumb:"assets/thumbs/thumb-internacional.png" },
    "Freidora de aire":       { icono:"🍟", color:"#C97A2E", thumb:"assets/thumbs/thumb-freidora.png" }
  };

  const TIEMPOS = [
    { label:"Hasta 30 min", max:30 },
    { label:"Hasta 60 min", max:60 },
    { label:"Hasta 90 min", max:90 },
    { label:"Sin límite", max:Infinity }
  ];

  const LS_ELIMINADAS = "cec_recetas_eliminadas";
  const LS_CALIFICACIONES = "cec_recetas_calificaciones";

  function cargarEliminadas(){
    try{ return new Set(JSON.parse(localStorage.getItem(LS_ELIMINADAS)) || []); }
    catch(e){ return new Set(); }
  }
  function guardarEliminadas(set){
    localStorage.setItem(LS_ELIMINADAS, JSON.stringify([...set]));
  }
  function cargarCalificaciones(){
    try{ return JSON.parse(localStorage.getItem(LS_CALIFICACIONES)) || {}; }
    catch(e){ return {}; }
  }
  function guardarCalificaciones(obj){
    localStorage.setItem(LS_CALIFICACIONES, JSON.stringify(obj));
  }

  const CALIFICACIONES_INFO = {
    "regular":   { label:"Regular",    emoji:"🙂" },
    "buena":     { label:"Buena",      emoji:"😋" },
    "muy_buena": { label:"Muy buena",  emoji:"🤩" }
  };

  const estado = {
    texto: "",
    categorias: new Set(),
    ingredientes: new Set(),
    dificultades: new Set(),
    tiempoMax: Infinity,
    eliminadas: cargarEliminadas(),
    calificaciones: cargarCalificaciones(),
    verEliminadas: false
  };

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function normalizar(str){
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }

  function capitalizar(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function construirFiltros(){
    const categorias = [...new Set(RECETAS.map(r => r.categoria))].sort();
    const contCat = $("#chips-categoria");
    categorias.forEach(cat => {
      const info = CATEGORIA_INFO[cat] || { icono:"🍽️", color:"#B23A2E" };
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.textContent = `${info.icono} ${cat}`;
      chip.addEventListener("click", () => {
        toggleSet(estado.categorias, cat, chip);
        render();
      });
      contCat.appendChild(chip);
    });

    const ingredientesCount = {};
    RECETAS.forEach(r => r.tags.forEach(t => {
      ingredientesCount[t] = (ingredientesCount[t]||0)+1;
    }));
    const ingredientesOrdenados = Object.keys(ingredientesCount)
      .sort((a,b) => ingredientesCount[b]-ingredientesCount[a] || a.localeCompare(b));

    const contIng = $("#chips-ingredientes");
    ingredientesOrdenados.forEach(ing => {
      const chip = document.createElement("button");
      chip.className = "chip tag-ingrediente";
      chip.type = "button";
      chip.textContent = capitalizar(ing);
      chip.addEventListener("click", () => {
        toggleSet(estado.ingredientes, ing, chip);
        render();
      });
      contIng.appendChild(chip);
    });

    const dificultades = ["Fácil","Media","Difícil"];
    const contDif = $("#chips-dificultad");
    dificultades.forEach(d => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.textContent = d;
      chip.addEventListener("click", () => {
        toggleSet(estado.dificultades, d, chip);
        render();
      });
      contDif.appendChild(chip);
    });

    const contTiempo = $("#chips-tiempo");
    TIEMPOS.forEach(t => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.textContent = t.label;
      chip.dataset.max = t.max;
      chip.addEventListener("click", () => {
        const yaActivo = estado.tiempoMax === t.max;
        $$("#chips-tiempo .chip").forEach(c => c.classList.remove("activo"));
        estado.tiempoMax = yaActivo ? Infinity : t.max;
        if(!yaActivo) chip.classList.add("activo");
        render();
      });
      contTiempo.appendChild(chip);
    });
  }

  function toggleSet(set, valor, chipEl){
    if(set.has(valor)){ set.delete(valor); chipEl.classList.remove("activo"); }
    else { set.add(valor); chipEl.classList.add("activo"); }
  }

  function recetasFiltradas(){
    const texto = normalizar(estado.texto.trim());
    let lista = RECETAS.filter(r => {
      const estaEliminada = estado.eliminadas.has(r.id);
      if(estado.verEliminadas){
        if(!estaEliminada) return false;
      } else {
        if(estaEliminada) return false;
      }
      if(texto && !normalizar(r.nombre).includes(texto)) return false;
      if(estado.categorias.size && !estado.categorias.has(r.categoria)) return false;
      if(estado.dificultades.size && !estado.dificultades.has(r.dificultad)) return false;
      if(r.tiempo > estado.tiempoMax) return false;
      return true;
    });

    if(estado.ingredientes.size){
      lista = lista
        .map(r => {
          const coincidencias = r.tags.filter(t => estado.ingredientes.has(t)).length;
          return { r, coincidencias };
        })
        .filter(x => x.coincidencias > 0)
        .sort((a,b) => b.coincidencias - a.coincidencias || a.r.nombre.localeCompare(b.r.nombre))
        .map(x => ({ ...x.r, _match: x.coincidencias }));
    }
    return lista;
  }

  function render(){
    const lista = recetasFiltradas();
    const grid = $("#grid-recetas");
    const sinResultados = $("#sin-resultados");
    grid.innerHTML = "";

    $("#contador-resultados").textContent = estado.verEliminadas
      ? `${lista.length} receta${lista.length===1?"":"s"} en la papelera`
      : `${lista.length} receta${lista.length===1?"":"s"} encontrada${lista.length===1?"":"s"}`;

    renderChipsActivos();

    if(lista.length === 0){
      sinResultados.hidden = false;
      return;
    }
    sinResultados.hidden = true;

    const frag = document.createDocumentFragment();
    lista.forEach(r => frag.appendChild(crearTarjeta(r)));
    grid.appendChild(frag);
  }

  function renderChipsActivos(){
    const cont = $("#chips-activos");
    cont.innerHTML = "";
    const activos = [
      ...[...estado.categorias],
      ...[...estado.ingredientes].map(capitalizar),
      ...[...estado.dificultades]
    ];
    activos.forEach(a => {
      const s = document.createElement("span");
      s.className = "chip-activo-mini";
      s.textContent = a;
      cont.appendChild(s);
    });
  }

  let recetaAbiertaId = null;

  function crearTarjeta(r){
    const info = CATEGORIA_INFO[r.categoria] || { icono:"🍽️", color:"#B23A2E" };
    const abierta = recetaAbiertaId === r.id;

    const div = document.createElement("div");
    div.className = "tarjeta" + (abierta ? " abierta" : "");
    div.style.setProperty("--cat-color", info.color);

    let matchHTML = "";
    if(typeof r._match === "number" && estado.ingredientes.size){
      matchHTML = `<div class="tarjeta-match">✓ coincide con ${r._match} de ${estado.ingredientes.size} ingrediente${estado.ingredientes.size===1?"":"s"}</div>`;
    }

    const cal = estado.calificaciones[r.id];
    const calInfo = cal ? CALIFICACIONES_INFO[cal] : null;
    const calHTML = calInfo ? `<div class="tarjeta-calificacion">${calInfo.emoji} ${calInfo.label}</div>` : "";

    const cabecera = document.createElement("button");
    cabecera.type = "button";
    cabecera.className = "tarjeta-cabecera";
    cabecera.innerHTML = `
      <div class="tarjeta-top">
        <div class="tarjeta-icono">${info.thumb ? `<img src="${info.thumb}" alt="" loading="lazy">` : info.icono}</div>
        <div>
          <div class="tarjeta-cat">${r.categoria}</div>
          <h3>${r.nombre}</h3>
        </div>
      </div>
      ${matchHTML}
      ${calHTML}
      <div class="tarjeta-meta">
        <span>⏱ ${r.tiempo} min</span>
        <span>👥 ${r.porciones}</span>
        <span>📋 ${r.dificultad}</span>
      </div>
    `;
    cabecera.addEventListener("click", () => {
      recetaAbiertaId = abierta ? null : r.id;
      render();
      if(!abierta){
        requestAnimationFrame(() => {
          div.scrollIntoView({ behavior:"smooth", block:"start" });
        });
      }
    });
    div.appendChild(cabecera);

    if(abierta){
      const detalle = document.createElement("div");
      detalle.className = "detalle";
      detalle.innerHTML = `
        <h4>Ingredientes</h4>
        <ul>${r.ingredientes.map(i => `<li>${i}</li>`).join("")}</ul>
        <h4>Preparación</h4>
        <ol>${r.pasos.map(p => `<li>${p}</li>`).join("")}</ol>
        <h4>¿Qué te pareció?</h4>
        <div class="calificacion-botones"></div>
      `;

      const contCal = detalle.querySelector(".calificacion-botones");
      Object.entries(CALIFICACIONES_INFO).forEach(([key, info]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-calificacion" + (estado.calificaciones[r.id] === key ? " activo" : "");
        btn.textContent = `${info.emoji} ${info.label}`;
        btn.addEventListener("click", () => {
          if(estado.calificaciones[r.id] === key){
            delete estado.calificaciones[r.id];
          } else {
            estado.calificaciones[r.id] = key;
          }
          guardarCalificaciones(estado.calificaciones);
          render();
        });
        contCal.appendChild(btn);
      });

      const btnAccion = document.createElement("button");
      btnAccion.type = "button";
      btnAccion.className = "btn-eliminar-receta";
      if(estado.eliminadas.has(r.id)){
        btnAccion.textContent = "↩ Restaurar receta";
        btnAccion.addEventListener("click", () => {
          estado.eliminadas.delete(r.id);
          guardarEliminadas(estado.eliminadas);
          recetaAbiertaId = null;
          render();
        });
      } else {
        btnAccion.textContent = "🗑 Quitar del recetario";
        btnAccion.addEventListener("click", () => {
          if(confirm(`¿Quitar "${r.nombre}" del recetario? Vas a poder restaurarla desde la papelera.`)){
            estado.eliminadas.add(r.id);
            guardarEliminadas(estado.eliminadas);
            recetaAbiertaId = null;
            render();
          }
        });
      }
      detalle.appendChild(btnAccion);

      const btnCerrar = document.createElement("button");
      btnCerrar.type = "button";
      btnCerrar.className = "btn-cerrar-detalle";
      btnCerrar.textContent = "Cerrar";
      btnCerrar.addEventListener("click", () => {
        recetaAbiertaId = null;
        render();
      });
      detalle.appendChild(btnCerrar);
      div.appendChild(detalle);
    }

    return div;
  }

  function init(){
    construirFiltros();
    $("#contador-total").textContent = RECETAS.length;

    $("#buscador").addEventListener("input", e => {
      estado.texto = e.target.value;
      render();
    });

    $("#btn-sorpresa").addEventListener("click", () => {
      const lista = recetasFiltradas();
      const base = lista.length ? lista : RECETAS;
      const elegida = base[Math.floor(Math.random()*base.length)];
      recetaAbiertaId = elegida.id;
      render();
      requestAnimationFrame(() => {
        const el = document.querySelector(".tarjeta.abierta");
        if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
      });
    });

    $("#btn-limpiar").addEventListener("click", () => {
      estado.texto = "";
      estado.categorias.clear();
      estado.ingredientes.clear();
      estado.dificultades.clear();
      estado.tiempoMax = Infinity;
      recetaAbiertaId = null;
      $("#buscador").value = "";
      $$(".chip").forEach(c => c.classList.remove("activo"));
      render();
    });

    $("#btn-filtros-mobile").addEventListener("click", () => {
      $("#panel-filtros").classList.toggle("abierto");
    });

    const btnPapelera = $("#btn-papelera");
    if(btnPapelera){
      btnPapelera.addEventListener("click", () => {
        estado.verEliminadas = !estado.verEliminadas;
        recetaAbiertaId = null;
        btnPapelera.classList.toggle("activo", estado.verEliminadas);
        btnPapelera.textContent = estado.verEliminadas ? "📖 Volver al recetario" : "🗑 Papelera";
        render();
      });
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
