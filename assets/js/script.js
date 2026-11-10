'use strict';



/**
 * PRELOAD
 * 
 * loading will be end after document is loaded
 */

const preloader = document.querySelector("[data-preaload]");

window.addEventListener("load", function () {
  preloader.classList.add("loaded");
  document.body.classList.add("loaded");
});



/**
 * add event listener on multiple elements
 */

const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}



/**
 * NAVBAR
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("nav-active");
}

addEventOnElements(navTogglers, "click", toggleNavbar);

// cerrar el menú móvil al pulsar un enlace
addEventOnElements(document.querySelectorAll("[data-nav-link]"), "click", function () {
  if (navbar.classList.contains("active")) toggleNavbar();
});



/**
 * RESERVATION FORM -> WhatsApp (o email si no hay WhatsApp)
 */

const reservationForm = document.querySelector("[data-reservation-form]");

if (reservationForm) {
  const dateInput = reservationForm.querySelector("input[type='date']");
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  reservationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = new FormData(reservationForm);
    const fecha = data.get("fecha") ? data.get("fecha").split("-").reverse().join("/") : "";
    const lines = [
      "Hola " + reservationForm.dataset.nombre + ", quiero reservar mesa:",
      "• Nombre: " + data.get("nombre"),
      "• Teléfono: " + data.get("telefono"),
      "• Personas: " + data.get("personas"),
      "• Fecha: " + fecha,
      "• Hora: " + data.get("hora")
    ];
    if (data.get("mensaje")) lines.push("• Comentarios: " + data.get("mensaje"));
    const text = lines.join("\n");

    const whatsapp = reservationForm.dataset.whatsapp;
    const email = reservationForm.dataset.email;

    if (whatsapp) {
      window.open("https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(text), "_blank");
    } else if (email) {
      window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent("Reserva de mesa") + "&body=" + encodeURIComponent(text);
    }

    let status = reservationForm.querySelector(".form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "form-status";
      reservationForm.appendChild(status);
    }
    status.textContent = "¡Gracias! Envía el mensaje para confirmar tu reserva.";
  });
}



/**
 * HEADER & BACK TOP BTN
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

let lastScrollPos = 0;

const hideHeader = function () {
  const isScrollBottom = lastScrollPos < window.scrollY;
  if (isScrollBottom) {
    header.classList.add("hide");
  } else {
    header.classList.remove("hide");
  }

  lastScrollPos = window.scrollY;
}

window.addEventListener("scroll", function () {
  if (window.scrollY >= 50) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
    hideHeader();
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});



/**
 * HERO SLIDER
 */

const heroSlider = document.querySelector("[data-hero-slider]");
const heroSliderItems = document.querySelectorAll("[data-hero-slider-item]");
const heroSliderPrevBtn = document.querySelector("[data-prev-btn]");
const heroSliderNextBtn = document.querySelector("[data-next-btn]");

let currentSlidePos = 0;
let lastActiveSliderItem = heroSliderItems[0];

const updateSliderPos = function () {
  lastActiveSliderItem.classList.remove("active");
  heroSliderItems[currentSlidePos].classList.add("active");
  lastActiveSliderItem = heroSliderItems[currentSlidePos];
}

const slideNext = function () {
  if (currentSlidePos >= heroSliderItems.length - 1) {
    currentSlidePos = 0;
  } else {
    currentSlidePos++;
  }

  updateSliderPos();
}

heroSliderNextBtn.addEventListener("click", slideNext);

const slidePrev = function () {
  if (currentSlidePos <= 0) {
    currentSlidePos = heroSliderItems.length - 1;
  } else {
    currentSlidePos--;
  }

  updateSliderPos();
}

heroSliderPrevBtn.addEventListener("click", slidePrev);

/**
 * auto slide
 */

let autoSlideInterval;

const autoSlide = function () {
  autoSlideInterval = setInterval(function () {
    slideNext();
  }, 7000);
}

addEventOnElements([heroSliderNextBtn, heroSliderPrevBtn], "mouseover", function () {
  clearInterval(autoSlideInterval);
});

addEventOnElements([heroSliderNextBtn, heroSliderPrevBtn], "mouseout", autoSlide);

window.addEventListener("load", autoSlide);



/**
 * PARALLAX EFFECT
 */

const parallaxItems = document.querySelectorAll("[data-parallax-item]");

let x, y;

window.addEventListener("mousemove", function (event) {

  x = (event.clientX / window.innerWidth * 10) - 5;
  y = (event.clientY / window.innerHeight * 10) - 5;

  // reverse the number eg. 20 -> -20, -5 -> 5
  x = x - (x * 2);
  y = y - (y * 2);

  for (let i = 0, len = parallaxItems.length; i < len; i++) {
    x = x * Number(parallaxItems[i].dataset.parallaxSpeed);
    y = y * Number(parallaxItems[i].dataset.parallaxSpeed);
    parallaxItems[i].style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  }

});