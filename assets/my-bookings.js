(function () {
  const root = document.querySelector('.my-bookings');
  if (!root) return;

  const list = root.querySelector('#my-bookings-list');
  const tabs = root.querySelectorAll('.my-bookings__tab');
  const sortSelect = root.querySelector('#my-bookings-sort');
  const emptyTabMessage = root.querySelector('.my-bookings__empty-tab');
  const cancelDialog = document.getElementById('booking-cancel-dialog');
  const cancelForm = document.getElementById('BookingCancelForm');

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

  function openCancelDialog(trigger) {
    if (!cancelDialog || !cancelForm) return;

    const bookingId = trigger.dataset.bookingId || '';
    const orderName = trigger.dataset.orderName || '';
    const table = trigger.dataset.table || '';
    const date = trigger.dataset.date || '';
    const customerName = trigger.dataset.customerName || '';
    const customerEmail = trigger.dataset.customerEmail || '';

    cancelForm.querySelector('[data-cancel-summary="booking-id"]').textContent = bookingId;
    cancelForm.querySelector('[data-cancel-summary="table"]').textContent = table;
    cancelForm.querySelector('[data-cancel-summary="date"]').textContent = date;

    const nameField = cancelForm.querySelector('[data-cancel-name]');
    const emailField = cancelForm.querySelector('[data-cancel-email]');
    const bodyField = cancelForm.querySelector('[data-cancel-body]');
    const reasonField = cancelForm.querySelector('[data-cancel-reason]');

    if (nameField) nameField.value = customerName;
    if (emailField) emailField.value = customerEmail;
    if (reasonField) reasonField.value = '';

    if (bodyField) {
      bodyField.value =
        'Booking cancellation request\n\n' +
        'Booking ID: ' + bookingId + '\n' +
        'Order: ' + orderName + '\n' +
        'Table: ' + table + '\n' +
        'Date: ' + date + '\n' +
        'Customer: ' + customerName + '\n' +
        'Email: ' + customerEmail + '\n\n' +
        'Reason:\n';
    }

    if (typeof cancelDialog.showModal === 'function') {
      cancelDialog.showModal();
    }
  }

  root.querySelectorAll('[data-cancel-trigger]').forEach(function (button) {
    button.addEventListener('click', function () {
      openCancelDialog(button);
    });
  });

  root.querySelectorAll('[data-cancel-close]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (cancelDialog) {
        cancelDialog.close();
      }
    });
  });

  if (cancelForm) {
    cancelForm.addEventListener('submit', function () {
      const reasonField = cancelForm.querySelector('[data-cancel-reason]');
      const bodyField = cancelForm.querySelector('[data-cancel-body]');

      if (!bodyField) return;

      const reason = reasonField?.value.trim();
      bodyField.value = bodyField.value + (reason || 'No reason provided.');
    });

    if (cancelForm.querySelector('.booking-cancel__error') && cancelDialog) {
      cancelDialog.showModal();
    }
  }
})();
