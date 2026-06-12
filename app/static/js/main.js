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

const modelSelect = document.getElementById("modelSelect");
const chatStatus = document.getElementById("chatStatus");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

let chatHistory = [];

function setChatStatus(message, isWarning = false) {
    chatStatus.textContent = message;
    chatStatus.classList.toggle("chat-warning", isWarning);
}

function appendChatMessage(role, content) {
    const messageCard = document.createElement("div");
    messageCard.className = `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;

    const speaker = document.createElement("strong");
    speaker.textContent = role === "user" ? "You" : "Maths assistant";

    const paragraph = document.createElement("p");
    paragraph.textContent = content;

    messageCard.appendChild(speaker);
    messageCard.appendChild(paragraph);
    chatMessages.appendChild(messageCard);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function resetChatMessages() {
    chatMessages.innerHTML = "";
    appendChatMessage(
        "assistant",
        "Ask me about choosing sine, cosine or tangent, finding the opposite side, or checking your working."
    );
}

async function loadOllamaModels() {
    try {
        const response = await fetch("/api/ollama-models");
        const data = await response.json();

        modelSelect.innerHTML = "";
        data.models.forEach((modelName) => {
            const option = document.createElement("option");
            option.value = modelName;
            option.textContent = modelName;
            if (modelName === data.default) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        if (data.source === "fallback") {
            setChatStatus(
                "Using fallback model choices. Start Ollama and pull a listed model before asking a question.",
                true
            );
        } else {
            setChatStatus(`Connected to local Ollama at ${data.ollama_base_url}.`);
        }
    } catch (error) {
        modelSelect.innerHTML = "<option value='llama3.2'>llama3.2</option>";
        setChatStatus("Unable to load local models. Check that the Flask app is running correctly.", true);
    }
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput.value.trim();
    const model = modelSelect.value;

    if (!message) {
        setChatStatus("Type a question before asking the model.", true);
        return;
    }

    appendChatMessage("user", message);
    chatHistory.push({ role: "user", content: message });
    chatInput.value = "";
    sendChatBtn.disabled = true;
    sendChatBtn.textContent = "Thinking...";
    setChatStatus(`Asking ${model}...`);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                message: "",
                messages: chatHistory.slice(-8)
            })
        });
        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || "Unable to get a model response.";
            appendChatMessage("assistant", errorMessage);
            setChatStatus(errorMessage, true);
            return;
        }

        appendChatMessage("assistant", data.reply);
        chatHistory.push({ role: "assistant", content: data.reply });
        chatHistory = chatHistory.slice(-8);
        setChatStatus(`Answered by ${data.model}.`);
    } catch (error) {
        const errorMessage = "Unable to contact the chat endpoint. Check the Flask server and try again.";
        appendChatMessage("assistant", errorMessage);
        setChatStatus(errorMessage, true);
    } finally {
        sendChatBtn.disabled = false;
        sendChatBtn.textContent = "Ask model";
    }
});

clearChatBtn.addEventListener("click", () => {
    chatHistory = [];
    resetChatMessages();
    setChatStatus("Chat cleared. Choose a model and ask a new question.");
});

loadOllamaModels();

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
