const btn = document.getElementById("calculateBtn");
const result = document.getElementById("result");

btn.addEventListener("click", async () => {
    const distance = document.getElementById("distance").value;
    const angle = document.getElementById("angle").value;

    result.textContent = "Calculating...";

    try {
        const response = await fetch("/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ distance, angle })
        });
        const data = await response.json();
        if (!response.ok) {
            result.textContent = data.error || "Something went wrong.";
            return;
        }
        result.textContent = `${data.working}`;
    } catch (error) {
        result.textContent = "Unable to calculate. Please try again.";
    }
});
