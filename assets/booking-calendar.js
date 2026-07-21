document.addEventListener("DOMContentLoaded", () => {

    const input = document.querySelector("#booking-date");

    const selectedList = document.querySelector("#selected-dates");

    const tableInput = document.querySelector("#booking-table");


    const popup = document.querySelector("#booking-popup");
    const popupTitle = document.querySelector("#popup-title");
    const popupMessage = document.querySelector("#popup-message");
    const closePopup = document.querySelector("#close-popup");



    const tableName =
        window.bookingData?.tableName || "Selected Table";


    const unavailableDates =
        window.bookingData?.unavailableDates || [];


    const alreadyBookedDays =
        Number(window.customerBookingData?.bookedDays || 0);


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



    if (tableInput) {

        tableInput.value = tableName;

    }



    if (!input) return;



    const today = new Date();

    today.setHours(0,0,0,0);



    const nextMonday = new Date(today);

    const currentDay = today.getDay();


    nextMonday.setDate(
        today.getDate() +
        (currentDay === 1 ? 7 : 8 - currentDay)
    );


    nextMonday.setHours(0,0,0,0);



    const nextFriday = new Date(nextMonday);


    nextFriday.setDate(
        nextMonday.getDate() + 4
    );


    nextFriday.setHours(23,59,59,999);





    function formatDate(date) {

        const year = date.getFullYear();

        const month =
            String(date.getMonth() + 1)
            .padStart(2,"0");

        const day =
            String(date.getDate())
            .padStart(2,"0");


        return `${year}-${month}-${day}`;

    }




    const minDate = formatDate(nextMonday);

    const maxDate = formatDate(nextFriday);





    flatpickr(input, {

        inline: true,

        mode: "multiple",


        disable: [

            (date) => {

                const formattedDate =
                    formatDate(date);


                return (

                    unavailableDates.includes(formattedDate)

                    ||

                    formattedDate < minDate

                    ||

                    formattedDate > maxDate

                    ||

                    date.getDay() === 0

                    ||

                    date.getDay() === 6

                );

            }

        ],



        onChange(selectedDates) {


            const totalDays =
                alreadyBookedDays +
                selectedDates.length;



            if (totalDays > MAX_BOOKING_DAYS) {


                selectedDates.pop();


                setTimeout(() => {

                    this.setDate(selectedDates);

                });



                const remaining =
                    Math.max(
                        MAX_BOOKING_DAYS - alreadyBookedDays,
                        0
                    );



                showPopup(
                    "Booking limit reached",

                    remaining === 0

                    ?

                    "You already reached your maximum of 3 booking days."

                    :

                    `You already have ${alreadyBookedDays} booked day(s). You can only select ${remaining} more day(s).`

                );


                return;

            }




            const formattedDates =
                selectedDates.map(formatDate);



            selectedList.innerHTML = "";



            formattedDates.forEach(date => {

                const li =
                    document.createElement("li");


                li.textContent = date;


                selectedList.appendChild(li);

            });



            // product-form.js will create separate cart lines
            window.selectedBookingDates = formattedDates;


        }

    });


});