GCSE_PRACTICE = {
    "id": "building_height_01",
    "title": "GCSE exam practice sprint",
    "time_limit_minutes": 8,
    "marks": 4,
    "tier": "Foundation / Higher bridge",
    "calculator": True,
    "teacher_note": "Set the timer, let pupils work independently, then use the feedback to check the answer and method.",
    "question": (
        "A student stands 18 m from the base of a tower on level ground. "
        "The angle of elevation to the top of the tower is 32 degrees. "
        "Calculate the height of the tower. Give your answer to 1 decimal place."
    ),
    "answer": 11.2,
    "tolerance": 0.05,
    "unit": "m",
    "working": (
        "tan(32 degrees) = h / 18\n"
        "h = 18 x tan(32 degrees)\n"
        "h = 11.247...\n"
        "h = 11.2 m to 1 decimal place"
    ),
}

LESSON_STEPS = [
    {
        "time": "0-5 min",
        "title": "Retrieval starter",
        "description": "Label hypotenuse, opposite and adjacent on right-angled triangles.",
        "teacher_move": "Check prior knowledge before using trigonometric ratios.",
    },
    {
        "time": "5-15 min",
        "title": "Concept introduction",
        "description": "Introduce angle of elevation and link tangent to opposite / adjacent.",
        "teacher_move": "Make the triangle visible before introducing formulae.",
    },
    {
        "time": "15-25 min",
        "title": "Worked example",
        "description": "Model the building problem: distance = 20 m, angle = 35 degrees, height = h.",
        "teacher_move": "Think aloud: label sides, choose ratio, substitute, calculate.",
    },
    {
        "time": "25-40 min",
        "title": "Guided GCSE practice",
        "description": "Pupils complete the timed exam-style question, then self-check the method.",
        "teacher_move": "Use the timer to create focus, then address common errors in side choice.",
    },
    {
        "time": "40-50 min",
        "title": "Pair application task",
        "description": "Estimate the height of a tree, wall or flagpole using a contextual problem.",
        "teacher_move": "Ask pupils to explain why their chosen ratio fits the problem.",
    },
    {
        "time": "50-60 min",
        "title": "Exit ticket",
        "description": "One calculation question and one reasoning question.",
        "teacher_move": "Assess procedural fluency and conceptual understanding.",
    },
]
