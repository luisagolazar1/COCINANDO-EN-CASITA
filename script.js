(function(){
  "use strict";

  const CATEGORIA_INFO = {
    "Asados y parrilla":   { icono:"🔥", color:"#B23A2E" },
    "Empanadas":           { icono:"🥟", color:"#C08A28" },
    "Guisos y pucheros":   { icono:"🍲", color:"#4C6E3F" },
    "Pastas":              { icono:"🍝", color:"#1F5C8A" },
    "Milanesas":           { icono:"🍖", color:"#B23A2E" },
    "Sandwiches":          { icono:"🥪", color:"#C08A28" },
    "Postres y dulces":    { icono:"🍮", color:"#8E4A8C" },
    "Panificados":         { icono:"🍞", color:"#4C6E3F" },
    "Salsas y aderezos":   { icono:"🥄", color:"#1F5C8A" },
    "Bebidas":             { icono:"🧉", color:"#3E8E7E" }
  };

  const TIEMPOS = [
    { label:"Hasta 30 min", max:30 },
    { label:"Hasta 60 min", max:60 },
    { label:"Hasta 90 min", max:90 },
    { label:"Sin límite", max:Infinity }
  ];

  const estado = {
    texto: "",
    categorias: new Set(),
    ingredientes: new Set(),
    dificultades: new Set(),
    tiempoMax: Infinity
  };

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function normalizar(str){
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  }

  function capitalizar(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ---------- construir listas de filtros ----------
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

  // ---------- filtrado ----------
  function recetasFiltradas(){
    const texto = normalizar(estado.texto.trim());
    let lista = RECETAS.filter(r => {
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

  // ---------- render ----------
  function render(){
    const lista = recetasFiltradas();
    const grid = $("#grid-recetas");
    const sinResultados = $("#sin-resultados");
    grid.innerHTML = "";

    $("#contador-resultados").textContent =
      `${lista.length} receta${lista.length===1?"":"s"} encontrada${lista.length===1?"":"s"}`;

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

  function crearTarjeta(r){
    const info = CATEGORIA_INFO[r.categoria] || { icono:"🍽️", color:"#B23A2E" };
    const div = document.createElement("button");
    div.type = "button";
    div.className = "tarjeta";
    div.style.setProperty("--cat-color", info.color);
    div.setAttribute("aria-haspopup","dialog");

    let matchHTML = "";
    if(typeof r._match === "number" && estado.ingredientes.size){
      matchHTML = `<div class="tarjeta-match">✓ coincide con ${r._match} de ${estado.ingredientes.size} ingrediente${estado.ingredientes.size===1?"":"s"}</div>`;
    }

    div.innerHTML = `
      <div class="tarjeta-top">
        <div class="tarjeta-icono">${info.icono}</div>
        <div>
          <div class="tarjeta-cat">${r.categoria}</div>
          <h3>${r.nombre}</h3>
        </div>
      </div>
      ${matchHTML}
      <div class="tarjeta-meta">
        <span>⏱ ${r.tiempo} min</span>
        <span>👥 ${r.porciones}</span>
        <span>📋 ${r.dificultad}</span>
      </div>
    `;
    div.addEventListener("click", () => abrirModal(r));
    return div;
  }

  // ---------- modal ----------
  function abrirModal(r){
    const info = CATEGORIA_INFO[r.categoria] || { icono:"🍽️", color:"#B23A2E" };
    const overlay = $("#modal-overlay");
    const cont = $("#modal-contenido");
    cont.style.setProperty("--cat-color", info.color);
    cont.innerHTML = `
      <span class="modal-cat" style="background:${info.color}">${info.icono} ${r.categoria}</span>
      <h2 id="modal-titulo">${r.nombre}</h2>
      <div class="modal-meta">
        <span>⏱ ${r.tiempo} minutos</span>
        <span>👥 ${r.porciones} porciones</span>
        <span>📋 Dificultad: ${r.dificultad}</span>
      </div>
      <h4>Ingredientes</h4>
      <ul>${r.ingredientes.map(i => `<li>${i}</li>`).join("")}</ul>
      <h4>Preparación</h4>
      <ol>${r.pasos.map(p => `<li>${p}</li>`).join("")}</ol>
    `;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $("#btn-cerrar-modal").focus();
  }

  function cerrarModal(){
    $("#modal-overlay").hidden = true;
    document.body.style.overflow = "";
  }

  // ---------- eventos generales ----------
  function init(){
    construirFiltros();
    $("#contador-total").textContent = RECETAS.length;

    $("#buscador").addEventListener("input", e => {
      estado.texto = e.target.value;
      render();
    });

    $("#btn-cerrar-modal").addEventListener("click", cerrarModal);
    $("#modal-overlay").addEventListener("click", e => {
      if(e.target.id === "modal-overlay") cerrarModal();
    });
    document.addEventListener("keydown", e => {
      if(e.key === "Escape") cerrarModal();
    });

    $("#btn-sorpresa").addEventListener("click", () => {
      const lista = recetasFiltradas();
      const base = lista.length ? lista : RECETAS;
      const elegida = base[Math.floor(Math.random()*base.length)];
      abrirModal(elegida);
    });

    $("#btn-limpiar").addEventListener("click", () => {
      estado.texto = "";
      estado.categorias.clear();
      estado.ingredientes.clear();
      estado.dificultades.clear();
      estado.tiempoMax = Infinity;
      $("#buscador").value = "";
      $$(".chip").forEach(c => c.classList.remove("activo"));
      render();
    });

    $("#btn-filtros-mobile").addEventListener("click", () => {
      $("#panel-filtros").classList.toggle("abierto");
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
