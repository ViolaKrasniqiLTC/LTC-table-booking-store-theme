(function () {
  const PAGE_SIZE = 3;
  const root = document.querySelector('.my-bookings');
  if (!root) return;

  const list = root.querySelector('#my-bookings-list');
  const tabs = root.querySelectorAll('.my-bookings__tab');
  const sortSelect = root.querySelector('#my-bookings-sort');
  const emptyTabMessage = root.querySelector('.my-bookings__empty-tab');
  const pagination = root.querySelector('.my-bookings__pagination');
  const paginationStatus = root.querySelector('.my-bookings__pagination-status');
  const prevButton = root.querySelector('[data-pagination="prev"]');
  const nextButton = root.querySelector('[data-pagination="next"]');

  const layout = root.querySelector('.my-bookings__layout');
  const form = root.querySelector('.my-bookings__form:not(.my-bookings__form--standalone)');
  const cancelError = root.querySelector('[data-cancel-error]');

  let activeFilter = 'upcoming';
  let currentPage = 1;

  function getCards() {
    if (!list) return [];
    return Array.from(list.querySelectorAll('.my-bookings__card'));
  }

  function getFilteredCards() {
    return getCards().filter(function (card) {
      return card.dataset.category === activeFilter;
    });
  }

  function normalizeBookingId(value) {
    return String(value || '')
      .replace(/booking/gi, '')
      .replace(/#/g, '')
      .trim()
      .toLowerCase();
  }

  function getCancelledIds() {
    return getCards()
      .filter(function (card) {
        return card.dataset.category === 'cancelled';
      })
      .map(function (card) {
        return normalizeBookingId(card.dataset.bookingId);
      })
      .filter(Boolean);
  }

  function showCancelError(message) {
    if (!cancelError) return;
    cancelError.textContent = message;
    cancelError.hidden = false;
  }

  function hideCancelError() {
    if (!cancelError) return;
    cancelError.hidden = true;
    cancelError.textContent = '';
  }

  function collectShadowHosts(container) {
    const hosts = [];
    if (!container) return hosts;

    function walk(node) {
      if (!node || node.nodeType !== 1) return;

      if (node.shadowRoot) {
        hosts.push(node);
        walk(node.shadowRoot);
      }

      Array.from(node.children || []).forEach(walk);
    }

    walk(container);
    return hosts;
  }

  function findBookingIdInput(scope) {
    if (!scope) return null;

    const inputs = Array.from(scope.querySelectorAll('input, textarea'));
    return (
      inputs.find(function (input) {
        const haystack = [
          input.name,
          input.id,
          input.getAttribute('aria-label'),
          input.placeholder,
          input.getAttribute('autocomplete'),
        ]
          .join(' ')
          .toLowerCase();

        return /booking/.test(haystack) && /id/.test(haystack);
      }) ||
      inputs.find(function (input) {
        const haystack = [input.name, input.id, input.placeholder, input.getAttribute('aria-label')]
          .join(' ')
          .toLowerCase();
        return /booking/.test(haystack);
      }) ||
      null
    );
  }

  function getBookingIdFromScope(scope) {
    const input = findBookingIdInput(scope);
    return input ? input.value : '';
  }

  function shouldBlockCancellation(bookingId) {
    const normalized = normalizeBookingId(bookingId);
    if (!normalized) return false;
    return getCancelledIds().indexOf(normalized) !== -1;
  }

  function blockIfCancelled(event, scope) {
    const bookingId = getBookingIdFromScope(scope);
    if (!shouldBlockCancellation(bookingId)) {
      hideCancelError();
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }

    showCancelError('This booking is already cancelled.');
    return true;
  }

  function attachCancelGuard() {
    if (!form) return;

    const hosts = collectShadowHosts(form);
    const scopes = [form].concat(
      hosts
        .map(function (host) {
          return host.shadowRoot;
        })
        .filter(Boolean)
    );

    scopes.forEach(function (scope) {
      const forms = Array.from(scope.querySelectorAll('form'));
      const targets = forms.length ? forms : [scope];

      targets.forEach(function (target) {
        if (!target || target.dataset.cancelGuardAttached === 'true') return;
        target.dataset.cancelGuardAttached = 'true';

        target.addEventListener(
          'submit',
          function (event) {
            blockIfCancelled(event, scope);
          },
          true
        );

        target.addEventListener(
          'click',
          function (event) {
            const submitter = event.target.closest('button, input[type="submit"]');
            if (!submitter) return;
            if (submitter.tagName === 'BUTTON' && submitter.type && submitter.type !== 'submit') return;
            blockIfCancelled(event, scope);
          },
          true
        );

        const bookingInput = findBookingIdInput(scope);
        if (bookingInput && bookingInput.dataset.cancelGuardInput !== 'true') {
          bookingInput.dataset.cancelGuardInput = 'true';
          bookingInput.addEventListener('input', hideCancelError);
          bookingInput.addEventListener('change', hideCancelError);
        }
      });
    });
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

    currentPage = 1;
    updateVisibility();
  }

  function updateVisibility() {
    const cards = getCards();
    const filteredCards = getFilteredCards();
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    const upcomingCount = cards.filter(function (card) {
      return card.dataset.category === 'upcoming';
    }).length;
    const showForm = activeFilter === 'upcoming' && upcomingCount > 0 && Boolean(form);

    cards.forEach(function (card) {
      card.classList.add('my-bookings__card--hidden');
    });

    filteredCards.forEach(function (card, index) {
      const onPage = index >= startIndex && index < endIndex;
      card.classList.toggle('my-bookings__card--hidden', !onPage);
    });

    if (form) {
      form.hidden = !showForm;
      form.classList.toggle('my-bookings__form--hidden', !showForm);
    }

    if (layout) {
      layout.classList.toggle('my-bookings__layout--with-form', showForm);
      layout.classList.toggle('my-bookings__layout--narrow', !showForm);
    }

    if (emptyTabMessage) {
      emptyTabMessage.hidden = filteredCards.length > 0;
    }

    if (pagination) {
      const showPagination = filteredCards.length > PAGE_SIZE;
      pagination.hidden = !showPagination;

      if (paginationStatus) {
        paginationStatus.textContent = 'Page ' + currentPage + ' of ' + totalPages;
      }

      if (prevButton) {
        prevButton.disabled = currentPage <= 1;
      }

      if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
      }
    }

    if (showForm) {
      attachCancelGuard();
    } else {
      hideCancelError();
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
    const copyButton = event.target.closest('.my-bookings__copy-id');
    if (copyButton && root.contains(copyButton)) {
      copyBookingId(copyButton);
      return;
    }

    const paginationButton = event.target.closest('[data-pagination]');
    if (!paginationButton || !root.contains(paginationButton) || paginationButton.disabled) return;

    if (paginationButton.dataset.pagination === 'prev') {
      currentPage -= 1;
    } else if (paginationButton.dataset.pagination === 'next') {
      currentPage += 1;
    }

    updateVisibility();
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activeFilter = tab.dataset.filter;
      currentPage = 1;
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

  if (form) {
    const observer = new MutationObserver(function () {
      attachCancelGuard();
    });
    observer.observe(form, { childList: true, subtree: true });
    attachCancelGuard();
    window.setTimeout(attachCancelGuard, 500);
    window.setTimeout(attachCancelGuard, 1500);
  }

  if (list && tabs.length) {
    sortCards();
  }
})();
