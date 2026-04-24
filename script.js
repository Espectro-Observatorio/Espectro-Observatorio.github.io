document.addEventListener("DOMContentLoaded", () => {
    // --- LÓGICA DEL MODO OSCURO ---
    const btnTema = document.getElementById("btn-tema");
    if (!btnTema) return; // Seguridad por si la página no tiene el botón

    const iconoTema = btnTema.querySelector("i");
    const body = document.body;

    // Sincronizamos el ícono con el estado actual del body
    if (body.classList.contains("modo-oscuro")) {
        iconoTema.classList.replace("fa-moon", "fa-sun");
    }

    btnTema.addEventListener("click", () => {
        const esOscuro = body.classList.toggle("modo-oscuro");
        
        if (esOscuro) {
            iconoTema.classList.replace("fa-moon", "fa-sun");
            localStorage.setItem("tema", "oscuro");
        } else {
            iconoTema.classList.replace("fa-sun", "fa-moon");
            localStorage.setItem("tema", "claro");
        }
    });


    // 1. Menú Hamburguesa
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    navToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        // Cambia el icono de barras a una X
        const icon = navToggle.querySelector("i");
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-xmark");
    });

    // 2. Animación al scrollear
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.1 });


    // Lógica del botón desplegable "Proyectos"
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const dropdownContent = document.querySelector(".dropdown-content");

    dropdownBtn.addEventListener("click", (e) => {
        e.preventDefault(); // Evita que la página salte al inicio al hacer clic en "#"
        dropdownContent.classList.toggle("show");
    });

    // Cerrar el menú si se hace clic afuera (súper útil para la PC)
    window.addEventListener("click", (e) => {
        if (!e.target.matches('.dropdown-btn') && !e.target.closest('.dropdown')) {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        }
    });

    document.querySelectorAll(".animate-on-scroll").forEach(el => observer.observe(el));
});
