# KS4 Trigonometry Flask Learning App

A small structured Flask web learning application for a KS4 lesson on right-angled trigonometry.

## Lesson focus

**Lesson question:** Can we calculate the height of a building without climbing it?

**Learning objective:** Pupils will learn to choose and apply sine, cosine or tangent to find a missing side in a right-angled triangle.

## Setup

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Then open:

```text
http://127.0.0.1:5000/
```

## Structure

```text
trig_flask_app/
├── app/
│   ├── __init__.py
│   ├── routes.py
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/styles.css
│       ├── js/main.js
│       └── img/trig_building_slide.png
├── requirements.txt
├── run.py
└── README.md
```
