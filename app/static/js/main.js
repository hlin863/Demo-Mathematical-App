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
        result.textContent = data.working;
    } catch (error) {
        result.textContent = "Unable to calculate. Please try again.";
    }
});

const practicePanel = document.getElementById("gcse-practice");
const timerDisplay = document.getElementById("practiceTimer");
const startPracticeBtn = document.getElementById("startPracticeBtn");
const practiceAnswer = document.getElementById("practiceAnswer");
const checkPracticeBtn = document.getElementById("checkPracticeBtn");
const showWorkingBtn = document.getElementById("showWorkingBtn");
const practiceFeedback = document.getElementById("practiceFeedback");
const practiceWorking = document.getElementById("practiceWorking");

const timeLimitMinutes = Number(practicePanel.dataset.timeLimit);
const timeLimitSeconds = timeLimitMinutes * 60;
let remainingSeconds = timeLimitSeconds;
let timerInterval = null;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function showPracticeFeedback(message, feedbackClass) {
    practiceFeedback.classList.remove("hidden", "correct-feedback", "retry-feedback");
    if (feedbackClass) {
        practiceFeedback.classList.add(feedbackClass);
    }
    practiceFeedback.textContent = message;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(Math.max(remainingSeconds, 0));
    timerDisplay.classList.toggle("timer-warning", remainingSeconds > 0 && remainingSeconds <= 60);
}

startPracticeBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    remainingSeconds = timeLimitSeconds;
    updateTimerDisplay();
    startPracticeBtn.textContent = "Restart timer";
    practiceAnswer.disabled = false;
    checkPracticeBtn.disabled = false;
    showWorkingBtn.disabled = false;
    practiceFeedback.classList.add("hidden");

    timerInterval = setInterval(() => {
        remainingSeconds -= 1;
        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            showPracticeFeedback(
                "Time is up. Check your answer now, then reveal the working if you need it.",
                "retry-feedback"
            );
        }
    }, 1000);
});

checkPracticeBtn.addEventListener("click", async () => {
    showPracticeFeedback("Checking...", "");

    try {
        const response = await fetch("/api/check-practice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer: practiceAnswer.value })
        });
        const data = await response.json();

        if (!response.ok) {
            showPracticeFeedback(data.error || "Unable to check that answer.", "retry-feedback");
            return;
        }

        const feedbackClass = data.correct ? "correct-feedback" : "retry-feedback";
        showPracticeFeedback(data.feedback, feedbackClass);
    } catch (error) {
        showPracticeFeedback("Unable to check the answer. Please try again.", "retry-feedback");
    }
});

showWorkingBtn.addEventListener("click", () => {
    const answer = practicePanel.dataset.answer;
    const unit = practicePanel.dataset.unit;
    const working = practiceWorking.content.textContent.trim();
    showPracticeFeedback(`Worked solution:\n${working}\nAnswer: ${answer} ${unit}`, "correct-feedback");
});
