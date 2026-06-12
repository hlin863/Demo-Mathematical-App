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
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const chatTitleInput = document.getElementById("chatTitleInput");
const chatUpdatedAt = document.getElementById("chatUpdatedAt");

const CHAT_STORAGE_KEY = "ks4_trigonometry_ollama_chats_v1";
const DEFAULT_CHAT_TITLE = "New chat";
const DEFAULT_ASSISTANT_GREETING = "Ask me about choosing sine, cosine or tangent, finding the opposite side, or checking your working.";

let chats = [];
let activeChatId = null;
let titleModel = "llama3.2";

function createChatId() {
    return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function currentTimestamp() {
    return new Date().toISOString();
}

function formatChatTime(isoTimestamp) {
    if (!isoTimestamp) {
        return "No update time";
    }

    const date = new Date(isoTimestamp);
    if (Number.isNaN(date.getTime())) {
        return "No update time";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function setChatStatus(message, isWarning = false) {
    chatStatus.textContent = message;
    chatStatus.classList.toggle("chat-warning", isWarning);
}

function getChatById(chatId) {
    return chats.find((chat) => chat.id === chatId) || null;
}

function getActiveChat() {
    return getChatById(activeChatId);
}

function createEmptyChat(title = DEFAULT_CHAT_TITLE) {
    const timestamp = currentTimestamp();
    return {
        id: createChatId(),
        title,
        messages: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        model: modelSelect.value || "",
        titleGenerated: false,
        titleEdited: false
    };
}

function normaliseChat(rawChat) {
    const timestamp = currentTimestamp();
    return {
        id: typeof rawChat.id === "string" ? rawChat.id : createChatId(),
        title: typeof rawChat.title === "string" && rawChat.title.trim() ? rawChat.title.trim() : DEFAULT_CHAT_TITLE,
        messages: Array.isArray(rawChat.messages)
            ? rawChat.messages.filter((message) => (
                message
                && ["user", "assistant"].includes(message.role)
                && typeof message.content === "string"
                && message.content.trim()
            ))
            : [],
        createdAt: rawChat.createdAt || timestamp,
        updatedAt: rawChat.updatedAt || rawChat.createdAt || timestamp,
        model: rawChat.model || "",
        titleGenerated: Boolean(rawChat.titleGenerated),
        titleEdited: Boolean(rawChat.titleEdited)
    };
}

function saveChats() {
    try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ chats, activeChatId }));
    } catch (error) {
        setChatStatus("Unable to save chat history in this browser.", true);
    }
}

function loadChats() {
    try {
        const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "{}");
        chats = Array.isArray(saved.chats) ? saved.chats.map(normaliseChat) : [];
        activeChatId = saved.activeChatId || null;
    } catch (error) {
        chats = [];
        activeChatId = null;
    }

    if (!chats.length) {
        const firstChat = createEmptyChat();
        chats = [firstChat];
        activeChatId = firstChat.id;
        saveChats();
    }

    if (!getActiveChat()) {
        activeChatId = getSortedChats()[0].id;
        saveChats();
    }
}

