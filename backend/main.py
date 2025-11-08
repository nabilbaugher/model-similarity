from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import json
from pathlib import Path
from typing import List

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
PROMPTS_FILE = Path("prompts.json")
RESPONSES_FILE = DATA_DIR / "responses.json"

class GenerateRequest(BaseModel):
    prompt: str
    model: str

class BatchGenerateRequest(BaseModel):
    prompt_id: int
    models: List[str]

class Response(BaseModel):
    prompt: str
    model: str
    response: str

class Prompt(BaseModel):
    id: int
    text: str
    category: str

async def call_openrouter(prompt: str, model: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60.0
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

def load_prompts():
    with open(PROMPTS_FILE, "r") as f:
        return json.load(f)

def load_responses():
    if RESPONSES_FILE.exists():
        with open(RESPONSES_FILE, "r") as f:
            return json.load(f)
    return []

def save_response(prompt_id: int, prompt_text: str, model: str, response_text: str):
    responses = load_responses()
    response_obj = {
        "prompt_id": prompt_id,
        "prompt": prompt_text,
        "model": model,
        "response": response_text
    }
    responses.append(response_obj)
    with open(RESPONSES_FILE, "w") as f:
        json.dump(responses, f, indent=2)
    return response_obj

def get_cached_response(prompt_id: int, model: str):
    responses = load_responses()
    for resp in responses:
        if resp.get("prompt_id") == prompt_id and resp["model"] == model:
            return resp
    return None

@app.get("/prompts")
async def get_prompts():
    return load_prompts()

@app.post("/generate")
async def generate(req: GenerateRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    try:
        response_text = await call_openrouter(req.prompt, req.model)
        response_obj = {
            "prompt": req.prompt,
            "model": req.model,
            "response": response_text
        }
        return response_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-batch")
async def generate_batch(req: BatchGenerateRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    try:
        prompts = load_prompts()
        prompt = next((p for p in prompts if p["id"] == req.prompt_id), None)
        if not prompt:
            raise HTTPException(status_code=404, detail="Prompt not found")

        results = []
        for model in req.models:
            # Check cache first
            cached = get_cached_response(req.prompt_id, model)
            if cached:
                results.append({"model": model, "cached": True, "response": cached})
                continue

            # Generate new response
            response_text = await call_openrouter(prompt["text"], model)
            response_obj = save_response(req.prompt_id, prompt["text"], model, response_text)
            results.append({"model": model, "cached": False, "response": response_obj})

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/responses")
async def get_responses():
    return load_responses()

@app.delete("/responses/{prompt_id}")
async def delete_response(prompt_id: int, model: str):
    responses = load_responses()
    updated = [r for r in responses if not (r.get("prompt_id") == prompt_id and r["model"] == model)]

    if len(updated) == len(responses):
        raise HTTPException(status_code=404, detail="Response not found")

    with open(RESPONSES_FILE, "w") as f:
        json.dump(updated, f, indent=2)

    return {"deleted": True}
