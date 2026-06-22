/* =========================================================
   APEX SIM RACING HUB — script.js
   Vanilla JS. Interacciones:
   1) Menú hamburguesa (mobile nav)
   2) Carril horizontal de "Elegí cómo entrar" (scroll vertical → horizontal)
   3) Carrusel de testimonios con autoplay + barras de progreso
   4) Validación básica del form de newsletter
   5) Video con hover en la sección "La diferencia"
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------
     1) MENÚ HAMBURGUESA
  ----------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primary-nav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Abrir menú de navegación' : 'Cerrar menú de navegación');
      primaryNav.classList.toggle('is-open', !isOpen);
    });

    // Cerrar el menú al elegir un link (mejora UX en mobile)
    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        primaryNav.classList.remove('is-open');
      });
    });
  }

/* -----------------------------------------------------
   2) CARRIL HORIZONTAL — "Elegí cómo entrar. El objetivo es el mismo"
   Mientras el mouse está sobre el carril y no se llegó al
   principio/final, el scroll vertical (wheel) mueve las cards
   en horizontal. Al llegar a un extremo, se libera el scroll
   normal de la página. Los dots reflejan y permiten saltar
   a la card activa. El touch ya desliza horizontal de forma nativa.
----------------------------------------------------- */
const formatScroll = document.getElementById('formatScroll');
const formatDots = formatScroll ? Array.from(document.querySelectorAll('.format-dot')) : [];

if (formatScroll) {
  const panels = Array.from(formatScroll.querySelectorAll('.format-panel'));
  let snapTimer = null;

  const goToIndex = (index) => {
    if (!panels[index]) return;

    formatScroll.scrollTo({
      left: panels[index].offsetLeft,
      behavior: 'smooth'
    });
  };

  const getClosestIndex = () => {
    let closest = 0;
    let minDistance = Infinity;

    panels.forEach((panel, i) => {
      const distance = Math.abs(panel.offsetLeft - formatScroll.scrollLeft);

      if (distance < minDistance) {
        minDistance = distance;
        closest = i;
      }
    });

    return closest;
  };

  const syncDots = () => {
    const index = getClosestIndex();

    formatDots.forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  };

  // Snap manual al panel más cercano
  const scheduleSnap = () => {
    clearTimeout(snapTimer);

    snapTimer = setTimeout(() => {
      goToIndex(getClosestIndex());
    }, 120);
  };

  formatScroll.addEventListener(
    'wheel',
    (event) => {
      const maxScroll = formatScroll.scrollWidth - formatScroll.clientWidth;
      const goingForward = event.deltaY > 0;
      const atStart = formatScroll.scrollLeft <= 0;
      const atEnd = formatScroll.scrollLeft >= maxScroll - 1;

      // En los extremos dejamos que la página haga scroll vertical
      if ((goingForward && atEnd) || (!goingForward && atStart)) return;

      event.preventDefault();
      formatScroll.scrollLeft += event.deltaY;
      scheduleSnap();
    },
    { passive: false }
  );

  formatScroll.addEventListener('scroll', syncDots, { passive: true });

  formatDots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToIndex(index));
  });

  syncDots();
}


  /* -----------------------------------------------------
     3) CARRUSEL DE TESTIMONIOS
     3 slides — autoplay cada 6s, barras de progreso que se
     llenan, pausa al pasar el mouse/foco, navegación con dots.
  ----------------------------------------------------- */
  const carousel = document.getElementById('testimonialCarousel');

  if (carousel) {
    const testimonials = Array.from(carousel.querySelectorAll('.testimonial'));
    const progressBars = Array.from(carousel.querySelectorAll('.progress-bar'));
    const AUTOPLAY_MS = 6000;
    let current = 1; // el slide "main" del boceto arranca activo (índice 1)
    let autoplayTimer = null;

    function goTo(index) {
      current = index;

      testimonials.forEach((slide) => {
        const slideIndex = Number(slide.dataset.slide);
        slide.classList.toggle('testimonial-main', slideIndex === current);
        slide.classList.toggle('testimonial-side', slideIndex !== current);
      });

      progressBars.forEach((bar, i) => {
        const isActive = i === current;
        bar.setAttribute('aria-selected', String(isActive));
        bar.classList.remove('is-filling');
        if (isActive) {
          // Forzar reflow para reiniciar la animación de la barra
          // eslint-disable-next-line no-unused-expressions
          bar.offsetWidth;
          bar.classList.add('is-filling');
        }
      });
    }

    function next() {
      goTo((current + 1) % testimonials.length);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(next, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
    }

    progressBars.forEach((bar) => {
      bar.addEventListener('click', () => {
        const target = Number(bar.dataset.go);
        goTo(target);
        startAutoplay();
      });
    });

    // Permitir click directo sobre un testimonio lateral para activarlo
    testimonials.forEach((slide) => {
      slide.addEventListener('click', () => {
        if (!slide.classList.contains('testimonial-main')) {
          goTo(Number(slide.dataset.slide));
          startAutoplay();
        }
      });
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    goTo(current);
    startAutoplay();
  }

  /* -----------------------------------------------------
     4) FORM DE NEWSLETTER — validación básica en cliente
  ----------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterFeedback = document.getElementById('newsletterFeedback');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValid) {
        newsletterFeedback.textContent = 'Ingresá un email válido para suscribirte.';
        newsletterFeedback.classList.remove('is-success');
        newsletterFeedback.classList.add('is-error');
        emailInput.focus();
        return;
      }

      // Acá Sol debería conectar el envío real (Mailchimp, backend propio, etc.)
      newsletterFeedback.textContent = `Listo. Te vamos a escribir a ${email}.`;
      newsletterFeedback.classList.remove('is-error');
      newsletterFeedback.classList.add('is-success');
      newsletterForm.reset();
    });
  }

  /* -----------------------------------------------------
     5) VIDEO CON HOVER — sección "La diferencia"
     Arranca en pausa mostrando el poster (foto estática).
     Reproduce con hover/foco (desktop, teclado) y con click/tap
     como fallback en touch, donde no existe :hover real.
  ----------------------------------------------------- */
  const diffMedia = document.querySelector('.diff-media');
  const diffVideo = diffMedia ? diffMedia.querySelector('.diff-video') : null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (diffMedia && diffVideo) {
    const playVideo = () => {
      diffMedia.classList.add('is-playing');
      diffVideo.play().catch(() => {
        // Autoplay bloqueado por el navegador: no pasa nada,
        // el poster sigue visible y el usuario puede tocar para intentar de nuevo.
        diffMedia.classList.remove('is-playing');
      });
    };

    const stopVideo = () => {
      diffMedia.classList.remove('is-playing');
      diffVideo.pause();
      diffVideo.currentTime = 0;
    };

    if (!prefersReducedMotion) {
      diffMedia.addEventListener('mouseenter', playVideo);
      diffMedia.addEventListener('mouseleave', stopVideo);
      diffMedia.addEventListener('focusin', playVideo);
      diffMedia.addEventListener('focusout', stopVideo);
    }

    // Fallback táctil: tocar alterna play/pausa (no hay :hover en mobile)
    diffMedia.addEventListener('click', () => {
      if (diffVideo.paused) {
        playVideo();
      } else {
        stopVideo();
      }
    });
  }

});