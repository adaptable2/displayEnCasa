document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById("bg-site");

    const gradients = [
      "radial-gradient(circle at 40% 60%, #f94a19 0%, transparent 60%), radial-gradient(circle at 70% 40%, #5c7398 0%, transparent 65%), radial-gradient(circle at 20% 80%, #1a1a1a 0%, transparent 70%)",
      "radial-gradient(circle at 50% 50%, #2a2f3b 0%, transparent 55%), radial-gradient(circle at 20% 80%, #7a2c87 0%, transparent 65%), radial-gradient(circle at 80% 20%, #f94a19 0%, transparent 70%)",
      "radial-gradient(circle at 50% 70%, #3d3d3d 0%, transparent 55%), radial-gradient(circle at 20% 40%, #1f4068 0%, transparent 65%), radial-gradient(circle at 80% 60%, #f97450 0%, transparent 70%)",
      "radial-gradient(circle at 30% 80%, #7a7a7a 0%, transparent 50%), radial-gradient(circle at 70% 30%, #2a2f3b 0%, transparent 60%), radial-gradient(circle at 50% 50%, #f94a19 0%, transparent 65%)",
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
      // Intenta primero el endpoint del servidor; si falla, usa JSON estático
      (async () => {
        let useProxyImages = true;
        let reviews = [];
        try {
          const res = await fetch('/api/google-reviews', { cache: 'no-store' });
          if (!res.ok) throw new Error('Respuesta no OK del proxy');
          reviews = await res.json();
          useProxyImages = true;
        } catch (e) {
          try {
            const res2 = await fetch('data/google-reviews.json', { cache: 'no-store' });
            if (!res2.ok) throw new Error('JSON estático no encontrado');
            reviews = await res2.json();
            useProxyImages = false; // sin servidor, usamos URLs directas de Google
          } catch (e2) {
            console.error('No se pudieron cargar reseñas (proxy ni JSON):', e, e2);
            const wrap = document.getElementById('google-reviews-section');
            if (wrap) wrap.innerHTML = '<p>No se pudieron cargar las reseñas en este momento.</p>';
            return;
          }
        }

        // Renderiza y activa el carrusel
        displayReviews(reviews, useProxyImages);
        new Swiper('.google-reviews-swiper', {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 15,
          pagination: { el: '.swiper-pagination', clickable: true },
          navigation: { nextEl: '.button-next-google', prevEl: '.button-prev-google' },
          breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
        });
      })();
    }

    function displayReviews(reviews, useProxyImages = true) {
        // Apunta al contenedor del wrapper que en tu HTML tiene el ID 'google-reviews-section'
        const swiperWrapper = document.getElementById('google-reviews-section');
        if (!swiperWrapper) return;

        swiperWrapper.innerHTML = ''; // Limpiar el contenedor antes de agregar los comentarios

        reviews.forEach(review => {
            const reviewCard = document.createElement('article');
            reviewCard.className = 'review-card card-why swiper-slide';
            const photoSrc = useProxyImages
              ? `/proxy-google-photo?url=${encodeURIComponent(review.profile_photo_url)}`
              : review.profile_photo_url;
            reviewCard.innerHTML = `
                <div class="review-header">
                    <img src="${photoSrc}" alt="Foto de perfil de ${review.author_name}" class="reviewer-photo">
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


});
