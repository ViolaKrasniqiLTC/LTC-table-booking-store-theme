(function () {
  const root = document.querySelector('.my-bookings');
  if (!root) return;

  const list = root.querySelector('#my-bookings-list');
  const tabs = root.querySelectorAll('.my-bookings__tab');
  const sortSelect = root.querySelector('#my-bookings-sort');
  const emptyTabMessage = root.querySelector('.my-bookings__empty-tab');

  let activeFilter = 'upcoming';

  function getCards() {
    if (!list) return [];
    return Array.from(list.querySelectorAll('.my-bookings__card'));
  }

  function sortCards() {
    if (!list) return;
    const cards = getCards();
    const direction = sortSelect?.value === 'oldest' ? 1 : -1;

    cards.sort(function (a, b) {
      const dateA = Number(a.dataset.orderDate || 0);
      const dateB = Number(b.dataset.orderDate || 0);
      return (dateA - dateB) * direction;
    });

    cards.forEach(function (card) {
      list.appendChild(card);
    });
  }

  function updateVisibility() {
    const cards = getCards();
    let visibleCount = 0;

    cards.forEach(function (card) {
      const matches = card.dataset.category === activeFilter;
      card.classList.toggle('my-bookings__card--hidden', !matches);
      if (matches) visibleCount += 1;
    });

    if (emptyTabMessage) {
      emptyTabMessage.hidden = visibleCount > 0;
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activeFilter = tab.dataset.filter;
      tabs.forEach(function (item) {
        const isActive = item === tab;
        item.classList.toggle('my-bookings__tab--active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      updateVisibility();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', sortCards);
  }

  if (list && tabs.length) {
    sortCards();
    updateVisibility();
  }
})();
