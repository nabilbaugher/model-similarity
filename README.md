# Model Fingerprinting

Quick setup for testing model similarity and distillation detection.

## Setup

1. Add your OpenRouter API key:
```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

2. Start backend:
```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

3. Start frontend (in new terminal):
```bash
cd frontend
npm install
npm run dev
```

## Usage

Backend runs on http://localhost:8000
Frontend runs on http://localhost:5173

Generate responses via API:
```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a haiku about coding", "model": "anthropic/claude-3.5-sonnet"}'
```

Then use the frontend flashcard interface to guess which model generated each response.
