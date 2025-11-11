from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import json
from pathlib import Path
from typing import List, Optional, Dict
import numpy as np
from collections import defaultdict
from settings import MODELS, EMBEDDING_MODEL
import hashlib

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
PROMPTS_FILE = Path("prompts.json")
RESPONSES_FILE = DATA_DIR / "responses.json"
EMBEDDINGS_CACHE_FILE = DATA_DIR / "embeddings_cache.json"

class GenerateRequest(BaseModel):
    prompt: str
    model: str

class BatchGenerateRequest(BaseModel):
    prompt_id: int
    models: List[str]

class BatchGenerateMultipleRequest(BaseModel):
    prompt_ids: List[int]
    models: List[str]

class Response(BaseModel):
    prompt: str
    model: str
    response: str

class Prompt(BaseModel):
    id: int
    text: str
    category: str

class EmbeddingRequest(BaseModel):
    models: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    center_by_prompt: bool = True

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

def load_embeddings_cache() -> Dict:
    """Load the embeddings cache from disk."""
    if EMBEDDINGS_CACHE_FILE.exists():
        with open(EMBEDDINGS_CACHE_FILE, "r") as f:
            cache = json.load(f)
            # Invalidate cache if embedding model changed
            if cache.get("embedding_model") != EMBEDDING_MODEL:
                return {
                    "cache_version": "1",
                    "embedding_model": EMBEDDING_MODEL,
                    "embeddings": {}
                }
            return cache
    return {
        "cache_version": "1",
        "embedding_model": EMBEDDING_MODEL,
        "embeddings": {}
    }

