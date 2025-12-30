(() => {
  const menus = Array.from(document.querySelectorAll('.nav-menu'));

  if (!menus.length) {
    return;
  }

  const closeMenu = (menu) => {
    menu.removeAttribute('open');
  };

  document.addEventListener('click', (event) => {
    menus.forEach((menu) => {
      if (!menu.open) {
        return;
      }

      if (menu.contains(event.target)) {
        if (event.target.closest('.nav-menu__panel a')) {
          closeMenu(menu);
        }
        return;
      }

      closeMenu(menu);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    menus.forEach((menu) => {
      if (menu.open) {
        closeMenu(menu);
      }
    });
  });
})();
