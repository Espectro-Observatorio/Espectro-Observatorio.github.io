document.addEventListener("DOMContentLoaded", () => {
    // 1. BASE DE DATOS (El JSON que generarás desde Excel)
    // Fechas en formato AAAA-MM-DD
    const bdExamenes = [
        {
            facultad: "FCE",
            turno: "Turno Mayo",
            inicio_inscripcion: "2026-05-01", fin_inscripcion: "2026-05-03",
            inicio_mesa: "2026-05-21", fin_mesa: "2026-05-25"
        },
        {
            facultad: "FCAG",
            turno: "Turno Mayo/Junio",
            inicio_inscripcion: "2026-05-20", fin_inscripcion: "2026-05-24",
            inicio_mesa: "2026-06-01", fin_mesa: "2026-06-12"
        },
        {
            facultad: "FCNyM",
            turno: "Turno Mayo",
            inicio_inscripcion: "2026-04-20", fin_inscripcion: "2026-04-25",
            // Simulamos que la mesa empieza HOY (Mayo 2026) para que lo veas marcado
            inicio_mesa: "2026-05-06", fin_mesa: "2026-05-10" 
        }
    ];

    // 2. VARIABLES DE TIEMPO AUTOMÁTICAS
    const fechaActual = new Date(); // La compu detecta el día real (ej: 6 de Mayo 2026)
    
    // Variables para la navegación (Empiezan en el mes actual)
    let mesViendo = fechaActual.getMonth(); 
    let anioViendo = fechaActual.getFullYear();

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // 3. ELEMENTOS DEL DOM
    const tituloMes = document.getElementById("mes-actual-titulo");
    const grillaDias = document.getElementById("grilla-dias");
    const checkboxes = document.querySelectorAll(".filtro-cb");

    // 4. FUNCIÓN PRINCIPAL: DIBUJAR EL MES (VERSIÓN 42 CELDAS)
    function renderizarCalendario() {
        grillaDias.innerHTML = "";
        tituloMes.textContent = `${nombresMeses[mesViendo]} ${anioViendo}`;

        const primerDiaDelMes = new Date(anioViendo, mesViendo, 1).getDay(); 
        const diasEnElMes = new Date(anioViendo, mesViendo + 1, 0).getDate(); 
        const diasMesAnterior = new Date(anioViendo, mesViendo, 0).getDate(); 

        const facultadesActivas = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

        // Armamos SIEMPRE 42 celdas (6 semanas x 7 días) para que la grilla sea perfecta
        for (let i = 0; i < 42; i++) {
            let diaCelda, mesCelda, anioCelda;
            let esOtroMes = false;

            // Determinar a qué fecha corresponde esta celda
            if (i < primerDiaDelMes) {
                // Pertenece al final del MES ANTERIOR
                diaCelda = diasMesAnterior - (primerDiaDelMes - 1 - i);
                mesCelda = mesViendo - 1;
                anioCelda = anioViendo;
                esOtroMes = true;
            } else if (i >= primerDiaDelMes && i < primerDiaDelMes + diasEnElMes) {
                // Pertenece al MES ACTUAL
                diaCelda = i - primerDiaDelMes + 1;
                mesCelda = mesViendo;
                anioCelda = anioViendo;
            } else {
                // Pertenece al principio del PRÓXIMO MES
                diaCelda = i - (primerDiaDelMes + diasEnElMes) + 1;
                mesCelda = mesViendo + 1;
                anioCelda = anioViendo;
                esOtroMes = true;
            }

            // Corrección matemática si cambiamos de año
            if (mesCelda < 0) { mesCelda = 11; anioCelda--; }
            if (mesCelda > 11) { mesCelda = 0; anioCelda++; }

            const celda = document.createElement("div");
            celda.classList.add("dia-celda");
            
            // Le ponemos clases de diseño
            if (esOtroMes) celda.classList.add("dia-otro-mes");

            // ¿Es hoy en la vida real?
            if (diaCelda === fechaActual.getDate() && mesCelda === fechaActual.getMonth() && anioCelda === fechaActual.getFullYear()) {
                celda.classList.add("dia-hoy");
            }

            // ¿Es un día que ya pasó?
            const fechaDeEstaCelda = new Date(anioCelda, mesCelda, diaCelda);
            fechaDeEstaCelda.setHours(0,0,0,0);
            const hoySinHora = new Date(fechaActual); hoySinHora.setHours(0,0,0,0);
            
            // EL CAMBIO ESTÁ ACÁ: Le agregamos el "!esOtroMes &&"
            if (!esOtroMes && fechaDeEstaCelda < hoySinHora) {
                celda.classList.add("dia-pasado");
            }
            
            celda.innerHTML = `<span class="numero-dia">${diaCelda}</span>`;

            // --- LÓGICA DE EVENTOS ---
            const stringFecha = `${anioCelda}-${String(mesCelda + 1).padStart(2, '0')}-${String(diaCelda).padStart(2, '0')}`;
            let htmlIndicadores = `<div class="indicadores-container">`;
            
            // Agregamos el botón de cerrar en el tooltip
            let htmlTooltip = `<div class="dia-tooltip">
                <button class="btn-cerrar-tt" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
                <strong>${diaCelda} de ${nombresMeses[mesCelda]}</strong>`;
            
            let hayEventos = false;

            bdExamenes.forEach(evento => {
                if (facultadesActivas.includes(evento.facultad)) {
                    const claseFacu = evento.facultad.toLowerCase(); 

                    if (stringFecha >= evento.inicio_inscripcion && stringFecha <= evento.fin_inscripcion) {
                        htmlIndicadores += `<div class="indicador ${claseFacu}-inscripcion"></div>`;
                        htmlTooltip += `<div class="tooltip-item"><span class="indicador ${claseFacu}-inscripcion"></span> Inscripción: ${evento.turno} (${evento.facultad})</div>`;
                        hayEventos = true;
                    }

                    if (stringFecha >= evento.inicio_mesa && stringFecha <= evento.fin_mesa) {
                        htmlIndicadores += `<div class="indicador ${claseFacu}-mesa"></div>`;
                        htmlTooltip += `<div class="tooltip-item"><span class="indicador ${claseFacu}-mesa"></span> Mesa: ${evento.turno} (${evento.facultad})</div>`;
                        hayEventos = true;
                    }
                }
            });

            // Si NO hay eventos, le ponemos el texto vacío al cartelito
            if (!hayEventos) {
                htmlTooltip += `<div class="tooltip-item" style="color: #ccc; font-style: italic;">Sin eventos</div>`;
            }

            htmlIndicadores += `</div>`;
            htmlTooltip += `</div>`;

            // Ahora SIEMPRE inyectamos el tooltip (tenga o no eventos)
            celda.innerHTML += htmlIndicadores + htmlTooltip;
            grillaDias.appendChild(celda);
        }
    }

    // 5. EVENTOS DE LOS BOTONES Y FILTROS
    document.getElementById("btn-mes-ant").addEventListener("click", () => {
        mesViendo--;
        if (mesViendo < 0) { mesViendo = 11; anioViendo--; }
        renderizarCalendario();
    });

    document.getElementById("btn-mes-sig").addEventListener("click", () => {
        mesViendo++;
        if (mesViendo > 11) { mesViendo = 0; anioViendo++; }
        renderizarCalendario();
    });

    checkboxes.forEach(cb => {
        cb.addEventListener("change", renderizarCalendario); // Re-dibujar si marcan/desmarcan
    });

    // 6. FUNCIONALIDAD DEL TOOLTIP (Inteligencia Espacial y Clics)
    
    const calendarioMes = document.querySelector(".calendario-mes");

    // Función que calcula los bordes (La sacamos afuera para reusarla)
    function posicionarTooltip(celda, tooltip) {
        tooltip.classList.remove("pos-abajo", "pos-derecha", "pos-izquierda");
        
        const rectCelda = celda.getBoundingClientRect();
        const rectTooltip = tooltip.getBoundingClientRect();

        if (rectCelda.top - rectTooltip.height < 50) {
            tooltip.classList.add("pos-abajo");
        }
        if (rectCelda.left + (rectTooltip.width / 2) > window.innerWidth - 20) {
            tooltip.classList.add("pos-derecha");
        } else if (rectCelda.left - (rectTooltip.width / 2) < 20) {
            tooltip.classList.add("pos-izquierda");
        }
    }

    // A. Hover en PC (Solo calcula la posición si no hay uno fijo)
    grillaDias.addEventListener("mouseover", (e) => {
        if (calendarioMes.classList.contains("tooltip-fijo")) return; // ¡Frenamos el caos!

        const celda = e.target.closest(".dia-celda");
        if (!celda) return;
        
        const tooltip = celda.querySelector(".dia-tooltip");
        if (!tooltip) return;

        posicionarTooltip(celda, tooltip);
    });

    // B. Manejo de Clics (Abre, cierra y bloquea)
    document.addEventListener("click", (e) => {
        
        // 1. Clic en la "X" (Cerramos y liberamos el calendario)
        if (e.target.closest(".btn-cerrar-tt")) {
            const tooltip = e.target.closest(".dia-tooltip");
            tooltip.classList.remove("visible");
            calendarioMes.classList.remove("tooltip-fijo"); // Liberamos
            return;
        }

        // 2. Clic en la celda
        const celda = e.target.closest(".dia-celda");
        if (celda) {
            const tooltip = celda.querySelector(".dia-tooltip");
            
            // Si la celda tiene tooltip y NO estaba ya abierto
            if (tooltip && !tooltip.classList.contains("visible")) {
                
                // Cerramos cualquier otro que estuviera abierto
                document.querySelectorAll(".dia-tooltip.visible").forEach(tt => tt.classList.remove("visible"));
                
                // Calculamos posición (Clave para celulares donde no hubo hover antes)
                posicionarTooltip(celda, tooltip);
                
                // Lo clavamos visible y bloqueamos el resto del calendario
                tooltip.classList.add("visible");
                calendarioMes.classList.add("tooltip-fijo"); 
            }
        } else {
            // 3. Clic afuera de todo (Cerramos y liberamos)
            document.querySelectorAll(".dia-tooltip.visible").forEach(tt => tt.classList.remove("visible"));
            calendarioMes.classList.remove("tooltip-fijo");
        }
    });

    // ¡Arrancamos! Dibujar el mes actual al cargar la página
    renderizarCalendario();
});