function getSortedChats() {
    return [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function renderChatList() {
    chatList.innerHTML = "";

    getSortedChats().forEach((chat) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `chat-list-item ${chat.id === activeChatId ? "active-chat" : ""}`;
        item.addEventListener("click", () => selectChat(chat.id));

        const title = document.createElement("strong");
        title.textContent = chat.title || DEFAULT_CHAT_TITLE;

        const meta = document.createElement("span");
        meta.textContent = formatChatTime(chat.updatedAt);

        const count = document.createElement("small");
        const userMessageCount = chat.messages.filter((message) => message.role === "user").length;
        count.textContent = `${userMessageCount} question${userMessageCount === 1 ? "" : "s"}`;

        item.appendChild(title);
        item.appendChild(meta);
        item.appendChild(count);
        chatList.appendChild(item);
    });
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

function renderActiveChat() {
    const chat = getActiveChat();
    if (!chat) {
        return;
    }

    chatTitleInput.value = chat.title || DEFAULT_CHAT_TITLE;
    chatUpdatedAt.textContent = `Latest update: ${formatChatTime(chat.updatedAt)}`;

    if (chat.model && [...modelSelect.options].some((option) => option.value === chat.model)) {
        modelSelect.value = chat.model;
    }

    chatMessages.innerHTML = "";
    if (!chat.messages.length) {
        appendChatMessage("assistant", DEFAULT_ASSISTANT_GREETING);
    } else {
        chat.messages.forEach((message) => appendChatMessage(message.role, message.content));
    }

    renderChatList();
}

function selectChat(chatId) {
    activeChatId = chatId;
    saveChats();
    renderActiveChat();
}

function startNewChat() {
    const chat = createEmptyChat();
    chats.push(chat);
    activeChatId = chat.id;
    saveChats();
    renderActiveChat();
    setChatStatus("Started a new chat. The first question will be named by llama3.2.");
}

function addMessageToChat(chatId, role, content) {
    const chat = getChatById(chatId);
    if (!chat) {
        return null;
    }

    chat.messages.push({ role, content });
    chat.updatedAt = currentTimestamp();
    saveChats();

    if (chatId === activeChatId) {
        renderActiveChat();
    } else {
        renderChatList();
    }

    return chat;
}

function fallbackTitleFromMessage(message) {
    const words = message.match(/[A-Za-z0-9]+/g) || [];
    if (!words.length) {
        return "New Maths Chat";
    }

    return words.slice(0, 5).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ").slice(0, 60);
}

async function generateChatTitleIfNeeded(chatId, firstMessage) {
    const chat = getChatById(chatId);
    if (!chat || chat.titleGenerated || chat.titleEdited) {
        return;
    }

    setChatStatus(`Naming this chat with ${titleModel}...`);

    try {
        const response = await fetch("/api/chat-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: firstMessage })
        });
        const data = await response.json();
        const liveChat = getChatById(chatId);

        if (!liveChat || liveChat.titleEdited) {
            return;
        }

        liveChat.title = data.title || fallbackTitleFromMessage(firstMessage);
        liveChat.titleGenerated = true;
        liveChat.updatedAt = currentTimestamp();
        saveChats();

        if (activeChatId === chatId) {
            renderActiveChat();
        } else {
            renderChatList();
        }

        if (data.source === "fallback") {
            setChatStatus("Chat name created with fallback naming because llama3.2 was not available.", true);
        } else {
            setChatStatus(`Chat name generated by ${data.source}.`);
        }
    } catch (error) {
        const liveChat = getChatById(chatId);
        if (!liveChat || liveChat.titleEdited) {
            return;
        }

        liveChat.title = fallbackTitleFromMessage(firstMessage);
        liveChat.titleGenerated = true;
        liveChat.updatedAt = currentTimestamp();
        saveChats();

        if (activeChatId === chatId) {
            renderActiveChat();
        } else {
            renderChatList();
        }

        setChatStatus("Chat name created with fallback naming.", true);
    }
}

async function loadOllamaModels() {
    try {
        const response = await fetch("/api/ollama-models");
        const data = await response.json();
        titleModel = data.title_model || "llama3.2";

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

        const chat = getActiveChat();
        if (chat && chat.model && [...modelSelect.options].some((option) => option.value === chat.model)) {
            modelSelect.value = chat.model;
        }

        if (data.source === "fallback") {
            setChatStatus(
                "Using fallback model choices. Start Ollama and pull a listed model before asking a question.",
                true
            );
        } else {
            setChatStatus(`Connected to local Ollama at ${data.ollama_base_url}. Titles use ${titleModel}.`);
        }
    } catch (error) {
        modelSelect.innerHTML = "<option value='llama3.2'>llama3.2</option>";
        setChatStatus("Unable to load local models. Check that the Flask app is running correctly.", true);
    }

    renderActiveChat();
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = chatInput.value.trim();
    const model = modelSelect.value;

    if (!message) {
        setChatStatus("Type a question before asking the model.", true);
        return;
    }

    let chat = getActiveChat();
    if (!chat) {
        startNewChat();
        chat = getActiveChat();
    }

    const sendingChatId = chat.id;
    const isFirstUserMessage = chat.messages.every((item) => item.role !== "user");

    chat.model = model;
    addMessageToChat(sendingChatId, "user", message);

    if (isFirstUserMessage) {
        generateChatTitleIfNeeded(sendingChatId, message);
    }

    chatInput.value = "";
    sendChatBtn.disabled = true;
    sendChatBtn.textContent = "Thinking...";
    setChatStatus(`Asking ${model}...`);

    try {
        const currentChat = getChatById(sendingChatId);
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                message: "",
                messages: currentChat.messages.slice(-8)
            })
        });
        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || "Unable to get a model response.";
            addMessageToChat(sendingChatId, "assistant", errorMessage);
            setChatStatus(errorMessage, true);
            return;
        }

        addMessageToChat(sendingChatId, "assistant", data.reply);
        const answeredChat = getChatById(sendingChatId);
        if (answeredChat) {
            answeredChat.model = data.model;
            saveChats();
            renderChatList();
        }
        setChatStatus(`Answered by ${data.model}.`);
    } catch (error) {
        const errorMessage = "Unable to contact the chat endpoint. Check the Flask server and try again.";
        addMessageToChat(sendingChatId, "assistant", errorMessage);
        setChatStatus(errorMessage, true);
    } finally {
        sendChatBtn.disabled = false;
        sendChatBtn.textContent = "Ask model";
    }
});

chatTitleInput.addEventListener("input", () => {
    const chat = getActiveChat();
    if (!chat) {
        return;
    }

    chat.title = chatTitleInput.value.trim() || DEFAULT_CHAT_TITLE;
    chat.titleEdited = true;
    chat.updatedAt = currentTimestamp();
    saveChats();
    renderChatList();
    chatUpdatedAt.textContent = `Latest update: ${formatChatTime(chat.updatedAt)}`;
});

modelSelect.addEventListener("change", () => {
    const chat = getActiveChat();
    if (!chat) {
        return;
    }

    chat.model = modelSelect.value;
    chat.updatedAt = currentTimestamp();
    saveChats();
    renderChatList();
    chatUpdatedAt.textContent = `Latest update: ${formatChatTime(chat.updatedAt)}`;
});

clearChatBtn.addEventListener("click", () => {
    const chat = getActiveChat();
    if (!chat) {
        return;
    }

    chat.messages = [];
    chat.title = DEFAULT_CHAT_TITLE;
    chat.titleGenerated = false;
    chat.titleEdited = false;
    chat.updatedAt = currentTimestamp();
    saveChats();
    renderActiveChat();
    setChatStatus("This chat was cleared. The next first question will generate a new name.");
});

newChatBtn.addEventListener("click", startNewChat);

loadChats();
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
