(() => {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) {
    return;
  }

  const acceptButton = banner.querySelector('[data-consent="accept"]');
  const rejectButton = banner.querySelector('[data-consent="reject"]');
  const customizeButton = banner.querySelector('[data-consent="customize"]');
  const details = banner.querySelector('.cookie-banner__details');

  const storedConsent = localStorage.getItem('cookieConsent');
  if (storedConsent) {
    banner.remove();
    return;
  }

  const dismiss = (value) => {
    localStorage.setItem('cookieConsent', value);
    banner.dataset.state = 'dismissed';
    window.setTimeout(() => {
      banner.remove();
    }, 300);
  };

  if (acceptButton) {
    acceptButton.addEventListener('click', () => dismiss('accepted'));
  }

  if (rejectButton) {
    rejectButton.addEventListener('click', () => dismiss('rejected'));
  }

  if (customizeButton && details) {
    customizeButton.addEventListener('click', () => {
      const isHidden = details.hasAttribute('hidden');
      if (isHidden) {
        details.removeAttribute('hidden');
      } else {
        details.setAttribute('hidden', '');
      }
      customizeButton.setAttribute('aria-expanded', String(isHidden));
    });
  }
})();
