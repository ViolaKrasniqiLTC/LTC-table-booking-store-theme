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

  function uniqueIds(ids) {
    const seen = {};
    return (ids || []).reduce(function (result, id) {
      const normalized = normalizeBookingId(id);
      if (!normalized || seen[normalized]) return result;
      seen[normalized] = true;
      result.push(normalized);
      return result;
    }, []);
  }

  function getIdsByCategory(category) {
    return uniqueIds(
      getCards()
        .filter(function (card) {
          return card.dataset.category === category;
        })
        .map(function (card) {
          return card.dataset.bookingId;
        })
    );
  }

  function getBlockedIds(kind) {
    const fromWindow =
      kind === 'cancelled'
        ? window.bookingCancelGuard && window.bookingCancelGuard.cancelledIds
        : window.bookingCancelGuard && window.bookingCancelGuard.completedIds;
    const fromCards = getIdsByCategory(kind === 'cancelled' ? 'cancelled' : 'past');
    return uniqueIds([].concat(fromWindow || [], fromCards || []));
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

  function getScopes(container) {
    const hosts = collectShadowHosts(container);
    return [container].concat(
      hosts
        .map(function (host) {
          return host.shadowRoot;
        })
        .filter(Boolean)
    );
  }

  function getInputValues(scope) {
    if (!scope || !scope.querySelectorAll) return [];
    return Array.from(scope.querySelectorAll('input, textarea'))
      .map(function (input) {
        return input.value;
      })
      .filter(Boolean);
  }

  function getCandidateBookingIds(scope, event) {
    const values = [];

    getScopes(scope || form).forEach(function (currentScope) {
      getInputValues(currentScope).forEach(function (value) {
        values.push(value);
      });
    });

    if (event && typeof event.composedPath === 'function') {
      event.composedPath().forEach(function (node) {
        if (!node || node.nodeType !== 1) return;

        if ((node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') && node.value) {
          values.push(node.value);
        }

        if (node.querySelectorAll && (node.tagName === 'FORM' || node.shadowRoot)) {
          const root = node.shadowRoot || node;
          getInputValues(root).forEach(function (value) {
            values.push(value);
          });
        }
      });
    }

    return uniqueIds(values);
  }

  function getCancellationBlockMessageFromValues(values) {
    const cancelledIds = getBlockedIds('cancelled');
    const completedIds = getBlockedIds('completed');

    for (let i = 0; i < values.length; i += 1) {
      const normalized = values[i];
      if (cancelledIds.indexOf(normalized) !== -1) {
        return 'This booking is already cancelled.';
      }
      if (completedIds.indexOf(normalized) !== -1) {
        return 'This booking is already completed';
      }
    }

    return null;
  }

  function getSubmitterFromEvent(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    for (let i = 0; i < path.length; i += 1) {
      const node = path[i];
      if (!node || node.nodeType !== 1) continue;
      const tag = node.tagName;
      if (tag === 'BUTTON') return node;
      if (tag === 'INPUT' && node.type === 'submit') return node;
      if (node.getAttribute && node.getAttribute('role') === 'button') return node;
    }

    if (event.target && event.target.closest) {
      return event.target.closest('button, input[type="submit"], [role="button"]');
    }

    return null;
  }

  function eventIsInsideForm(event) {
    if (!form) return false;

    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.length) {
      return path.indexOf(form) !== -1;
    }

    const target = event.target;
    if (!target) return false;
    return form === target || (form.contains && form.contains(target));
  }

  function blockIfNotCancellable(event) {
    const message = getCancellationBlockMessageFromValues(getCandidateBookingIds(form, event));
    if (!message) {
      hideCancelError();
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }

    showCancelError(message);
    return true;
  }

  function onPotentialSubmit(event) {
    if (!form || form.hidden || form.classList.contains('my-bookings__form--hidden')) return;
    if (!eventIsInsideForm(event)) return;

    if (event.type === 'click' && !getSubmitterFromEvent(event)) return;
    if (event.type === 'keydown' && event.key !== 'Enter') return;

    blockIfNotCancellable(event);
  }

  function attachCancelGuard() {
    if (!form) return;

    if (form.dataset.cancelGuardRoot !== 'true') {
      form.dataset.cancelGuardRoot = 'true';
      document.addEventListener('submit', onPotentialSubmit, true);
      document.addEventListener('click', onPotentialSubmit, true);
      document.addEventListener('keydown', onPotentialSubmit, true);
    }

    const scopes = getScopes(form);

    scopes.forEach(function (scope) {
      if (!scope.querySelectorAll) return;

      Array.from(scope.querySelectorAll('input, textarea')).forEach(function (bookingInput) {
        if (bookingInput.dataset.cancelGuardInput === 'true') return;
        bookingInput.dataset.cancelGuardInput = 'true';
        bookingInput.addEventListener('input', hideCancelError);
        bookingInput.addEventListener('change', hideCancelError);
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
