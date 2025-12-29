(() => {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) {
    return;
  }

  const acceptButton = banner.querySelector('[data-consent="accept"]');
  const storedConsent = (() => {
    try {
      return localStorage.getItem('cookieConsent');
    } catch (error) {
      return null;
    }
  })();
  if (storedConsent) {
    banner.remove();
    return;
  }

  const dismiss = (value) => {
    try {
      localStorage.setItem('cookieConsent', value);
    } catch (error) {
      // Local storage can be unavailable in private browsing contexts.
    }
    banner.dataset.state = 'dismissed';
    window.setTimeout(() => {
      banner.remove();
    }, 300);
  };

  if (acceptButton) {
    acceptButton.addEventListener('click', () => dismiss('accepted'));
  }
})();
