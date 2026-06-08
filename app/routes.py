import math

from flask import Blueprint, jsonify, render_template, request

from .data import GCSE_PRACTICE, LESSON_STEPS

main_bp = Blueprint("main", __name__)


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
