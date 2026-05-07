const LINK_CSV_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeULs7WjNOZeoQWZcTdwUqFbc6T89LXE3mV2HH3LBWWa72YMGNyZc68go6ZRoXYg1iDQWikUqOJLic/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
    let materiasAgrupadas = {}; 
    let carreraActiva = "astro"; 
    let modoBusqueda = false;

    const grilla = document.getElementById("grilla-materias");
    const buscador = document.getElementById("buscador-materias");
    const tabsContainer = document.querySelector(".tabs-carreras");
    const tabs = document.querySelectorAll(".tab-btn");
    const modal = document.getElementById("modal-materia");
    const modalInfo = document.getElementById("modal-info-materia");

    function cargarDatos() {
        Papa.parse(LINK_CSV_GOOGLE_SHEETS, {
            download: true, header: true, skipEmptyLines: true,
            complete: function(res) {
                procesarDatos(res.data);
                renderizarGrilla();
            }
        });
    }

    function procesarDatos(datos) {
        materiasAgrupadas = {};
        datos.forEach(fila => {
            if (!fila.codigo || fila.codigo.trim() === "") return;
            if (!materiasAgrupadas[fila.codigo]) {
                materiasAgrupadas[fila.codigo] = {
                    codigo: fila.codigo, materia: fila.materia,
                    link_web: fila.link_web, link_drive: fila.link_drive, link_programa: fila.link_programa,
                    mail_materia: fila.mail_materia, promocion: fila.promocion, redictado: fila.redictado,
                    info_extra: fila.info_extra, // <--- Info Extra capturada
                    perteneceA: {
                        astro: fila.anio_astro ? { anio: parseInt(fila.anio_astro), cuatri: fila.cuatri_astro, corr: fila.corr_astro } : null,
                        geo: fila.anio_geo ? { anio: parseInt(fila.anio_geo), cuatri: fila.cuatri_geo, corr: fila.corr_geo } : null,
                        meteo: fila.anio_meteo ? { anio: parseInt(fila.anio_meteo), cuatri: fila.cuatri_meteo, corr: fila.corr_meteo } : null
                    },
                    comisiones: []
                };
            }
            materiasAgrupadas[fila.codigo].comisiones.push(fila);
        });
    }

    function numeroAOrdinal(num) {
        const ordinales = ["", "Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto"];
        return ordinales[num] || num;
    }

    function renderizarGrilla() {
        grilla.innerHTML = "";
        const texto = buscador.value.toLowerCase().trim();
        modoBusqueda = texto.length > 0;

        // Ocultar pestañas si estamos buscando
        tabsContainer.style.display = modoBusqueda ? "none" : "flex";

        if (modoBusqueda) {
            // Render simple para búsqueda
            Object.values(materiasAgrupadas).forEach(mat => {
                if (mat.materia.toLowerCase().includes(texto) || mat.codigo.toLowerCase().includes(texto)) {
                    grilla.appendChild(crearTarjeta(mat));
                }
            });
        } else {
            // Render agrupado por AÑO para la carrera activa
            const materiasCarrera = Object.values(materiasAgrupadas).filter(m => m.perteneceA[carreraActiva]);
            const anios = [...new Set(materiasCarrera.map(m => m.perteneceA[carreraActiva].anio))].sort();

            anios.forEach(anio => {
                const seccionAnio = document.createElement("div");
                seccionAnio.style.gridColumn = "1 / -1";
                seccionAnio.innerHTML = `<h2 style="margin: 30px 0 15px 0; border-bottom: 2px solid var(--primary); padding-bottom: 5px;">${numeroAOrdinal(anio)} Año</h2>`;
                grilla.appendChild(seccionAnio);

                const materiasAnio = materiasCarrera.filter(m => m.perteneceA[carreraActiva].anio === anio)
                                     .sort((a, b) => a.perteneceA[carreraActiva].cuatri.localeCompare(b.perteneceA[carreraActiva].cuatri));

                materiasAnio.forEach(mat => grilla.appendChild(crearTarjeta(mat)));
            });
        }
    }

    function crearTarjeta(mat) {
        const card = document.createElement("div");
        card.classList.add("materia-card");
        let tags = mat.promocion === "Sí" ? `<span class="tag" style="background:#dcfce7; color:#166534;">Promocionable</span>` : "";
        if (mat.redictado === "Sí") tags += `<span class="tag" style="background:#ffedd5; color:#9a3412;">Redictado</span>`;
        
        card.innerHTML = `<h3>${mat.materia} <small>(${mat.codigo})</small></h3><div class="tags-container">${tags}</div>`;
        card.addEventListener("click", () => abrirModal(mat));
        return card;
    }

    function abrirModal(mat) {
        const armarPlan = (info) => {
            const cText = info.cuatri.toLowerCase() === 'anual' ? 'Anual' : `${numeroAOrdinal(info.cuatri)} Cuatrimestre`;
            let corr = info.corr ? info.corr.split(',').map(c => `<span class="tag" style="background:#fee2e2; color:#991b1b;">${c.trim()}</span>`).join(' ') : "Ninguna";
            return `<p><strong>${numeroAOrdinal(info.anio)} Año - ${cText}</strong></p><p style="font-size:0.9rem;">Correlativas: ${corr}</p>`;
        };

        let infoPlanHTML = "";
        if (!modoBusqueda) {
            infoPlanHTML = armarPlan(mat.perteneceA[carreraActiva]);
        } else {
            if (mat.perteneceA.astro) infoPlanHTML += `<h4>Astronomía</h4>${armarPlan(mat.perteneceA.astro)}<br>`;
            if (mat.perteneceA.geo) infoPlanHTML += `<h4>Geofísica</h4>${armarPlan(mat.perteneceA.geo)}<br>`;
            if (mat.perteneceA.meteo) infoPlanHTML += `<h4>Meteorología</h4>${armarPlan(mat.perteneceA.meteo)}<br>`;
        }

        modalInfo.innerHTML = `
            <h2 style="color:var(--primary);">${mat.materia}</h2>
            <p><strong>Código:</strong> ${mat.codigo}</p>
            <div class="tags-container">${mat.link_web ? `<a href="${mat.link_web}" target="_blank" class="tag">Web</a>` : ""} ${mat.link_drive ? `<a href="${mat.link_drive}" target="_blank" class="tag">Drive</a>` : ""}</div>
            
            <div class="caja-info-materia">
                <h3 style="margin-top:0;">Plan de Estudios</h3>
                ${infoPlanHTML}
            </div>

            ${mat.info_extra ? `<div style="background:#fff9c4; padding:10px; border-radius:6px; margin:15px 0; border:1px solid #fbc02d; color:#5f4b00;"><strong><i class="fa-solid fa-circle-info"></i> Notas:</strong> ${mat.info_extra}</div>` : ""}

            <hr style="margin:20px 0; border:0; border-top:1px solid var(--gray);">
            <h3>Horarios y Comisiones</h3>
            <div id="detalle-comision">
                ${mat.comisiones.map(c => `
                    <div class="caja-comision">
                        <strong style="color:var(--primary);">${c.comision || "Única"}</strong>
                        <p>Teoría: ${c.horario_teoria || "-"}</p>
                        <p>Práctica: ${c.horario_practica || "-"}</p>
                        <p style="font-size:0.85rem; border-top:1px dashed #ccc; padding-top:5px; margin-top:5px;">Profesor: ${c.profesor || "A confirmar"}</p>
                    </div>
                `).join("")}
            </div>
        `;
        modal.style.display = "flex";
    }

    buscador.addEventListener("input", renderizarGrilla);
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.classList.remove("activo"));
            e.target.classList.add("activo");
            carreraActiva = e.target.dataset.carrera;
            buscador.value = ""; renderizarGrilla();
        });
    });

    document.getElementById("cerrar-modal").onclick = () => { modal.style.display = "none"; };
    cargarDatos();
});
