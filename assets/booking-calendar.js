document.addEventListener("DOMContentLoaded", () => {

    const input = document.querySelector("#booking-date");
    const selectedList = document.querySelector("#selected-dates");
    const hiddenInput = document.querySelector("#booking-dates");
    const counter = document.querySelector("#date-counter");

    const popup = document.querySelector("#booking-popup");
    const popupTitle = document.querySelector("#popup-title");
    const popupMessage = document.querySelector("#popup-message");
    const closePopup = document.querySelector("#close-popup");


    function showPopup(title, message) {

        if (!popup) return;

        if (popupTitle) {
            popupTitle.textContent = title;
        }

        if (popupMessage) {
            popupMessage.textContent = message;
        }

        popup.style.display = "flex";

    }


    if (closePopup) {

        closePopup.addEventListener("click", () => {

            popup.style.display = "none";

        });

    }


    document.addEventListener(
        "submit",
        (event) => {

            const form = event.target.closest("product-form form");

            if (!form) return;


            if (!hiddenInput || !hiddenInput.value.trim()) {

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();


                showPopup(
                    "No dates selected",
                    "Please select at least one booking date before adding the table to your cart."
                );


                return false;

            }

        },
        true
    );


    document.addEventListener(
        "click",
        (event) => {

            const buyNowButton = event.target.closest(
                ".shopify-payment-button__button"
            );


            if (!buyNowButton) return;


            if (!hiddenInput || !hiddenInput.value.trim()) {

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();


                showPopup(
                    "No dates selected",
                    "Please select at least one booking date before continuing to checkout."
                );


                return false;

            }

        },
        true
    );


    if (!input) return;


    const unavailableDates =
        window.bookingData?.unavailableDates || [];


    const today = new Date();
    today.setHours(0, 0, 0, 0);


    const nextMonday = new Date(today);

    const currentDay = today.getDay();

    const daysUntilNextMonday =
        currentDay === 1 ? 7 : (8 - currentDay);


    nextMonday.setDate(
        today.getDate() + daysUntilNextMonday
    );

    nextMonday.setHours(0, 0, 0, 0);



    const nextFriday = new Date(nextMonday);

    nextFriday.setDate(
        nextMonday.getDate() + 4
    );

    nextFriday.setHours(23, 59, 59, 999);



    const pad = (number) =>
        String(number).padStart(2, "0");



    const formatDate = (date) => {

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    };


    flatpickr(input, {

        inline: true,

        mode: "multiple",


        disable: [

            (date) => {

                const formattedDate = formatDate(date);


                if (unavailableDates.includes(formattedDate)) {
                    return true;
                }


                if (date < nextMonday) {
                    return true;
                }


                if (date > nextFriday) {
                    return true;
                }


                if (
                    date.getDay() === 0 ||
                    date.getDay() === 6
                ) {
                    return true;
                }


                return false;

            }

        ],


        onChange(selectedDates) {


            if (selectedDates.length > 3) {

                selectedDates.pop();

                this.setDate(selectedDates);


                showPopup(
                    "Maximum dates reached",
                    "You can only select up to 3 booking days."
                );


                return;

            }


            const formattedDates =
                selectedDates.map(formatDate);



            if (selectedList) {

                selectedList.innerHTML = "";


                formattedDates.forEach((date) => {

                    const li = document.createElement("li");

                    li.textContent = date;

                    selectedList.appendChild(li);

                });

            }


            if (hiddenInput) {

                hiddenInput.value =
                    formattedDates.join(",");

            }


            if (counter) {

                counter.textContent =
                    `${formattedDates.length}/3`;

            }

        }

    });

});