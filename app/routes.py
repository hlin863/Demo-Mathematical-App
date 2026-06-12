import json
import math
import os
import urllib.error
import urllib.request

from flask import Blueprint, jsonify, render_template, request

from .data import GCSE_PRACTICE, LESSON_STEPS

main_bp = Blueprint("main", __name__)

DEFAULT_OLLAMA_MODELS = [
    "llama3.2",
    "gemma3:1b",
    "qwen2.5:3b",
    "deepseek-r1:1.5b",
    "tinyllama",
]

MATHS_CHAT_SYSTEM_PROMPT = """
You are a supportive KS4 mathematics teaching assistant for a right-angled trigonometry lesson.
Help pupils understand sine, cosine and tangent without simply doing every step for them first.
Use clear British English, short explanations, and GCSE-friendly working.
When a pupil asks for an answer, explain the method and include the final answer with units where possible.
""".strip()


def get_ollama_base_url():
    """Return the local Ollama server URL, allowing override for different setups."""
    return os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")


def call_ollama(path, payload=None, method="GET", timeout=60):
    """Call the local Ollama HTTP API using only the Python standard library."""
    url = f"{get_ollama_base_url()}{path}"
    body = None
    headers = {"Content-Type": "application/json"}

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    api_request = urllib.request.Request(url, data=body, headers=headers, method=method)

    with urllib.request.urlopen(api_request, timeout=timeout) as response:
        response_body = response.read().decode("utf-8")
        return json.loads(response_body) if response_body else {}


def get_available_ollama_models():
    """Read installed Ollama models, falling back to common local model names."""
    try:
        data = call_ollama("/api/tags", timeout=5)
        models = sorted(
            model.get("name")
            for model in data.get("models", [])
            if model.get("name")
        )
        if models:
            return models, "ollama"
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError):
        pass

    return DEFAULT_OLLAMA_MODELS, "fallback"


@main_bp.route("/")
def index():
    return render_template(
        "index.html",
        lesson_steps=LESSON_STEPS,
        practice=GCSE_PRACTICE,
    )


@main_bp.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True) or {}
    try:
        distance = float(data.get("distance", 20))
        angle = float(data.get("angle", 35))
        if distance <= 0:
            return jsonify({"error": "Distance must be greater than 0."}), 400
        if angle <= 0 or angle >= 90:
            return jsonify({"error": "Angle must be between 0 and 90 degrees."}), 400
        height = distance * math.tan(math.radians(angle))
        return jsonify(
            {
                "height": round(height, 2),
                "working": f"h = {distance:g} x tan({angle:g} degrees) = {height:.2f} m",
            }
        )
    except (TypeError, ValueError):
        return jsonify({"error": "Please enter valid numbers."}), 400


@main_bp.route("/api/check-practice", methods=["POST"])
def check_practice():
    """Check the GCSE-style answer with a small tolerance for rounding."""
    data = request.get_json(silent=True) or {}

    try:
        pupil_answer = float(data.get("answer"))
    except (TypeError, ValueError):
        return jsonify({"error": "Please enter a numerical answer."}), 400

    expected = float(GCSE_PRACTICE["answer"])
    tolerance = float(GCSE_PRACTICE["tolerance"])
    unit = GCSE_PRACTICE["unit"]
    is_correct = abs(pupil_answer - expected) <= tolerance + 1e-9

    if is_correct:
        feedback = (
            f"Correct. {pupil_answer:g} {unit} is within the accepted rounding range "
            f"for {expected:.1f} {unit}."
        )
    else:
        feedback = (
            "Not quite. Check that the tower height is the opposite side, "
            "18 m is the adjacent side, and tangent is the matching ratio."
        )

    return jsonify(
        {
            "correct": is_correct,
            "feedback": feedback,
            "expected": expected,
            "tolerance": tolerance,
            "unit": unit,
            "working": GCSE_PRACTICE["working"],
        }
    )


@main_bp.route("/api/ollama-models")
def ollama_models():
    """Return locally installed Ollama models, or sensible defaults if Ollama is offline."""
    models, source = get_available_ollama_models()
    return jsonify(
        {
            "models": models,
            "default": models[0] if models else "",
            "source": source,
            "ollama_base_url": get_ollama_base_url(),
        }
    )


@main_bp.route("/api/chat", methods=["POST"])
def chat():
    """Send a pupil question to the selected local Ollama chat model."""
    data = request.get_json(silent=True) or {}
    model = str(data.get("model", "")).strip()
    message = str(data.get("message", "")).strip()
    submitted_history = data.get("messages", [])

    available_models, _ = get_available_ollama_models()
    if not model:
        model = available_models[0]

    if model not in available_models:
        return jsonify(
            {
                "error": (
                    f"'{model}' is not currently available. Select one of: "
                    f"{', '.join(available_models)}."
                )
            }
        ), 400

    conversation = []
    if isinstance(submitted_history, list):
        for item in submitted_history[-8:]:
            role = item.get("role") if isinstance(item, dict) else None
            content = item.get("content") if isinstance(item, dict) else None
            if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
                conversation.append({"role": role, "content": content.strip()})

    if message:
        conversation.append({"role": "user", "content": message})

    if not conversation or conversation[-1]["role"] != "user":
        return jsonify({"error": "Please type a question for the maths assistant."}), 400

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": MATHS_CHAT_SYSTEM_PROMPT},
            *conversation,
        ],
        "stream": False,
        "options": {
            "temperature": 0.3,
        },
    }

    try:
        data = call_ollama("/api/chat", payload=payload, method="POST", timeout=90)
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
        return jsonify(
            {
                "error": (
                    "Unable to reach Ollama. Make sure Ollama is running locally, "
                    f"the selected model is pulled, and {get_ollama_base_url()} is accessible."
                ),
                "details": str(exc),
            }
        ), 503

    reply = data.get("message", {}).get("content", "").strip()
    if not reply:
        reply = "The model responded, but no answer text was returned."

    return jsonify({"reply": reply, "model": model})
