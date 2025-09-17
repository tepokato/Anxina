export function initNavDisclosure(breakpoint = '(max-width: 40em)') {
  const nav = document.querySelector('.nav-links');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav || !toggle) return null;

  const mediaQuery = window.matchMedia(breakpoint);
  let previousFocus = null;
  let listenersAttached = false;

  const handleDocumentClick = (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      closeNav({ returnFocus: false });
    }
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      closeNav();
    }
  };

  function addGlobalListeners() {
    if (listenersAttached) return;
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
    listenersAttached = true;
  }

  function removeGlobalListeners() {
    if (!listenersAttached) return;
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeydown);
    listenersAttached = false;
  }

  function openNav({ focusFirst = false } = {}) {
    if (toggle.getAttribute('aria-expanded') === 'true') return;
    if (!mediaQuery.matches) return;

    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    nav.removeAttribute('aria-hidden');
    addGlobalListeners();

    if (focusFirst) {
      const focusable = nav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusable instanceof HTMLElement) {
        focusable.focus();
      }
    }
  }

  function closeNav({ returnFocus = true } = {}) {
    if (toggle.getAttribute('aria-expanded') === 'false') {
      if (mediaQuery.matches) {
        nav.setAttribute('aria-hidden', 'true');
      } else {
        nav.removeAttribute('aria-hidden');
      }
      removeGlobalListeners();
      if (returnFocus && previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      previousFocus = null;
      return;
    }

    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (mediaQuery.matches) {
      nav.setAttribute('aria-hidden', 'true');
    } else {
      nav.removeAttribute('aria-hidden');
    }
    removeGlobalListeners();

    if (returnFocus && previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function syncState() {
    if (mediaQuery.matches) {
      nav.setAttribute('data-collapsible', 'true');
      toggle.hidden = false;
      if (toggle.getAttribute('aria-expanded') === 'true') {
        nav.classList.add('is-open');
        nav.removeAttribute('aria-hidden');
        addGlobalListeners();
      } else {
        nav.classList.remove('is-open');
        nav.setAttribute('aria-hidden', 'true');
        removeGlobalListeners();
      }
    } else {
      nav.classList.remove('is-open');
      nav.removeAttribute('data-collapsible');
      nav.removeAttribute('aria-hidden');
      toggle.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      removeGlobalListeners();
    }
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeNav();
    } else {
      openNav({ focusFirst: true });
    }
  });

  const syncHandler = () => syncState();
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', syncHandler);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(syncHandler);
  }

  syncState();

  return {
    open: openNav,
    close: closeNav
  };
}
