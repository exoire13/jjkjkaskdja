
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxV8fF95kT9jf4aXZ3pQHw9EkS92j2AQZQvwfRknH7NFsI-zyvzruGGg-k3OQd9rq7D6A/exec";

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("contactForm");

  if (!form) return;

  // =========================
  // LISTENER (THIS IS THE IMPORTANT PART)
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🚨 prevent double / spam submits
    if (form.dataset.sent === "true") return;
    form.dataset.sent = "true";

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;

    try {

      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({
          action: "contact",
          name,
          email,
          subject,
          message
        })
      });

      const data = await res.json();

      console.log("Server response:", data);

      if (data.success) {
        alert("Message sent successfully!");
        form.reset();
      } else {
        alert("Failed: " + data.message);
      }

    } catch (err) {
      console.log("Error:", err);
      alert("Something went wrong sending message.");
    }

    // allow future submissions after 3 seconds
    setTimeout(() => {
      form.dataset.sent = "false";
    }, 3000);

  });

});