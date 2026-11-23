/* ============================================================
   VAN STUDIO — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ============================================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header   = document.getElementById('site-header');
  const progress = document.querySelector('.scroll-progress');
  const waFloat  = document.getElementById('wa-float');
  const heroGlow = document.querySelector('.hero__glow');
  const docEl    = document.documentElement;

  /* ------------------------------------------------------------
     1. Scroll: header state, progress bar, floating WhatsApp
     ------------------------------------------------------------ */
  let ticking = false;

  const updateScroll = () => {
    const y = window.scrollY || docEl.scrollTop || 0;

    if (header) header.classList.toggle('is-scrolled', y > 24);

    if (progress) {
      const max = docEl.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }

    if (waFloat) waFloat.classList.toggle('is-visible', y > 420);

    if (heroGlow && !reduceMotion && window.innerWidth > 960) {
      heroGlow.style.transform = `translate3d(0, ${Math.min(y * 0.09, 70)}px, 0)`;
    }

    ticking = false;
  };

  const requestScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScroll);
    }
  };

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });
  updateScroll();

  /* ------------------------------------------------------------
     2. Section reveal with a considered stagger
     ------------------------------------------------------------ */
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const seen = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      const i = seen.get(parent) || 0;
      seen.set(parent, i + 1);
      let delay = Math.min(i * 80, 480);
      if (el.classList.contains('hero__visual')) delay += 160;
      el.style.transitionDelay = `${delay}ms`;
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------
     3. Active nav link while scrolling
     ------------------------------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));

  if (navLinks.length && 'IntersectionObserver' in window) {
    const targets = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-46% 0px -50% 0px', threshold: 0 });

    targets.forEach((section) => spy.observe(section));
  }

  /* ------------------------------------------------------------
     4. Mobile menu (focus-safe)
     ------------------------------------------------------------ */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    const menuLinks = Array.from(mobileMenu.querySelectorAll('a'));

    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      mobileMenu.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);

      if (open) {
        window.setTimeout(() => {
          if (menuLinks[0]) menuLinks[0].focus({ preventScroll: true });
        }, 140);
      }
    };

    menuBtn.addEventListener('click', () => {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });

    menuLinks.forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      if (!open) return;

      if (event.key === 'Escape') {
        setMenu(false);
        menuBtn.focus({ preventScroll: true });
        return;
      }

      if (event.key === 'Tab') {
        const first = menuBtn;
        const last = menuLinks[menuLinks.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    const desktop = window.matchMedia('(min-width: 961px)');
    const closeOnDesktop = (event) => { if (event.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', closeOnDesktop);
    else if (desktop.addListener) desktop.addListener(closeOnDesktop);
  }

  /* ------------------------------------------------------------
     5. Gallery lightbox
     ------------------------------------------------------------ */
  const galleryItems = Array.from(document.querySelectorAll('.gitem'));
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbSub = document.getElementById('lb-sub');
  const lbCount = document.getElementById('lb-count');
  const lbPrev = document.querySelector('.lb__nav--prev');
  const lbNext = document.querySelector('.lb__nav--next');
  const lbClose = document.querySelector('.lb__close');

  if (galleryItems.length && lightbox && lbImg) {
    const data = galleryItems.map((btn) => ({
      full: btn.dataset.full,
      alt: btn.dataset.alt || '',
      title: btn.dataset.title || '',
      sub: btn.dataset.sub || ''
    }));

    let index = 0;
    let lastTrigger = null;

    const pad = (n) => String(n).padStart(2, '0');

    const render = (next, preload = true) => {
      index = (next + data.length) % data.length;
      const item = data[index];

      lbImg.src = item.full;
      lbImg.alt = item.alt;
      if (lbTitle) lbTitle.textContent = item.title;
      if (lbSub) lbSub.textContent = item.sub;
      if (lbCount) lbCount.textContent = `${pad(index + 1)} / ${pad(data.length)}`;

      lbImg.style.animation = 'none';
      void lbImg.offsetWidth;
      lbImg.style.animation = '';

      if (preload) {
        [index + 1, index - 1].forEach((offset) => {
          const item2 = data[(offset + data.length) % data.length];
          if (item2) {
            const img = new Image();
            img.src = item2.full;
          }
        });
      }
    };

    const open = (i, trigger) => {
      lastTrigger = trigger || null;
      render(i, false);
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
      else lightbox.setAttribute('open', '');
      document.body.classList.add('is-locked');
    };

    galleryItems.forEach((btn, i) => {
      btn.addEventListener('click', () => open(i, btn));
    });

    if (lbPrev) lbPrev.addEventListener('click', () => render(index - 1));
    if (lbNext) lbNext.addEventListener('click', () => render(index + 1));

    if (lbClose) {
      lbClose.addEventListener('click', () => lightbox.close());
    }

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target.classList.contains('lb__inner')) {
        lightbox.close();
      }
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); render(index + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); render(index - 1); }
    });

    lightbox.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      lbImg.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------
     6. Footer year
     ------------------------------------------------------------ */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
