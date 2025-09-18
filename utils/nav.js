export function initNavDisclosure(breakpoint = '(max-width: 40em)') {
  const menu = document.querySelector('.nav-menu');
  const toggle = document.querySelector('.nav-toggle');
  if (!menu || !toggle) return null;

  const mediaQuery = window.matchMedia(breakpoint);
  let previousFocus = null;
  let listenersAttached = false;

  const handleDocumentClick = (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
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
    menu.classList.add('is-open');
    menu.removeAttribute('aria-hidden');
    addGlobalListeners();

    if (focusFirst) {
      const focusable = menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusable instanceof HTMLElement) {
        focusable.focus();
      }
    }
  }

  function closeNav({ returnFocus = true } = {}) {
    if (toggle.getAttribute('aria-expanded') === 'false') {
      if (mediaQuery.matches) {
        menu.setAttribute('aria-hidden', 'true');
      } else {
        menu.removeAttribute('aria-hidden');
      }
      removeGlobalListeners();
      if (returnFocus && previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      previousFocus = null;
      return;
    }

    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    if (mediaQuery.matches) {
      menu.setAttribute('aria-hidden', 'true');
    } else {
      menu.removeAttribute('aria-hidden');
    }
    removeGlobalListeners();

    if (returnFocus && previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function syncState() {
    if (mediaQuery.matches) {
      menu.setAttribute('data-collapsible', 'true');
      toggle.hidden = false;
      if (toggle.getAttribute('aria-expanded') === 'true') {
        menu.classList.add('is-open');
        menu.removeAttribute('aria-hidden');
        addGlobalListeners();
      } else {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        removeGlobalListeners();
      }
    } else {
      menu.classList.remove('is-open');
      menu.removeAttribute('data-collapsible');
      menu.removeAttribute('aria-hidden');
      toggle.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      removeGlobalListeners();
      previousFocus = null;
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
