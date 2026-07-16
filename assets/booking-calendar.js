document.addEventListener('DOMContentLoaded', () => {

    const input = document.querySelector("#booking-date");
    const selectedList = document.querySelector("#selected-dates");
    const hiddenInput = document.querySelector("#booking-dates");

    if (!input) return;


    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const nextMonday = new Date(today);

    const day = today.getDay();

    const daysUntilNextMonday = day === 1 ? 7 : (8 - day);

    nextMonday.setDate(
        today.getDate() + daysUntilNextMonday
    );


    const nextFriday = new Date(nextMonday);

    nextFriday.setDate(
        nextMonday.getDate() + 4
    );

    nextFriday.setHours(23, 59, 59, 999);


    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };


    flatpickr(input, {

        inline: true,

        mode: "multiple",


        disable: [

            function(date) {

                date.setHours(0, 0, 0, 0);

                // Disable before next Monday
                if (date < nextMonday) {
                    return true;
                }


                // Disable after next Friday
                if (date > nextFriday) {
                    return true;
                }


                // Disable Saturday and Sunday
                if (
                    date.getDay() === 0 ||
                    date.getDay() === 6
                ) {
                    return true;
                }


                return false;

            }

        ],


        onChange: function(selectedDates) {


            if (selectedDates.length > 3) {

                selectedDates.pop();

                this.setDate(selectedDates);

                alert(
                    "You can only select up to 3 dates."
                );

            }


            const formattedDates =
                selectedDates.map(date =>
                    formatDate(date)
                );


            selectedList.innerHTML = "";


            formattedDates.forEach(date => {

                const li =
                    document.createElement("li");

                li.textContent = date;

                selectedList.appendChild(li);

            });


            hiddenInput.value =
                formattedDates.join(",");

        }

    });

});