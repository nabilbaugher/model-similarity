"""
Application settings and configuration.
"""

# LLM Models available for text generation mapped to their providers
# Key: OpenRouter model identifier
# Value: Provider name (used for visualization shape mapping)
MODELS = {
    "anthropic/claude-sonnet-4.5": "anthropic",
    "anthropic/claude-haiku-4.5": "anthropic",
    "openai/gpt-5": "openai",
    "google/gemini-2.5-pro": "google",
    "x-ai/grok-code-fast-1": "x-ai",
    "minimax/minimax-m2:free": "minimax",
    "openrouter/polaris-alpha": "openrouter",
    "deepseek/deepseek-v3.2-exp": "deepseek",
}

# Embedding model for semantic similarity analysis
# This should be a valid sentence-transformers model
EMBEDDING_MODEL = "all-mpnet-base-v2"


# Validation
def validate_models():
    """Basic validation for model configuration."""
    if not MODELS:
        raise ValueError("MODELS dict cannot be empty")

    if not isinstance(MODELS, dict):
        raise ValueError("MODELS must be a dictionary")

    if not all(isinstance(k, str) and isinstance(v, str) for k, v in MODELS.items()):
        raise ValueError("All model keys and values must be strings")

    if not all("/" in k for k in MODELS.keys()):
        raise ValueError("Model keys should follow 'provider/model-name' format")

    if not EMBEDDING_MODEL:
        raise ValueError("EMBEDDING_MODEL cannot be empty")

    if not isinstance(EMBEDDING_MODEL, str):
        raise ValueError("EMBEDDING_MODEL must be a string")


# Run validation on import
validate_models()
