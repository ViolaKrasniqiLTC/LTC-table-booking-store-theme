(function () {
  const root = document.querySelector('.my-bookings');
  if (!root) return;

  const list = root.querySelector('#my-bookings-list');
  const tabs = root.querySelectorAll('.my-bookings__tab');
  const sortSelect = root.querySelector('#my-bookings-sort');
  const emptyTabMessage = root.querySelector('.my-bookings__empty-tab');

  const layout = root.querySelector('.my-bookings__layout');
  const form = root.querySelector('.my-bookings__form:not(.my-bookings__form--standalone)');

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
    const showForm = activeFilter === 'upcoming';

    cards.forEach(function (card) {
      const matches = card.dataset.category === activeFilter;
      card.classList.toggle('my-bookings__card--hidden', !matches);
      if (matches) visibleCount += 1;
    });

    if (form) {
      form.hidden = !showForm;
      form.classList.toggle('my-bookings__form--hidden', !showForm);
    }

    if (layout) {
      layout.classList.toggle('my-bookings__layout--with-form', showForm && Boolean(form));
      layout.classList.toggle('my-bookings__layout--narrow', !showForm);
    }

    if (emptyTabMessage) {
      emptyTabMessage.hidden = visibleCount > 0;
    }
  }

  async function copyBookingId(button) {
    const value = button.dataset.copyId;
    if (!value) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const input = document.createElement('textarea');
        input.value = value;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch (error) {
      return;
    }

    const icon = button.querySelector('.my-bookings__copy-id-icon');
    const done = button.querySelector('.my-bookings__copy-id-done');

    button.classList.add('is-copied');
    if (icon) icon.hidden = true;
    if (done) done.hidden = false;
    button.setAttribute('aria-label', 'Booking ID copied');

    window.setTimeout(function () {
      button.classList.remove('is-copied');
      if (icon) icon.hidden = false;
      if (done) done.hidden = true;
      button.setAttribute('aria-label', 'Copy booking ID ' + value);
    }, 1600);
  }

  root.addEventListener('click', function (event) {
    const button = event.target.closest('.my-bookings__copy-id');
    if (!button || !root.contains(button)) return;
    copyBookingId(button);
  });

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
