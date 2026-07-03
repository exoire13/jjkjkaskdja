const slots = document.querySelectorAll(".time-slot");
const hiddenInput = document.getElementById("selectedTime");
const dateInput = document.getElementById("selectedDate");
const form = document.getElementById("bookingForm");
const toast = document.getElementById("toast");

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxV8fF95kT9jf4aXZ3pQHw9EkS92j2AQZQvwfRknH7NFsI-zyvzruGGg-k3OQd9rq7D6A/exec";

let bookings = {};
let isSubmitting = false;

// ----------------------
// TOAST
// ----------------------
function showToast(msg) {
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

// ----------------------
// LOAD BOOKINGS
// ----------------------
async function loadBookings() {
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();

        bookings = data.bookings || {};
        updateSlots();

    } catch (err) {
        console.error(err);
        showToast("Failed to load bookings");
    }
}

// auto refresh
setInterval(loadBookings, 10000);

// ----------------------
// UPDATE SLOTS
// ----------------------
function updateSlots() {
    const selectedDate = dateInput.value;
    const booked = bookings[selectedDate] || [];

    slots.forEach(slot => {
        const time = slot.dataset.time;

        slot.classList.remove("reserved", "active");
        slot.disabled = false;

        if (booked.includes(time)) {
            slot.classList.add("reserved");
            slot.innerText = `${time} (Booked)`;
        } else {
            slot.innerText = time;
        }
    });
}

// ----------------------
// DATE CHANGE
// ----------------------
dateInput.addEventListener("change", () => {
    hiddenInput.value = "";
    updateSlots();
});

// ----------------------
// SLOT CLICK
// ----------------------
slots.forEach(slot => {
    slot.addEventListener("click", () => {

        if (slot.classList.contains("reserved")) {
            showToast("Already booked");
            return;
        }

        slots.forEach(s => s.classList.remove("active"));

        slot.classList.add("active");
        hiddenInput.value = slot.dataset.time;
    });
});

// ----------------------
// BOOKING SUBMIT
// ----------------------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const date = dateInput.value;
    const time = hiddenInput.value;

    const name = form.querySelector("input[type='text']").value.trim();
    const email = form.querySelector("input[type='email']").value.trim();
    const phone = form.querySelector("input[type='tel']").value.trim();
    const cage = form.querySelector("select").value;
    const notes = form.querySelector("textarea")?.value || "";

    try {
        const res = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date,
                time,
                name,
                email,
                phone,
                cage,
                notes
            })
        });

        const data = await res.json();

        showToast(data.message || "Done");

        if (data.success) {
            form.reset();
            hiddenInput.value = "";
            await loadBookings();
        }

    } catch (err) {
        console.error(err);
        showToast("Booking failed");
    }

    isSubmitting = false;
});

// ----------------------
// SEARCH BOOKINGS
// ----------------------
if (searchBtn) {
    searchBtn.addEventListener("click", async () => {

        const query = searchInput.value.trim();

        if (!query) {
            showToast("Enter email or phone");
            return;
        }

        try {
            const res = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "search",
                    query
                })
            });

            const data = await res.json();

            resultsDiv.innerHTML = "";

            if (!data.results || data.results.length === 0) {
                resultsDiv.innerHTML = "<p>No bookings found</p>";
                return;
            }

            data.results.forEach(b => {

                const div = document.createElement("div");

                div.innerHTML = `
                    <p>${b.date} at ${b.time}</p>
                    <button class="cancel-btn">Cancel</button>
                `;

                div.querySelector(".cancel-btn").addEventListener("click", async () => {

                    await fetch(SCRIPT_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            action: "cancel",
                            key: b.key
                        })
                    });

                    showToast("Cancelled");

                    searchBtn.click();
                    loadBookings();
                });

                resultsDiv.appendChild(div);
            });

        } catch (err) {
            console.error(err);
            showToast("Search failed");
        }
    });
}

// ----------------------
window.addEventListener("load", loadBookings);