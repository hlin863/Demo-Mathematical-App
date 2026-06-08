from flask import Blueprint, render_template, request, jsonify
import math
from .data import GCSE_PRACTICE, LESSON_STEPS

main_bp = Blueprint("main", __name__)

LESSON_STEPS = [
    {
        "time": "0–5 min",
        "title": "Retrieval starter",
        "description": "Label hypotenuse, opposite and adjacent on right-angled triangles.",
        "teacher_move": "Check prior knowledge before using trigonometric ratios."
    },
    {
        "time": "5–15 min",
        "title": "Concept introduction",
        "description": "Introduce angle of elevation and link tangent to opposite ÷ adjacent.",
        "teacher_move": "Make the triangle visible before introducing formulae."
    },
    {
        "time": "15–25 min",
        "title": "Worked example",
        "description": "Model the building problem: distance = 20 m, angle = 35°, height = h.",
        "teacher_move": "Think aloud: label sides, choose ratio, substitute, calculate."
    },
    {
        "time": "40–50 min",
        "title": "Pair application task",
        "description": "Estimate the height of a tree, wall or flagpole using a contextual problem.",
        "teacher_move": "Ask pupils to explain why their chosen ratio fits the problem."
    },
    {
        "time": "50–60 min",
        "title": "Exit ticket",
        "description": "One calculation question and one reasoning question.",
        "teacher_move": "Assess procedural fluency and conceptual understanding."
    }
]

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
            return jsonify({"error": "Angle must be between 0° and 90°."}), 400
        height = distance * math.tan(math.radians(angle))
        return jsonify({
            "height": round(height, 2),
            "working": f"h = {distance:g} × tan({angle:g}°) = {height:.2f} m"
        })
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
    is_correct = abs(pupil_answer - expected) <= tolerance
