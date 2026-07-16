document.addEventListener("DOMContentLoaded", () => {

    const input = document.querySelector("#booking-date");
    const selectedList = document.querySelector("#selected-dates");
    const hiddenInput = document.querySelector("#booking-dates");
    const counter = document.querySelector("#date-counter");

    const popup = document.querySelector("#booking-popup");
    const closePopup = document.querySelector("#close-popup");


    closePopup.addEventListener("click", () => {

        popup.style.display = "none";

    });

    if (!input) return;

    const unavailableDates = window.bookingData?.unavailableDates || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextMonday = new Date(today);
    const currentDay = today.getDay();

    const daysUntilNextMonday =
        currentDay === 1 ? 7 : (8 - currentDay);

    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    nextMonday.setHours(0, 0, 0, 0);

    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    nextFriday.setHours(23, 59, 59, 999);

    const pad = (n) => String(n).padStart(2, "0");

    const formatDate = (date) => {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    flatpickr(input, {

        inline: true,
        mode: "multiple",

        disable: [

            function(date) {

                const formatted = formatDate(date);

                if (unavailableDates.includes(formatted)) {
                    return true;
                }

                if (date < nextMonday) {
                    return true;
                }

                if (date > nextFriday) {
                    return true;
                }

                if (date.getDay() === 0 || date.getDay() === 6) {
                    return true;
                }

                return false;
            }

        ],

        onChange: function(selectedDates) {

            if (selectedDates.length > 3) {

                selectedDates.pop();
                this.setDate(selectedDates);

                const popup = document.querySelector("#booking-popup");

                popup.style.display = "flex";

                return;
            }

            const formattedDates = selectedDates.map(formatDate);

            selectedList.innerHTML = "";

            formattedDates.forEach(date => {

                const li = document.createElement("li");
                li.textContent = date;

                selectedList.appendChild(li);

            });

            hiddenInput.value = formattedDates.join(",");

            if (counter) {
                counter.textContent = `${formattedDates.length}/3`;
            }

        }

    });

});
