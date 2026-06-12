# KS4 Trigonometry Flask Learning App

A small structured Flask web learning application for a KS4 lesson on right-angled trigonometry.

## Lesson focus

**Lesson question:** Can we calculate the height of a building without climbing it?

**Learning objective:** Pupils will learn to choose and apply sine, cosine or tangent to find a missing side in a right-angled triangle.

## Features

- Interactive trigonometry height calculator.
- Timed GCSE-style independent practice question with answer checking.
- Local AI chat panel that lets the user choose an installed Ollama model for maths support.

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

## Optional: local Ollama chat setup

Install and start Ollama, then pull at least one local chat model:

```bash
ollama pull llama3.2
ollama pull gemma3:1b
ollama pull qwen2.5:3b
```

The app reads installed local models from:

```text
http://127.0.0.1:11434/api/tags
```

If your Ollama server uses another address, set `OLLAMA_BASE_URL` before running Flask:

```bash
export OLLAMA_BASE_URL=http://127.0.0.1:11434
python run.py
```

On Windows PowerShell:

```powershell
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
python run.py
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
