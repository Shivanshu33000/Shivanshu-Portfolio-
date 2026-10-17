(() => {
  'use strict';

  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('primaryNav');
  const navToggle = document.getElementById('mobileNavToggle');
  const themeToggle = document.getElementById('themeToggle');
  const progressBar = document.getElementById('readingProgress');
  const year = document.getElementById('currentYear');
  const mobileBreakpoint = window.matchMedia('(max-width: 820px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const themeStorageKey = 'shivanshu-portfolio-theme';

  if (year) year.textContent = String(new Date().getFullYear());

  // Keep the mobile menu accessible and close it when the viewport changes or a link is used.
  const closeMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });

    nav.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      const target = event.target;
      if (target instanceof Node && !nav.contains(target) && !navToggle.contains(target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        navToggle.focus();
      }
    });

    const handleBreakpointChange = (event) => {
      if (!event.matches) closeMenu();
    };
    if (typeof mobileBreakpoint.addEventListener === 'function') {
      mobileBreakpoint.addEventListener('change', handleBreakpointChange);
    } else if (typeof mobileBreakpoint.addListener === 'function') {
      mobileBreakpoint.addListener(handleBreakpointChange);
    }
  }

  // Optional theme preference. The site still renders in its default light theme without storage.
  const setTheme = (theme, save = true) => {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = normalizedTheme;
    if (themeToggle) {
      const darkEnabled = normalizedTheme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(darkEnabled));
      themeToggle.setAttribute('aria-label', darkEnabled ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.title = darkEnabled ? 'Switch to light theme' : 'Switch to dark theme';
      const glyph = themeToggle.querySelector('.theme-glyph');
      if (glyph) glyph.textContent = darkEnabled ? '☼' : '◐';
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', normalizedTheme === 'dark' ? '#0b1422' : '#f7f8fc');
    if (save) {
      try { localStorage.setItem(themeStorageKey, normalizedTheme); } catch (_error) { /* Storage may be unavailable in private/file contexts. */ }
    }
  };

  try {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme, false);
  } catch (_error) {
    // Keep the default theme when local storage is blocked.
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // One scroll handler updates the header and slim reading-progress bar.
  let scrollScheduled = false;
  const updateScrollUI = () => {
    const scrollTop = window.scrollY || root.scrollTop || 0;
    const scrollableHeight = Math.max(1, root.scrollHeight - window.innerHeight);
    if (header) header.classList.toggle('is-scrolled', scrollTop > 8);
    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))}%`;
    scrollScheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(updateScrollUI);
  }, { passive: true });
  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  // Reveal content as it enters the viewport, with a no-observer fallback and reduced-motion support.
  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Mark the navigation item that corresponds to the section currently in view.
  if ('IntersectionObserver' in window && nav) {
    const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
    const sectionToLink = new Map();
    navLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) sectionToLink.set(section, link);
    });
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove('active'));
        const activeLink = sectionToLink.get(entry.target);
        if (activeLink) activeLink.classList.add('active');
      });
    }, { rootMargin: '-28% 0px -60% 0px', threshold: 0 });
    sectionToLink.forEach((_link, section) => activeObserver.observe(section));
  }
})();
