document.addEventListener("DOMContentLoaded", () => {


    const input = document.querySelector("#booking-date");

    const selectedList =
        document.querySelector("#selected-dates");

    const tableInput =
        document.querySelector("#booking-table");

    const hiddenInput =
        document.querySelector("#booking-dates");

    const bookingDetails =
        document.querySelector("#booking-details");


    const popup =
        document.querySelector("#booking-popup");

    const popupTitle =
        document.querySelector("#popup-title");

    const popupMessage =
        document.querySelector("#popup-message");

    const closePopup =
        document.querySelector("#close-popup");



    const tableName =
        window.bookingData?.tableName || "Selected Table";


    const unavailableDates =
        window.bookingData?.unavailableDates || [];



    const alreadyBookedDays =
        Number(
            window.customerBookingData?.bookedDays || 0
        );


    const MAX_BOOKING_DAYS = 3;



    function showPopup(title, message) {

        if (!popup) return;


        popupTitle.textContent = title;

        popupMessage.textContent = message;

        popup.style.display = "flex";

    }



    if(closePopup){

        closePopup.addEventListener(
            "click",
            () => {

                popup.style.display = "none";

            }
        );

    }




    function moveBookingFieldsIntoForm(){


        const addToCartForm =
            document.querySelector(
                'form[data-type="add-to-cart-form"]'
            );


        if(!addToCartForm) return;



        [
            tableInput,
            hiddenInput,
            bookingDetails

        ].forEach(field => {


            if(field && !addToCartForm.contains(field)){

                addToCartForm.appendChild(field);

            }

        });



        if(tableInput){

            tableInput.value = tableName;

        }

    }



    moveBookingFieldsIntoForm();





    document.addEventListener(
        "submit",
        (event)=>{


            const form =
            event.target.closest(
                'form[data-type="add-to-cart-form"]'
            )
            ||
            event.target.closest(
                "product-form form"
            );



            if(!form) return;



            if(!hiddenInput.value.trim()){


                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();



                showPopup(
                    "No dates selected",
                    "Please select at least one booking date."
                );

            }


        },
        true
    );






    if(!input) return;




    const today = new Date();

    today.setHours(0,0,0,0);




    const nextMonday = new Date(today);

    const day =
        today.getDay();



    nextMonday.setDate(
        today.getDate()
        +
        (day === 1 ? 7 : 8 - day)
    );


    nextMonday.setHours(0,0,0,0);




    const nextFriday = new Date(nextMonday);


    nextFriday.setDate(
        nextMonday.getDate()+4
    );


    nextFriday.setHours(
        23,
        59,
        59,
        999
    );





    function formatDate(date){


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth()+1
            )
            .padStart(2,"0");



        const day =
            String(
                date.getDate()
            )
            .padStart(2,"0");



        return `${year}-${month}-${day}`;

    }







    flatpickr(input, {


        inline:true,


        mode:"multiple",



        disable:[


            (date)=>{


                const formattedDate =
                    formatDate(date);



                return (

                    unavailableDates.includes(
                        formattedDate
                    )

                    ||

                    date < nextMonday

                    ||

                    date > nextFriday

                    ||

                    date.getDay() === 0

                    ||

                    date.getDay() === 6

                );

            }


        ],





        onChange(selectedDates){



            const totalDays =

                alreadyBookedDays
                +
                selectedDates.length;



            if(totalDays > MAX_BOOKING_DAYS){



                selectedDates.pop();



                this.setDate(
                    selectedDates
                );



                const remaining =

                    MAX_BOOKING_DAYS
                    -
                    alreadyBookedDays;



                showPopup(

                    "Booking limit reached",

                    `You already have ${alreadyBookedDays} booked day(s). You can only select ${remaining} more day(s).`

                );


                return;

            }





            const formattedDates =

                selectedDates.map(
                    formatDate
                );





            selectedList.innerHTML="";





            formattedDates.forEach(date=>{


                const li =
                    document.createElement("li");


                li.textContent=date;


                selectedList.appendChild(li);


            });





            hiddenInput.value =

                formattedDates.join(",");





            bookingDetails.value =

            `Table: ${tableName} | Dates: ${formattedDates.join(", ")}`;



        }


    });



});