def save_embeddings_cache(cache: Dict):
    """Save the embeddings cache to disk."""
    with open(EMBEDDINGS_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def get_response_hash(response_text: str) -> str:
    """Generate a hash for a response text to use as cache key."""
    return hashlib.sha256(response_text.encode('utf-8')).hexdigest()

def get_cached_embeddings(texts: List[str]) -> tuple[np.ndarray, List[int]]:
    """
    Get embeddings from cache. Returns embeddings array and list of indices that need computation.

    Returns:
        (embeddings, uncached_indices) where embeddings has None for uncached items
    """
    cache = load_embeddings_cache()
    embeddings = [None] * len(texts)
    uncached_indices = []

    for i, text in enumerate(texts):
        text_hash = get_response_hash(text)
        if text_hash in cache["embeddings"]:
            embeddings[i] = np.array(cache["embeddings"][text_hash])
        else:
            uncached_indices.append(i)

    return embeddings, uncached_indices

def save_embeddings_to_cache(texts: List[str], embeddings: np.ndarray):
    """Save computed embeddings to cache."""
    cache = load_embeddings_cache()

    for text, embedding in zip(texts, embeddings):
        text_hash = get_response_hash(text)
        cache["embeddings"][text_hash] = embedding.tolist()

    save_embeddings_cache(cache)

@app.get("/config")
async def get_config():
    """Get application configuration including available models."""
    return {
        "models": list(MODELS.keys()),
        "model_providers": MODELS,
        "embedding_model": EMBEDDING_MODEL
    }

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

@app.post("/generate-batch-multiple")
async def generate_batch_multiple(req: BatchGenerateMultipleRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not set")

    try:
        prompts_data = load_prompts()
        results = []

        for prompt_id in req.prompt_ids:
            prompt = next((p for p in prompts_data if p["id"] == prompt_id), None)
            if not prompt:
                results.append({
                    "prompt_id": prompt_id,
                    "error": "Prompt not found",
                    "models": []
                })
                continue

            model_results = []
            for model in req.models:
                # Check cache first
                cached = get_cached_response(prompt_id, model)
                if cached:
                    model_results.append({"model": model, "cached": True, "response": cached})
                    continue

                # Generate new response
                try:
                    response_text = await call_openrouter(prompt["text"], model)
                    response_obj = save_response(prompt_id, prompt["text"], model, response_text)
                    model_results.append({"model": model, "cached": False, "response": response_obj})
                except Exception as e:
                    model_results.append({"model": model, "error": str(e)})

            results.append({
                "prompt_id": prompt_id,
                "models": model_results
            })

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/responses/{prompt_id}")
async def delete_response(prompt_id: int, model: str):
    responses = load_responses()
    updated = [r for r in responses if not (r.get("prompt_id") == prompt_id and r["model"] == model)]

    if len(updated) == len(responses):
        raise HTTPException(status_code=404, detail="Response not found")

    with open(RESPONSES_FILE, "w") as f:
        json.dump(updated, f, indent=2)

    return {"deleted": True}

@app.post("/embeddings/visualize")
async def visualize_embeddings(req: EmbeddingRequest):
    """
    Generate embedding visualization data with optional filtering.
    Returns 2D coordinates for visualization.
    """
    try:
        from sentence_transformers import SentenceTransformer
        from umap import UMAP

        # Load data
        responses = load_responses()
        prompts = load_prompts()

        # Create prompt category lookup
        prompt_categories = {p["id"]: p["category"] for p in prompts}

        # Filter responses
        filtered_responses = responses

        if req.models:
            filtered_responses = [r for r in filtered_responses if r["model"] in req.models]

        if req.categories:
            filtered_responses = [
                r for r in filtered_responses
                if prompt_categories.get(r.get("prompt_id")) in req.categories
            ]

        if len(filtered_responses) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 responses to visualize")

        # Embed responses with caching
        texts = [r["response"] for r in filtered_responses]
        cached_embeddings, uncached_indices = get_cached_embeddings(texts)

        # Compute embeddings only for uncached texts
        if uncached_indices:
            model = SentenceTransformer(EMBEDDING_MODEL)
            uncached_texts = [texts[i] for i in uncached_indices]
            # Use parallel processing for faster batch encoding
            # batch_size controls GPU/CPU batching, show_progress_bar disabled for API
            newly_computed = model.encode(
                uncached_texts,
                show_progress_bar=False,
                batch_size=32,  # Process 32 texts at once
                convert_to_numpy=True
            )

            # Fill in the newly computed embeddings
            for idx, embedding in zip(uncached_indices, newly_computed):
                cached_embeddings[idx] = embedding

            # Save newly computed embeddings to cache
            save_embeddings_to_cache(uncached_texts, newly_computed)

        # Convert to numpy array
        embeddings = np.array(cached_embeddings)

        # Center by prompt if requested
        if req.center_by_prompt:
            # Group embeddings by prompt_id
            prompt_embeddings = defaultdict(list)
            prompt_indices = defaultdict(list)

            for i, response in enumerate(filtered_responses):
                prompt_id = response.get("prompt_id", "N/A")
                prompt_embeddings[prompt_id].append(embeddings[i])
                prompt_indices[prompt_id].append(i)

            # Subtract mean for each prompt
            centered_embeddings = embeddings.copy()
            for prompt_id, embedding_list in prompt_embeddings.items():
                embedding_array = np.array(embedding_list)
                mean_embedding = embedding_array.mean(axis=0)

                for idx in prompt_indices[prompt_id]:
                    centered_embeddings[idx] = embeddings[idx] - mean_embedding

            embeddings = centered_embeddings

        # Reduce dimensions with UMAP
        reducer = UMAP(
            n_components=2,
            random_state=42,
            n_neighbors=min(15, len(filtered_responses) - 1),
            min_dist=0.1,
            metric='cosine'
        )
        reduced = reducer.fit_transform(embeddings)

        # Prepare response data
        visualization_data = []
        for i, response in enumerate(filtered_responses):
            model_name = response["model"]
            visualization_data.append({
                "x": float(reduced[i, 0]),
                "y": float(reduced[i, 1]),
                "model": model_name,
                "provider": MODELS.get(model_name, "unknown"),
                "prompt_id": response.get("prompt_id"),
                "prompt": response["prompt"][:100] + "..." if len(response["prompt"]) > 100 else response["prompt"],
                "response_preview": response["response"][:200] + "..." if len(response["response"]) > 200 else response["response"],
                "category": prompt_categories.get(response.get("prompt_id"), "unknown")
            })

        return {
            "data": visualization_data,
            "centered": req.center_by_prompt,
            "total_points": len(visualization_data),
            "cache_stats": {
                "total_embeddings": len(texts),
                "cached": len(texts) - len(uncached_indices),
                "computed": len(uncached_indices)
            }
        }

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Missing required package: {str(e)}. Install with: pip install sentence-transformers umap-learn"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/embeddings/metadata")
async def get_embedding_metadata():
    """
    Get available models and categories for filtering.
    """
    try:
        responses = load_responses()
        prompts = load_prompts()

        # Get unique models
        models = list(set(r["model"] for r in responses))

        # Get unique categories
        categories = list(set(p["category"] for p in prompts))

        # Count responses per model
        model_counts = {}
        for model in models:
            model_counts[model] = sum(1 for r in responses if r["model"] == model)

        # Count responses per category
        prompt_categories = {p["id"]: p["category"] for p in prompts}
        category_counts = {}
        for category in categories:
            category_counts[category] = sum(
                1 for r in responses
                if prompt_categories.get(r.get("prompt_id")) == category
            )

        return {
            "models": models,
            "categories": categories,
            "model_counts": model_counts,
            "category_counts": category_counts,
            "total_responses": len(responses)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
