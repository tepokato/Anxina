(() => {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) {
    return;
  }

  const acceptButton = banner.querySelector('[data-consent="accept"]');
  const rejectButton = banner.querySelector('[data-consent="reject"]');
  const customizeButton = banner.querySelector('[data-consent="customize"]');
  const details = banner.querySelector('.cookie-banner__details');
  const storageKey = 'cookieConsent';

  let storedConsent = null;
  try {
    storedConsent = window.localStorage.getItem(storageKey);
  } catch (error) {
    storedConsent = null;
  }
  if (storedConsent) {
    banner.remove();
    return;
  }

  const dismiss = (value) => {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch (error) {
      // Ignore storage errors and still dismiss the banner.
    }
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
