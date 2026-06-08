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

const practicePanel = document.getElementById("gcse-practice");
const timerDisplay = document.getElementById("practiceTimer");
const startPracticeBtn = document.getElementById("startPracticeBtn");

let timerInterval = null;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

startPracticeBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    remainingSeconds = minutes * 60;
    timerDisplay.textContent = formatTime(remainingSeconds);
    startPracticeBtn.textContent = "Restart timer";

    timerInterval = setInterval(() => {
        remainingSeconds -= 1;
        timerDisplay.textContent = formatTime(Math.max(remainingSeconds, 0));

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            practiceFeedback.classList.remove("hidden", "correct-feedback");
            practiceFeedback.classList.add("retry-feedback");
            practiceFeedback.textContent = "Time is up. Now check your method before revealing the working.";
        }
    }, 1000);
});

const response = await fetch("/api/check-practice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer: practiceAnswer.value })
});
