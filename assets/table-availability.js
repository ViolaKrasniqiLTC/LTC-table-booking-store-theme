(function () {
  const root = document.querySelector('.table-availability');
  if (!root) return;

  const tabs = root.querySelectorAll('[role="tab"]');
  const panels = root.querySelectorAll('[role="tabpanel"]');
  if (!tabs.length || !panels.length) return;

  function activateTab(tab) {
    const targetId = tab.getAttribute('aria-controls');

    tabs.forEach(function (btn) {
      const selected = btn === tab;
      btn.classList.toggle('table-availability__tab--active', selected);
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.setAttribute('tabindex', selected ? '0' : '-1');
    });

    panels.forEach(function (panel) {
      const isActive = panel.id === targetId;
      panel.hidden = !isActive;
      panel.classList.toggle('table-availability__panel--active', isActive);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab);
    });

    tab.addEventListener('keydown', function (event) {
      const tabsArray = Array.from(tabs);
      const index = tabsArray.indexOf(tab);
      let nextIndex = index;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabsArray.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabsArray.length) % tabsArray.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabsArray.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      tabsArray[nextIndex].focus();
      activateTab(tabsArray[nextIndex]);
    });
  });
})();
