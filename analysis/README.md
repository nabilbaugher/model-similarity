# Model Similarity Analysis

Tools for analyzing and visualizing differences between model responses using embeddings.

## Setup

```bash
# Install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
uv pip install -r requirements.txt
# or install from pyproject.toml
uv pip install sentence-transformers umap-learn plotly pandas numpy scikit-learn
```

## Usage

Activate the virtual environment:
```bash
source .venv/bin/activate  # On Unix/macOS
# or
.venv\Scripts\activate  # On Windows
```

### Basic Embedding Visualization

```bash
python embed_and_visualize.py
```

Embeds responses and visualizes them in 2D space, colored by model.

### Prompt-Centered Analysis

```bash
python embed_centered_by_prompt.py
```

Centers embeddings by subtracting the mean embedding for each prompt. This isolates model-specific differences from prompt-specific content.

## Scripts

- `embed_and_visualize.py` - Basic embedding visualization
- `embed_centered_by_prompt.py` - Prompt-centered embedding analysis
- `requirements.txt` - Legacy requirements file (use pyproject.toml instead)

## Output

All scripts generate interactive HTML visualizations that can be opened in a browser.
