// ACÁ PEGAS EL LINK PÚBLICO .CSV DE TU GOOGLE SHEETS
const LINK_CSV_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeULs7WjNOZeoQWZcTdwUqFbc6T89LXE3mV2HH3LBWWa72YMGNyZc68go6ZRoXYg1iDQWikUqOJLic/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
    let materiasAgrupadas = {}; 
    let carreraActiva = "astro"; 
    let modoBusqueda = false;

    const grilla = document.getElementById("grilla-materias");
    const buscador = document.getElementById("buscador-materias");
    const tabs = document.querySelectorAll(".tab-btn");
    const modal = document.getElementById("modal-materia");
    const modalInfo = document.getElementById("modal-info-materia");

    // 1. CARGAR DATOS DESDE GOOGLE SHEETS
    function cargarDatos() {
        if (LINK_CSV_GOOGLE_SHEETS === "TU_LINK_LARGUISIMO_ACA") {
            grilla.innerHTML = "<p style='text-align:center; width:100%; color:red;'>Falta pegar el link del CSV en el archivo materias.js</p>";
            return;
        }

        Papa.parse(LINK_CSV_GOOGLE_SHEETS, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(resultados) {
                procesarDatos(resultados.data);
                renderizarGrilla();
            },
            error: function(error) {
                console.error("Error al leer el Excel:", error);
                grilla.innerHTML = "<p style='text-align:center; width:100%; color:red;'>Error al cargar la base de datos.</p>";
            }
        });
    }

    // 2. AGRUPAR COMISIONES
    function procesarDatos(datos) {
        materiasAgrupadas = {};
        datos.forEach(fila => {
            if (!fila.codigo || fila.codigo.trim() === "") return;

            if (!materiasAgrupadas[fila.codigo]) {
                materiasAgrupadas[fila.codigo] = {
                    codigo: fila.codigo, materia: fila.materia,
                    link_web: fila.link_web, link_drive: fila.link_drive, link_programa: fila.link_programa,
                    mail_materia: fila.mail_materia, promocion: fila.promocion, redictado: fila.redictado,
                    perteneceA: {
                        astro: fila.anio_astro ? { anio: fila.anio_astro, cuatri: fila.cuatri_astro, corr: fila.corr_astro } : null,
                        geo: fila.anio_geo ? { anio: fila.anio_geo, cuatri: fila.cuatri_geo, corr: fila.corr_geo } : null,
                        meteo: fila.anio_meteo ? { anio: fila.anio_meteo, cuatri: fila.cuatri_meteo, corr: fila.corr_meteo } : null
                    },
                    comisiones: []
                };
            }
            materiasAgrupadas[fila.codigo].comisiones.push({
                nombre: fila.comision, teoria: fila.horario_teoria, practica: fila.horario_practica, otros: fila.horario_otros,
                profesor: fila.profesor, mail_profe: fila.mail_profe, celular_profe: fila.celular_profe,
                jtp: fila.jtp, mail_jtp: fila.mail_jtp, celular_jtp: fila.celular_jtp
            });
        });
    }

    // 3. DIBUJAR TARJETAS
    function renderizarGrilla() {
        grilla.innerHTML = "";
        const textoBusqueda = buscador.value.toLowerCase().trim();
        modoBusqueda = textoBusqueda.length > 0;
        let cantidadMostrada = 0;

        Object.values(materiasAgrupadas).forEach(mat => {
            let mostrar = false;
            if (modoBusqueda) {
                if (mat.materia.toLowerCase().includes(textoBusqueda) || mat.codigo.toLowerCase().includes(textoBusqueda)) mostrar = true;
            } else {
                if (mat.perteneceA[carreraActiva]) mostrar = true;
            }

            if (mostrar) {
                cantidadMostrada++;
                const card = document.createElement("div");
                card.classList.add("materia-card");
                
                let tagsHTML = "";
                if (mat.promocion === "Sí") tagsHTML += `<span class="tag" style="background:#dcfce7; color:#166534;">Promocionable</span>`;
                if (mat.redictado === "Sí") tagsHTML += `<span class="tag" style="background:#ffedd5; color:#9a3412;">Redictado</span>`;
                
                card.innerHTML = `<h3>${mat.materia} <span style="font-size:0.9rem; color:#888; font-weight:normal;">(${mat.codigo})</span></h3><div class="tags-container">${tagsHTML}</div>`;
                card.addEventListener("click", () => abrirModal(mat));
                grilla.appendChild(card);
            }
        });

        if (cantidadMostrada === 0) grilla.innerHTML = `<p style="text-align:center; width:100%; color:#888;">No se encontraron materias.</p>`;
    }

    // --- FUNCIÓN HELPER: De "1" a "Primer" ---
    function numeroAOrdinal(numStr) {
        if (!numStr) return "";
        const num = parseInt(numStr.trim());
        if (isNaN(num)) return numStr; 
        const ordinales = ["", "Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto"];
        return ordinales[num] || numStr;
    }

    // 4. ABRIR EL MODAL 
    function abrirModal(mat) {
        // --- 1. Tags ---
        let tagsHTML = "";
        if (mat.promocion === "Sí") tagsHTML += `<span class="tag" style="background:#dcfce7; color:#166534;">Promocionable</span>`;
        if (mat.redictado === "Sí") tagsHTML += `<span class="tag" style="background:#ffedd5; color:#9a3412;">Redictado</span>`;

        // --- 2. Plan de Estudios Inteligente ---
        const armarInfoPlan = (info) => {
            const anioText = numeroAOrdinal(info.anio) + " año";
            const cuatriVal = info.cuatri ? info.cuatri.trim().toLowerCase() : "";
            const cuatriText = cuatriVal === 'anual' ? 'Anual' : numeroAOrdinal(info.cuatri) + " cuatrimestre";
            
            let corrHTML = "<span style='color:#6b7280;'>Ninguna</span>";
            if (info.corr) corrHTML = info.corr.split(',').map(c => `<span class="tag" style="background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; font-size:0.8rem;">${c.trim()}</span>`).join(' ');
            
            return `<p style="margin:0 0 6px 0;"><strong>${anioText} - ${cuatriText}</strong></p>
                    <p style="margin:0; font-size:0.95rem;"><strong>Correlativas requeridas:</strong> ${corrHTML}</p>`;
        };

        let planesHTML = "";
        if (!modoBusqueda) {
            // Si viene de una pestaña, muestra solo ese plan
            planesHTML = armarInfoPlan(mat.perteneceA[carreraActiva]);
        } else {
            // Si viene del buscador, lista las carreras a las que pertenece
            let listas = [];
            if (mat.perteneceA.astro) listas.push(`<div><h4 style="margin:0 0 4px 0; color:var(--primary);">Astronomía</h4>${armarInfoPlan(mat.perteneceA.astro)}</div>`);
            if (mat.perteneceA.geo) listas.push(`<div><h4 style="margin:0 0 4px 0; color:var(--primary);">Geofísica</h4>${armarInfoPlan(mat.perteneceA.geo)}</div>`);
            if (mat.perteneceA.meteo) listas.push(`<div><h4 style="margin:0 0 4px 0; color:var(--primary);">Meteorología</h4>${armarInfoPlan(mat.perteneceA.meteo)}</div>`);
            planesHTML = listas.join('<hr style="margin:12px 0; border:0; border-top:1px dashed #cbd5e1;">');
        }

        // --- 3. Selector de Comisiones ---
        let selectorComisionesHTML = "";
        if (mat.comisiones.length > 1) {
            selectorComisionesHTML = `
                <div style="margin-bottom: 15px; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; display:flex; align-items:center; gap:10px;">
                    <label style="font-weight:bold; color: var(--black);"><i class="fa-solid fa-list"></i> Comisión:</label>
                    <select id="select-comision-modal" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.95rem; cursor: pointer; outline:none; flex-grow:1;">
                        ${mat.comisiones.map((c, i) => `<option value="${i}">${c.nombre || `Comisión ${i+1}`}</option>`).join("")}
                    </select>
                </div>
            `;
        }

        // --- 4. Armado del Modal ---
        modalInfo.innerHTML = `
            <h2 style="margin-top:0; margin-bottom:5px; color:var(--primary);">${mat.materia}</h2>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:15px; gap:10px;">
                <p style="margin:0; color:#6b7280; font-weight:bold;">Código: ${mat.codigo}</p>
                <div class="tags-container" style="margin-top:0;">${tagsHTML}</div>
            </div>
            
            <div style="margin: 15px 0; display:flex; gap:10px; flex-wrap: wrap;">
                ${mat.link_web ? `<a href="${mat.link_web}" target="_blank" class="tag" style="background:#e0f2fe; color:#0369a1;"><i class="fa-solid fa-globe"></i> Página Web</a>` : ""}
                ${mat.link_drive ? `<a href="${mat.link_drive}" target="_blank" class="tag" style="background:#dcfce7; color:#15803d;"><i class="fa-brands fa-google-drive"></i> Apuntes</a>` : ""}
                ${mat.link_programa ? `<a href="${mat.link_programa}" target="_blank" class="tag" style="background:#f3e8ff; color:#7e22ce;"><i class="fa-solid fa-file-pdf"></i> Programa</a>` : ""}
                ${mat.mail_materia ? `<span class="tag" style="background:#f3f4f6;"><i class="fa-solid fa-envelope"></i> ${mat.mail_materia}</span>` : ""}
            </div>
            
            <div style="margin-top:15px; margin-bottom:20px; padding:15px; border-left:4px solid var(--primary); background:#f8fafc; border-radius:4px;">
                <h3 style="margin-top:0; margin-bottom:10px; font-size: 1.1rem; color:#334155;">Plan de estudios</h3>
                ${planesHTML}
            </div>
            
            <hr style="margin: 20px 0 15px 0; border: 0; border-top: 1px solid #e5e7eb;">
            <h3 style="margin-bottom: 15px;">Horarios de cursada</h3>
            
            ${selectorComisionesHTML}
            <div id="contenedor-detalle-comision"></div>
        `;

        modal.classList.remove("oculto");

        // --- 5. Función para pintar la comisión elegida ---
        const renderComision = (index) => {
            const c = mat.comisiones[index];
            document.getElementById("contenedor-detalle-comision").innerHTML = `
                <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <strong style="color:var(--primary); display:block; margin-bottom:10px; font-size:1.1rem;">
                        <i class="fa-solid fa-users"></i> ${c.nombre || "Única"}
                    </strong>
                    
                    ${c.teoria ? `<div style="margin-bottom:6px;"><strong>Teoría:</strong> ${c.teoria}</div>` : ""}
                    ${c.practica ? `<div style="margin-bottom:6px;"><strong>Práctica:</strong> ${c.practica}</div>` : ""}
                    ${c.otros ? `<div style="margin-bottom:6px;"><strong>Otros:</strong> ${c.otros}</div>` : ""}
                    
                    <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #cbd5e1;">
                        <div style="margin-bottom:6px;">
                            <strong>👨‍🏫 Profesor:</strong> ${c.profesor || "A definir"} 
                            ${c.mail_profe ? `<span style="color:#6b7280;"> | ✉️ ${c.mail_profe}</span>` : ""} 
                            ${c.celular_profe ? `<span style="color:#6b7280;"> | 📱 ${c.celular_profe}</span>` : ""}
                        </div>
                        ${c.jtp ? `
                        <div>
                            <strong>🧑‍🏫 JTP:</strong> ${c.jtp}
                            ${c.mail_jtp ? `<span style="color:#6b7280;"> | ✉️ ${c.mail_jtp}</span>` : ""} 
                            ${c.celular_jtp ? `<span style="color:#6b7280;"> | 📱 ${c.celular_jtp}</span>` : ""}
                        </div>` : ""}
                    </div>
                </div>
            `;
        };

        // Pintamos por defecto la primera comisión
        renderComision(0);

        // Si hay más de una, le agregamos el evento al selector
        if (mat.comisiones.length > 1) {
            document.getElementById("select-comision-modal").addEventListener("change", (e) => renderComision(e.target.value));
        }
    }

    // 5. EVENTOS GLOBALES
    buscador.addEventListener("input", renderizarGrilla);
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.classList.remove("activo"));
            e.target.classList.add("activo");
            carreraActiva = e.target.dataset.carrera;
            buscador.value = ""; 
            renderizarGrilla();
        });
    });

    document.getElementById("cerrar-modal").addEventListener("click", () => modal.classList.add("oculto"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("oculto"); });

    cargarDatos();
});
