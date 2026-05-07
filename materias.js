// ACÁ YA ESTÁ TU LINK REAL FUNCIONANDO
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

    // 1. CARGAR DATOS DESDE GOOGLE SHEETS
    function cargarDatos() {
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
                grilla.innerHTML = "<p class='materias-feedback materias-feedback-error'>Error al cargar la base de datos.</p>";
            }
        });
    }

    // 2. AGRUPAR COMISIONES
    function procesarDatos(datos) {
        materiasAgrupadas = {};
        datos.forEach(fila => {
            if (!fila.codigo || fila.codigo.trim() === "") return;

            const parseValorConAclaracion = (raw) => {
                const texto = (raw || "").toString().trim();
                if (!texto) return null;
                const idx = texto.indexOf(",");
                if (idx === -1) return { valor: texto, aclaracion: "" };
                return {
                    valor: texto.slice(0, idx).trim(),
                    aclaracion: texto.slice(idx + 1).trim()
                };
            };

            const agregarItemUnico = (lista, item) => {
                if (!item || !item.valor) return;
                const key = `${item.valor}||${item.aclaracion || ""}`;
                if (!lista.some(x => `${x.valor}||${x.aclaracion || ""}` === key)) {
                    lista.push(item);
                }
            };

            if (!materiasAgrupadas[fila.codigo]) {
                materiasAgrupadas[fila.codigo] = {
                    codigo: fila.codigo, materia: fila.materia,
                    link_web: fila.link_web, link_drive: fila.link_drive, link_programa: fila.link_programa,
                    mail_materia: fila.mail_materia,
                    links_web: [],
                    links_drive: [],
                    links_programa: [],
                    mails_materia: [],
                    promocion: fila.promocion, redictado: fila.redictado,
                    prae: fila.prae, curso_verano: fila.curso_verano,
                    info_extra: fila.info_extra,
                    perteneceA: {
                        astro: fila.anio_astro ? { anio: fila.anio_astro, cuatri: fila.cuatri_astro, corr: fila.corr_astro } : null,
                        geo: fila.anio_geo ? { anio: fila.anio_geo, cuatri: fila.cuatri_geo, corr: fila.corr_geo } : null,
                        meteo: fila.anio_meteo ? { anio: fila.anio_meteo, cuatri: fila.cuatri_meteo, corr: fila.corr_meteo } : null
                    },
                    comisiones: []
                };
            }

            // Agregar links/mails potencialmente repetidos por fila (con o sin aclaración)
            const mat = materiasAgrupadas[fila.codigo];
            agregarItemUnico(mat.links_web, parseValorConAclaracion(fila.link_web));
            agregarItemUnico(mat.links_drive, parseValorConAclaracion(fila.link_drive));
            agregarItemUnico(mat.links_programa, parseValorConAclaracion(fila.link_programa));
            agregarItemUnico(mat.mails_materia, parseValorConAclaracion(fila.mail_materia));

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

        if (tabsContainer) {
            tabsContainer.style.display = modoBusqueda ? "none" : "flex";
        }

        const normalizar = (valor) => (valor || "")
            .toString()
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const crearCard = (mat) => {
            const card = document.createElement("div");
            card.classList.add("materia-card");
            const tagsHTML = construirTagsMateria(mat);
            card.innerHTML = `<h3>${mat.materia} <span class="materia-codigo">(${mat.codigo})</span></h3><div class="tags-container">${tagsHTML}</div>`;
            card.addEventListener("click", () => abrirModal(mat));
            return card;
        };

        if (modoBusqueda) {
            const materiasFiltradas = Object.values(materiasAgrupadas).filter(mat =>
                mat.materia.toLowerCase().includes(textoBusqueda) || mat.codigo.toLowerCase().includes(textoBusqueda)
            );

            materiasFiltradas.forEach(mat => grilla.appendChild(crearCard(mat)));

            if (materiasFiltradas.length === 0) {
                grilla.innerHTML = `<p class="materias-feedback">No se encontraron materias.</p>`;
            }
            return;
        }

        const ORDEN_ANIOS = [
            { key: "1", label: "Primer año" },
            { key: "2", label: "Segundo año" },
            { key: "3", label: "Tercer año" },
            { key: "4", label: "Cuarto año" },
            { key: "5", label: "Quinto año" },
            { key: "optativas", label: "Optativas" },
            { key: "seminarios", label: "Seminarios" }
        ];
        const ORDEN_CUATRIS = [
            { key: "anual", label: "Anual" },
            { key: "1", label: "Primer cuatrimestre" },
            { key: "2", label: "Segundo cuatrimestre" },
            { key: "0", label: "Cualquier cuatrimestre" }
        ];

        const claveAnio = (anioRaw) => {
            const anio = normalizar(anioRaw);
            const num = parseInt(anio, 10);
            if (!isNaN(num) && num >= 1 && num <= 5) return String(num);
            if (anio.includes("optativa")) return "optativas";
            if (anio.includes("seminario")) return "seminarios";
            return null;
        };

        const claveCuatri = (cuatriRaw) => {
            const cuatri = normalizar(cuatriRaw);
            const num = parseInt(cuatri, 10);
            if (cuatri.includes("anual")) return "anual";
            if ((!isNaN(num) && num === 1) || cuatri.includes("primer")) return "1";
            if ((!isNaN(num) && num === 2) || cuatri.includes("segundo")) return "2";
            if ((!isNaN(num) && num === 0) || cuatri.includes("cualquier")) return "0";
            return null;
        };

        const materiasCarrera = Object.values(materiasAgrupadas).filter(mat => mat.perteneceA[carreraActiva]);
        const agrupadas = {};

        ORDEN_ANIOS.forEach(anio => {
            agrupadas[anio.key] = {};
            ORDEN_CUATRIS.forEach(cuatri => {
                agrupadas[anio.key][cuatri.key] = [];
            });
        });

        materiasCarrera.forEach(mat => {
            const info = mat.perteneceA[carreraActiva];
            const anioKey = claveAnio(info?.anio);
            const cuatriKey = claveCuatri(info?.cuatri);
            if (anioKey && cuatriKey && agrupadas[anioKey] && agrupadas[anioKey][cuatriKey]) {
                agrupadas[anioKey][cuatriKey].push(mat);
            }
        });

        ORDEN_ANIOS.forEach(anio => {
            const tieneMateriasEnElAnio = ORDEN_CUATRIS.some(cuatri => agrupadas[anio.key][cuatri.key].length > 0);
            if (!tieneMateriasEnElAnio) return;

            const tituloAnio = document.createElement("div");
            tituloAnio.className = "materias-bloque-anio";
            tituloAnio.innerHTML = `<h2>${anio.label}</h2>`;
            grilla.appendChild(tituloAnio);

            ORDEN_CUATRIS.forEach(cuatri => {
                const materiasBloque = agrupadas[anio.key][cuatri.key]
                    .sort((a, b) => a.materia.localeCompare(b.materia, "es", { sensitivity: "base" }));

                if (materiasBloque.length === 0) return;

                const subtituloCuatri = document.createElement("div");
                subtituloCuatri.className = "materias-bloque-cuatri";
                subtituloCuatri.innerHTML = `<h3>${cuatri.label}</h3>`;
                grilla.appendChild(subtituloCuatri);
                materiasBloque.forEach(mat => grilla.appendChild(crearCard(mat)));
            });
        });
    }

    // --- FUNCIÓN HELPER: De "1" a "Primer" ---
    function numeroAOrdinal(numStr) {
        if (!numStr) return "";
        const num = parseInt(numStr.trim());
        if (isNaN(num)) return numStr; 
        const ordinales = ["", "Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto"];
        return ordinales[num] || numStr;
    }

    function normalizarCodigo(codigo) {
        return (codigo || "").toString().trim().toUpperCase();
    }

    function buscarMateriaPorCodigo(codigo) {
        const codigoNormalizado = normalizarCodigo(codigo);
        if (!codigoNormalizado) return null;

        const mat = Object.values(materiasAgrupadas).find(
            m => normalizarCodigo(m.codigo) === codigoNormalizado
        );
        if (!mat) return null;

        // Si no estamos en modo búsqueda, respetamos la carrera activa.
        if (!modoBusqueda && !mat.perteneceA[carreraActiva]) return null;
        return mat;
    }

    function construirTagsMateria(mat) {
        let tagsHTML = "";
        if (mat.promocion === "Sí") tagsHTML += `<span class="tag tag-promocion">Promocionable</span>`;
        if (mat.redictado === "Sí") tagsHTML += `<span class="tag tag-redictado">Con redictado</span>`;
        if (mat.prae === "Sí") tagsHTML += `<span class="tag tag-prae">Con PRAE</span>`;
        if (mat.curso_verano === "Sí") tagsHTML += `<span class="tag tag-verano">Con curso de verano</span>`;
        return tagsHTML;
    }

    function mostrarAvisoCopia(texto) {
        const aviso = document.createElement("div");
        aviso.className = "materias-toast-copia";
        aviso.textContent = texto;
        document.body.appendChild(aviso);

        requestAnimationFrame(() => aviso.classList.add("visible"));
        setTimeout(() => {
            aviso.classList.remove("visible");
            setTimeout(() => aviso.remove(), 220);
        }, 1200);
    }

    // 4. ABRIR EL MODAL 
    function abrirModal(mat) {
        // --- 1. Tags ---
        const tagsHTML = construirTagsMateria(mat);

        // --- 2. Plan de Estudios Inteligente (SIN SELECTOR) ---
        const armarInfoPlan = (info) => {
            const anioRaw = info.anio ? info.anio.trim() : "";
            const anioNormalizado = anioRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let anioText = numeroAOrdinal(anioRaw) + " año";
            if (anioNormalizado.includes("optativa")) anioText = "Optativa";
            if (anioNormalizado.includes("seminario")) anioText = "Seminario";

            const cuatriVal = info.cuatri ? info.cuatri.trim().toLowerCase() : "";
            let cuatriText = cuatriVal === 'anual' ? 'Anual' : numeroAOrdinal(info.cuatri) + " cuatrimestre";
            if (cuatriVal === "0") cuatriText = "Cualquier cuatrimestre";
            
            let corrHTML = "<span class='materias-texto-suave'>Ninguna</span>";
            if (info.corr) {
                corrHTML = info.corr
                    .split(',')
                    .map(codigo => codigo.trim())
                    .filter(Boolean)
                    .map(codigo => `<button type="button" class="btn-correlativa" data-codigo="${codigo}">${codigo}</button>`)
                    .join(' ');
            }
            
            return `<p class="materias-plan-titulo"><strong>${anioText} - ${cuatriText}</strong></p>
                    <p class="materias-plan-correlativas"><strong>Correlativas requeridas:</strong> ${corrHTML}</p>`;
        };

        let planesHTML = "";
        if (!modoBusqueda) {
            // Si viene de una pestaña, muestra solo el plan de esa carrera
            planesHTML = armarInfoPlan(mat.perteneceA[carreraActiva]);
        } else {
            // Si viene del buscador, lista automáticamente todas las carreras a las que pertenece (sin selector)
            let listas = [];
            if (mat.perteneceA.astro) listas.push(`<div><h4 class="materias-carrera-titulo">Astronomía</h4>${armarInfoPlan(mat.perteneceA.astro)}</div>`);
            if (mat.perteneceA.geo) listas.push(`<div><h4 class="materias-carrera-titulo">Geofísica</h4>${armarInfoPlan(mat.perteneceA.geo)}</div>`);
            if (mat.perteneceA.meteo) listas.push(`<div><h4 class="materias-carrera-titulo">Meteorología</h4>${armarInfoPlan(mat.perteneceA.meteo)}</div>`);
            planesHTML = listas.join('<hr class="materias-separador-dashed">');
        }

        // --- 3. Selector de Comisiones ---
        let selectorComisionesHTML = "";
        if (mat.comisiones.length > 1) {
            selectorComisionesHTML = `
                <div class="materias-selector-comision">
                    <label class="materias-selector-label"><i class="fa-solid fa-list"></i> Comisión:</label>
                    <select id="select-comision-modal" class="materias-selector-select">
                        ${mat.comisiones.map((c, i) => `<option value="${i}">${c.nombre || `Comisión ${i+1}`}</option>`).join("")}
                    </select>
                </div>
            `;
        }

        // --- 4. Armado del Modal ---
        modalInfo.innerHTML = `
            <h2 class="materias-modal-titulo">${mat.materia}</h2>
            <div class="materias-modal-cabecera">
                <p class="materias-modal-codigo">Código: ${mat.codigo}</p>
                <div class="tags-container materias-tags-inline">${tagsHTML}</div>
            </div>
            
            <div class="materias-links">
                ${(mat.links_web?.length ? mat.links_web : (mat.link_web ? [{ valor: mat.link_web, aclaracion: "" }] : []))
                    .map(l => `<a href="${l.valor}" target="_blank" class="tag tag-link-web"><i class="fa-solid fa-globe"></i> Página Web${l.aclaracion ? ` (${l.aclaracion})` : ""}</a>`)
                    .join("")}
                ${(mat.links_drive?.length ? mat.links_drive : (mat.link_drive ? [{ valor: mat.link_drive, aclaracion: "" }] : []))
                    .map(l => `<a href="${l.valor}" target="_blank" class="tag tag-link-drive"><i class="fa-brands fa-google-drive"></i> Apuntes${l.aclaracion ? ` (${l.aclaracion})` : ""}</a>`)
                    .join("")}
                ${(mat.links_programa?.length ? mat.links_programa : (mat.link_programa ? [{ valor: mat.link_programa, aclaracion: "" }] : []))
                    .map(l => `<a href="${l.valor}" target="_blank" class="tag tag-link-programa"><i class="fa-solid fa-file-pdf"></i> Programa${l.aclaracion ? ` (${l.aclaracion})` : ""}</a>`)
                    .join("")}
                ${(mat.mails_materia?.length ? mat.mails_materia : (mat.mail_materia ? [{ valor: mat.mail_materia, aclaracion: "" }] : []))
                    .map(m => `<button type="button" class="tag tag-mail-materia btn-copiar-mail-materia" data-mail="${m.valor}" title="${m.valor}"><i class="fa-solid fa-envelope"></i> Correo${m.aclaracion ? ` (${m.aclaracion})` : ""}</button>`)
                    .join("")}
            </div>

            ${mat.info_extra ? `<div class="materias-info-extra"><strong><i class="fa-solid fa-circle-info"></i></strong> ${mat.info_extra}</div>` : ""}
            
            <div class="caja-info-materia">
                <h3 class="materias-seccion-titulo">Plan de estudios</h3>
                ${planesHTML}
            </div>
            
            <hr class="materias-separador">
            <h3 class="materias-seccion-titulo materias-seccion-horarios">Horarios, aulas y docentes</h3>
            
            ${selectorComisionesHTML}
            <div id="contenedor-detalle-comision"></div>
        `;

        // 🟢 FIX MODAL: Forzamos el display: flex ignorando tu CSS global
        modal.style.display = "flex";

        // --- 5. Función para pintar la comisión elegida ---
        const renderComision = (index) => {
            const c = mat.comisiones[index];
            document.getElementById("contenedor-detalle-comision").innerHTML = `
                <div class="caja-comision">
                    <strong class="materias-comision-titulo">
                        <i class="fa-solid fa-users"></i> ${c.nombre || "Comisión única"}
                    </strong>
                    
                    <div class="materias-comision-detalle">
                        ${c.teoria ? `<div class="materias-comision-linea"><strong>Teoría:</strong> ${c.teoria}</div>` : ""}
                        ${c.practica ? `<div class="materias-comision-linea"><strong>Práctica:</strong> ${c.practica}</div>` : ""}
                        ${c.otros ? `<div class="materias-comision-linea"><strong>Otros:</strong> ${c.otros}</div>` : ""}
                    </div>
                    
                    <div class="materias-comision-docentes">
                        <div class="materias-comision-linea">
                            <strong>👨‍🏫 Titular:</strong> ${c.profesor || "A definir"} 
                            ${c.mail_profe ? `<span class="materias-contacto"> | ✉️ ${c.mail_profe}</span>` : ""} 
                            ${c.celular_profe ? `<span class="materias-contacto"> | 📱 ${c.celular_profe}</span>` : ""}
                        </div>
                        ${c.jtp ? `
                        <div>
                            <strong>🧑‍🏫 JTP:</strong> ${c.jtp}
                            ${c.mail_jtp ? `<span class="materias-contacto"> | ✉️ ${c.mail_jtp}</span>` : ""} 
                            ${c.celular_jtp ? `<span class="materias-contacto"> | 📱 ${c.celular_jtp}</span>` : ""}
                        </div>` : ""}
                    </div>
                </div>
            `;
        };

        renderComision(0);

        if (mat.comisiones.length > 1) {
            document.getElementById("select-comision-modal").addEventListener("change", (e) => renderComision(e.target.value));
        }

        modalInfo.querySelectorAll(".btn-correlativa").forEach(btn => {
            btn.addEventListener("click", () => {
                const materiaDestino = buscarMateriaPorCodigo(btn.dataset.codigo);
                if (materiaDestino) {
                    abrirModal(materiaDestino);
                }
            });
        });

        modalInfo.querySelectorAll(".btn-copiar-mail-materia").forEach(btn => {
            btn.addEventListener("click", async () => {
                const mail = btn.dataset.mail;
                if (!mail) return;

                try {
                    await navigator.clipboard.writeText(mail);
                    mostrarAvisoCopia("Correo copiado");
                } catch (error) {
                    const inputAux = document.createElement("input");
                    inputAux.value = mail;
                    document.body.appendChild(inputAux);
                    inputAux.select();
                    document.execCommand("copy");
                    inputAux.remove();
                    mostrarAvisoCopia("Correo copiado");
                }
            });
        });
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

    // 🟢 FIX MODAL: Lo ocultamos forzando display: none
    const cerrarElModal = () => { modal.style.display = "none"; };
    
    document.getElementById("cerrar-modal").addEventListener("click", cerrarElModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) cerrarElModal(); });

    // Iniciar carga
    cargarDatos();
});
