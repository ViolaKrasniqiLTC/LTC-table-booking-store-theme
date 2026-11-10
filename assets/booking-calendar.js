document.addEventListener("DOMContentLoaded", () => {

    const input = document.querySelector("#booking-date");
  
    const selectedList = document.querySelector("#selected-dates");
  
  
  
    const tableInput = document.querySelector("#booking-table");
  
  
  
    const dateInput1 = document.querySelector("#booking-date-1");
  
    const dateInput2 = document.querySelector("#booking-date-2");
  
    const dateInput3 = document.querySelector("#booking-date-3");
  
  
  
    const bookNowButton = document.querySelector("#book-now");
  
  
  
    const popup = document.querySelector("#booking-popup");
  
    const popupTitle = document.querySelector("#popup-title");
  
    const popupMessage = document.querySelector("#popup-message");
  
    const closePopup = document.querySelector("#close-popup");
  
  
  
    const tableName = window.bookingData?.tableName || "Selected Table";
  
  
  
    const unavailableDates = window.bookingData?.unavailableDates || [];
  
  
  
    const alreadyBookedDays = Number(window.customerBookingData?.bookedDays || 0);
  
  
  
    const MAX_BOOKING_DAYS = 3;
  
  
  
    function showPopup(title, message) {
  
      if (!popup) return;
  
  
  
      popupTitle.textContent = title;
  
      popupMessage.textContent = message;
  
  
  
      popup.style.display = "flex";
  
    }
  
  
  
    if (closePopup) {
  
      closePopup.addEventListener("click", () => {
  
        popup.style.display = "none";
  
      });
  
    }
  
  
  
    function moveBookingFieldsIntoForm() {
  
      const addToCartForm =
  
        document.querySelector('form[data-type="add-to-cart-form"]') ||
  
        document.querySelector("product-form form");
  
  
  
      if (!addToCartForm) return;
  
  
  
      [tableInput, dateInput1, dateInput2, dateInput3].forEach((field) => {
  
        if (field && !addToCartForm.contains(field)) {
  
          addToCartForm.appendChild(field);
  
        }
  
      });
  
  
  
      if (tableInput) {
  
        tableInput.value = tableName;
  
      }
  
    }
  
  
  
    moveBookingFieldsIntoForm();
  
  
  
    const UNAVAILABLE_DATES_PATTERN = /unavailableDates:\s*(\[[^\]]*\])/;

    const getFreshUnavailableDates = async () => {
      const response = await fetch(window.location.pathname, {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Availability check failed: ${response.status}`);
      }

      const html = await response.text();
      const match = html.match(UNAVAILABLE_DATES_PATTERN);

      if (!match) {
        throw new Error("Availability data not found on product page");
      }

      const parsed = JSON.parse(match[1]);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((date) => typeof date === "string");
    };

    const clearCart = async () => {
      const response = await fetch("/cart/clear.js", { method: "POST" });

      if (!response.ok) {
        throw new Error(`Cart clear failed: ${response.status}`);
      }
    };

    if (bookNowButton) {
      bookNowButton.addEventListener("click", async () => {
        const dates = [
          dateInput1?.value,
          dateInput2?.value,
          dateInput3?.value,
        ].filter(Boolean);

        if (dates.length === 0) {
          showPopup(
            "No dates selected",
            "Please select at least one booking date.",
          );
          return;
        }

        const variantId =
          document.querySelector('product-form form [name="id"]')?.value ||
          document.querySelector('[name="id"]')?.value ||
          window.bookingData?.variantId;

        if (!variantId) {
          showPopup(
            "Booking unavailable",
            "This table cannot be booked right now. Please refresh and try again.",
          );
          return;
        }

        bookNowButton.disabled = true;

        try {
          const freshUnavailableDates = await getFreshUnavailableDates();
          const takenDates = dates.filter((date) =>
            freshUnavailableDates.includes(date),
          );

          if (takenDates.length > 0) {
            showPopup(
              "Date no longer available",
              `${tableName} was just booked for ${takenDates.join(", ")}. Please refresh the page and choose another date.`,
            );
            bookNowButton.disabled = false;
            return;
          }

          await clearCart();

          const items = dates.map((date) => ({
            id: Number(variantId),
            quantity: 1,
            properties: {
              Table: tableName,
              "Booking Date": date,
            },
          }));

          const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
          });

          if (!response.ok) {
            throw new Error(`Cart add failed: ${response.status}`);
          }

          window.location.href = "/checkout";
        } catch (error) {
          console.error("[booking] Book Now failed", error);
          showPopup(
            "Error",
            "Could not confirm this booking. Please refresh and try again.",
          );
          bookNowButton.disabled = false;
        }
      });
    }
  
  
  
    document.addEventListener(
  
      "submit",
  
      (event) => {
  
        const form =
  
          event.target.closest('form[data-type="add-to-cart-form"]') ||
  
          event.target.closest("product-form form");
  
  
  
        if (!form) return;
  
  
  
        const hasDates =
  
          dateInput1?.value || dateInput2?.value || dateInput3?.value;
  
  
  
        if (!hasDates) {
  
          event.preventDefault();
  
          event.stopPropagation();
  
          event.stopImmediatePropagation();
  
  
  
          showPopup(
  
            "No dates selected",
  
            "Please select at least one booking date.",
  
          );
  
        }
  
      },
  
      true,
  
    );
  
  
  
    // Buy Now / dynamic checkout can only add a single line item.
  
    // Booking dates must be added as separate lines via product-form.js.
  
  
  
    document.addEventListener(
  
      "click",
  
      (event) => {
  
        const buyNowButton = event.target.closest(
  
          ".shopify-payment-button__button",
  
        );
  
  
  
        if (!buyNowButton) return;
  
  
  
        event.preventDefault();
  
        event.stopPropagation();
  
        event.stopImmediatePropagation();
  
  
  
        showPopup(
  
          "Use Add to cart",
  
          "Please use Add to cart so each booking date is added as its own line item.",
  
        );
  
      },
  
      true,
  
    );
  
  
  
    if (!input) return;
  
  
  
    const today = new Date();
  
  
  
    today.setHours(0, 0, 0, 0);
  
  
  
    const currentDay = today.getDay();
  
  
  
      const nextMonday = new Date(today);
  
  
  
      if (currentDay === 0) {
  
      nextMonday.setDate(today.getDate() + 1);
  
      } else {
  
      nextMonday.setDate(today.getDate() + (8 - currentDay));
  
      }
  
  
  
      nextMonday.setHours(0, 0, 0, 0);
  
  
  
    const nextFriday = new Date(nextMonday);
  
  
  
    nextFriday.setDate(nextMonday.getDate() + 4);
  
  
  
    nextFriday.setHours(23, 59, 59, 999);
  
  
  
    function formatDate(date) {
  
      const year = date.getFullYear();
  
  
  
      const month = String(date.getMonth() + 1).padStart(2, "0");
  
  
  
      const day = String(date.getDate()).padStart(2, "0");
  
  
  
      return `${year}-${month}-${day}`;
  
    }
  
  
  
    const minDate = formatDate(nextMonday);
  
  
  
    const maxDate = formatDate(nextFriday);
  
  
  
    flatpickr(input, {
  
      inline: true,
  
  
  
      mode: "multiple",
  
  
  
      disable: [
  
        (date) => {
  
          const formattedDate = formatDate(date);
  
  
  
          return (
  
            unavailableDates.includes(formattedDate) ||
  
            formattedDate < minDate ||
  
            formattedDate > maxDate ||
  
            date.getDay() === 0 ||
  
            date.getDay() === 6
  
          );
  
        },
  
      ],
  
  
  
      onChange(selectedDates) {
  
        const totalDays = alreadyBookedDays + selectedDates.length;
  
  
  
        if (totalDays > MAX_BOOKING_DAYS) {
  
          selectedDates.pop();
  
  
  
          setTimeout(() => {
  
            this.setDate(selectedDates);
  
          });
  
  
  
          const remaining = Math.max(MAX_BOOKING_DAYS - alreadyBookedDays, 0);
  
  
  
          showPopup(
  
            "Booking limit reached",
  
  
  
            remaining === 0
  
              ? "You already reached your maximum of 3 booking days."
  
              : `You already have ${alreadyBookedDays} booked day(s). You can only select ${remaining} more day(s).`,
  
          );
  
  
  
          return;
  
        }
  
  
  
        const formattedDates = selectedDates.map(formatDate);
  
  
  
        selectedList.innerHTML = "";
  
  
  
        formattedDates.forEach((date) => {
  
          const li = document.createElement("li");
  
  
  
          li.textContent = date;
  
  
  
          selectedList.appendChild(li);
  
        });
  
  
  
        // Store each date separately as line item properties.
  
        // product-form.js reads these and adds one cart line per date.
  
  
  
        if (dateInput1) dateInput1.value = formattedDates[0] || "";
  
  
  
        if (dateInput2) dateInput2.value = formattedDates[1] || "";
  
  
  
        if (dateInput3) dateInput3.value = formattedDates[2] || "";
  
      },
  
    });
  
  });
