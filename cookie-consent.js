(() => {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) {
    return;
  }

  const acknowledgeButton = banner.querySelector('[data-consent="acknowledge"]');

  const dismiss = () => {
    banner.dataset.state = 'dismissed';
    window.setTimeout(() => {
      banner.remove();
    }, 300);
  };

  if (acknowledgeButton) {
    acknowledgeButton.addEventListener('click', dismiss);
  }
})();
