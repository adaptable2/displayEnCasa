document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById("bg-site");

    const gradients = [
      "radial-gradient(circle at 50% 50%, #2a2f3b 0%, transparent 55%), radial-gradient(circle at 20% 80%, #7a2c87 0%, transparent 65%), radial-gradient(circle at 80% 20%, #f94a19 0%, transparent 70%)",
      "radial-gradient(circle at 50% 70%, #3d3d3d 0%, transparent 55%), radial-gradient(circle at 20% 40%, #1f4068 0%, transparent 65%), radial-gradient(circle at 80% 60%, #f97450 0%, transparent 70%)",
      "radial-gradient(circle at 30% 80%, #7a7a7a 0%, transparent 50%), radial-gradient(circle at 70% 30%, #2a2f3b 0%, transparent 60%), radial-gradient(circle at 50% 50%, #f94a19 0%, transparent 65%)",
      "radial-gradient(circle at 40% 60%, #f94a19 0%, transparent 60%), radial-gradient(circle at 70% 40%, #5c7398 0%, transparent 65%), radial-gradient(circle at 20% 80%, #1a1a1a 0%, transparent 70%)",
      "radial-gradient(circle at 60% 20%, #5c7398 0%, transparent 55%), radial-gradient(circle at 30% 70%, #0d1b2a 0%, transparent 65%), radial-gradient(circle at 80% 80%, #f6a58d 0%, transparent 70%)",
      "radial-gradient(circle at 40% 20%, #3c1053 0%, transparent 50%), radial-gradient(circle at 70% 70%, #1a1a1a 0%, transparent 60%), radial-gradient(circle at 60% 80%, #f94a19 0%, transparent 70%)",
    ];

    const sections = document.querySelectorAll("section"); 

    window.addEventListener("scroll", () => {
      let index = Math.floor(window.scrollY / window.innerHeight);
      if (gradients[index]) {
        bg.style.opacity = 0;
        setTimeout(() => {
          bg.style.background = gradients[index];
          bg.style.opacity = 1;
        }, 500);
      }
    });


    // Animación escalonada para la sección "Por qué elegirnos"
    const firstWhyCard = document.querySelector('.card-why');
    if (firstWhyCard) {
      const whySection = firstWhyCard.closest('section');
      const whyCards = Array.from(whySection.querySelectorAll('.card-why'));
      // Delays escalonados 0ms, 120ms, 240ms
      whyCards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 120}ms`;
      });

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              whyCards.forEach((c) => c.classList.add('visible'));
            } else {
              whyCards.forEach((c) => c.classList.remove('visible'));
            }
          });
        },
        {
          root: null,
          threshold: 0.1, // ~30% del bloque en viewport
        }
      );
      sectionObserver.observe(whySection);
    }
    // Apunta al contenedor principal de Swiper, que en tu HTML tiene la clase 'swiper'
    const swiperContainer = document.querySelector('.google-reviews-swiper');
    if (swiperContainer) {
      // Carga de reseñas usando Google Maps JS API (sin backend)
      loadGoogleReviewsVanilla();
    }

    function displayReviews(reviews) {
        // Apunta al contenedor del wrapper que en tu HTML tiene el ID 'google-reviews-section'
        const swiperWrapper = document.getElementById('google-reviews-section');
        if (!swiperWrapper) return;

        swiperWrapper.innerHTML = ''; // Limpiar el contenedor antes de agregar los comentarios

        reviews.forEach(review => {
            const reviewCard = document.createElement('article');
            reviewCard.className = 'review-card card-why swiper-slide';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <img src="${review.profile_photo_url}" alt="Foto de perfil de ${review.author_name}" class="reviewer-photo" referrerpolicy="no-referrer">
                    <h3>${review.author_name}</h3>
                    <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    </div>
                    <p class="review-text">
                    ${review.text}
                    </p>
                    <p><a href="${review.author_url}" target="_blank" rel="noopener" class="more">Leer Completo</a></p>
            `;
            swiperWrapper.appendChild(reviewCard);
        });
    }

    function loadGoogleReviewsVanilla() {
      const section = document.getElementById('google-reviews-section');
      try {
        const env = window.ENV || {};
        const API_KEY = env.GOOGLE_API_KEY;
        const PLACE_ID = env.PLACE_ID;

        if (!PLACE_ID) {
          console.warn('Falta PLACE_ID en window.ENV (env.js).');
          if (section) section.innerHTML = '<p>Configura env.js con tu PLACE_ID.</p>';
          return;
        }

        // 1) Intento de caché por 24h por PLACE_ID
        const CACHE_KEY = `google_reviews_${PLACE_ID}`;
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        try {
          const cachedRaw = localStorage.getItem(CACHE_KEY);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached && Array.isArray(cached.reviews) && (Date.now() - (cached.timestamp || 0)) < ONE_DAY_MS) {
              displayReviews(cached.reviews);
              // Inicializa Swiper una única vez
              const swiperEl = document.querySelector('.google-reviews-swiper');
              if (swiperEl && !swiperEl.dataset.initialized) {
                new Swiper('.google-reviews-swiper', {
                  loop: true,
                  slidesPerView: 1,
                  spaceBetween: 15,
                  pagination: { el: '.swiper-pagination', clickable: true },
                  navigation: { nextEl: '.button-next-google', prevEl: '.button-prev-google' },
                  breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
                });
                swiperEl.dataset.initialized = '1';
              }
              return; // usar caché y no llamar a Google
            }
          }
        } catch (e) {
          // Si localStorage falla, seguimos sin caché
          console.warn('No se pudo leer cache de reseñas:', e);
        }

        if (!API_KEY) {
          console.warn('Falta GOOGLE_API_KEY en window.ENV (env.js).');
          if (section) section.innerHTML = '<p>Configura env.js con tu GOOGLE_API_KEY.</p>';
          return;
        }

        // 2) Cargar el script de Google Maps JS API y pedir reseñas
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&language=es`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          const service = new google.maps.places.PlacesService(document.createElement('div'));
          service.getDetails(
            { placeId: PLACE_ID, fields: ['reviews'] },
            (place, status) => {
              if (status !== google.maps.places.PlacesServiceStatus.OK) {
                console.error('Error al cargar reseñas:', status);
                if (section) section.innerHTML = '<p>No se pudieron cargar las reseñas en este momento.</p>';
                return;
              }
              const reviews = (place && place.reviews) ? place.reviews : [];
              displayReviews(reviews);

              // Guardar en caché por 24h
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), reviews }));
              } catch (e) {
                console.warn('No se pudo guardar cache de reseñas:', e);
              }

              // Inicializa Swiper una única vez
              const swiperEl = document.querySelector('.google-reviews-swiper');
              if (swiperEl && !swiperEl.dataset.initialized) {
                new Swiper('.google-reviews-swiper', {
                  loop: true,
                  slidesPerView: 1,
                  spaceBetween: 15,
                  pagination: { el: '.swiper-pagination', clickable: true },
                  navigation: { nextEl: '.button-next-google', prevEl: '.button-prev-google' },
                  breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
                });
                swiperEl.dataset.initialized = '1';
              }
            }
          );
        };
        script.onerror = () => {
          console.error('No se pudo cargar el script de Google Maps API');
          if (section) section.innerHTML = '<p>No se pudieron cargar las reseñas (carga de Google API falló).</p>';
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('Error inicializando reseñas:', err);
        if (section) section.innerHTML = '<p>No se pudieron cargar las reseñas.</p>';
      }
    }
    new Swiper('.carousel-videos', {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 15,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.button-next-video',
            prevEl: '.button-prev-video',
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 4,
            },
        },
    });

    // main.js

    function loadMap() {
      const d = document.getElementById('mapa');
      if (!d) return; // seguridad si no existe en esta página
      if (d.dataset.loaded) return;

      d.dataset.loaded = "1";
      d.innerHTML = `<iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d554.0114096483071!2d-75.6046249971185!3d6.15315067050749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4683c43bb40789%3A0x54621ae62148d3be!2sCl.%2061%20Sur%20%2339-70%2C%20Alto%20Las%20Flores%2C%20Sabaneta%2C%20Antioquia!5e0!3m2!1ses!2sco!4v1755736810490!5m2!1ses!2sco"
        style="border:0" allowfullscreen loading="lazy"
        referrerpolicy="no-referrer-when-downgrade" class="mapa"></iframe>`;
    }

    // Evento de click para cargar el mapa solo cuando el usuario lo pida
    const trigger = document.getElementById("mapaTrigger");
    const placeholder = document.getElementById("mapa-placeholder");
    const handleClick = (e) => {
      if (e) e.preventDefault();
      loadMap();
      // opcional: quitar el placeholder si existe
      const ph = document.getElementById("mapa-placeholder");
      if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
    };
    if (trigger) trigger.addEventListener("click", handleClick);
    if (placeholder) placeholder.addEventListener("click", handleClick);

    // Setup del modal de video (ejecuta dentro del DOMContentLoaded principal)
    const videoModal = document.getElementById("videoModal");
    const videoFrame = document.getElementById("videoFrame");
    if (videoModal && videoFrame) {
      document.querySelectorAll(".open-video").forEach(el => {
        el.addEventListener("click", () => {
          const videoId = el.dataset.video;
          const src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          videoFrame.setAttribute("src", src);
          const modal = new bootstrap.Modal(videoModal);
          modal.show();
        });
      });
      videoModal.addEventListener("hidden.bs.modal", () => {
        videoFrame.setAttribute("src", "");
      });
    }


});
