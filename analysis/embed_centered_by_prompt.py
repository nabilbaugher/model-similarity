#!/usr/bin/env python3
"""
Embed model responses and center them by prompt.
For each prompt, subtract the average embedding across all models' responses.
This isolates model-specific differences from prompt-specific patterns.
"""

import json
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer
import plotly.express as px
import plotly.graph_objects as go
from umap import UMAP
import pandas as pd
from collections import defaultdict

# Paths
RESPONSES_FILE = Path("../backend/data/responses.json")

def load_responses():
    """Load responses from JSON file."""
    with open(RESPONSES_FILE, "r") as f:
        return json.load(f)

def embed_responses(responses, model_name="all-mpnet-base-v2"):
    """
    Embed response texts using sentence-transformers.

    Args:
        responses: List of response dictionaries
        model_name: Name of the sentence-transformers model to use

    Returns:
        numpy array of embeddings (n_responses, embedding_dim)
    """
    print(f"Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name)

    texts = [r["response"] for r in responses]
    print(f"Embedding {len(texts)} responses...")
    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        batch_size=32,  # Process 32 texts at once for speed
        convert_to_numpy=True
    )

    return embeddings

def center_embeddings_by_prompt(responses, embeddings):
    """
    Center embeddings by subtracting the mean embedding for each prompt.

    This removes prompt-specific variance, leaving model-specific differences.

    Args:
        responses: List of response dictionaries
        embeddings: Original embeddings (n_responses, embedding_dim)

    Returns:
        Centered embeddings (n_responses, embedding_dim)
    """
    print("\nCentering embeddings by prompt...")

    # Group embeddings by prompt_id
    prompt_embeddings = defaultdict(list)
    prompt_indices = defaultdict(list)

    for i, response in enumerate(responses):
        prompt_id = response.get('prompt_id', 'N/A')
        prompt_embeddings[prompt_id].append(embeddings[i])
        prompt_indices[prompt_id].append(i)

    # Calculate mean embedding for each prompt
    centered_embeddings = embeddings.copy()

    for prompt_id, embedding_list in prompt_embeddings.items():
        embedding_array = np.array(embedding_list)
        mean_embedding = embedding_array.mean(axis=0)

        # Subtract mean from all responses to this prompt
        for idx in prompt_indices[prompt_id]:
            centered_embeddings[idx] = embeddings[idx] - mean_embedding

        print(f"  Prompt {prompt_id}: {len(embedding_list)} responses, centered")

    return centered_embeddings

def reduce_dimensions(embeddings, n_components=2, random_state=42):
    """
    Reduce embeddings to 2D using UMAP.

    Args:
        embeddings: High-dimensional embeddings
        n_components: Number of dimensions to reduce to
        random_state: Random seed for reproducibility

    Returns:
        Reduced embeddings (n_responses, n_components)
    """
    print("\nReducing dimensions with UMAP...")
    reducer = UMAP(
        n_components=n_components,
        random_state=random_state,
        n_neighbors=15,
        min_dist=0.1,
        metric='cosine'
    )
    reduced = reducer.fit_transform(embeddings)
    return reduced

def create_visualization(responses, reduced_embeddings, output_file="embeddings_centered_viz.html"):
    """
    Create interactive plotly visualization of embeddings.

    Args:
        responses: List of response dictionaries
        reduced_embeddings: 2D embeddings
        output_file: Path to save HTML visualization
    """
    # Create dataframe for plotting
    df = pd.DataFrame({
        'x': reduced_embeddings[:, 0],
        'y': reduced_embeddings[:, 1],
        'model': [r['model'] for r in responses],
        'prompt_id': [r.get('prompt_id', 'N/A') for r in responses],
        'prompt': [r['prompt'][:100] + '...' if len(r['prompt']) > 100 else r['prompt'] for r in responses],
        'response_preview': [r['response'][:200] + '...' if len(r['response']) > 200 else r['response'] for r in responses]
    })

    # Get unique models and assign colors
    models = df['model'].unique()
    print(f"\nFound {len(models)} unique models:")
    for model in sorted(models):
        count = (df['model'] == model).sum()
        print(f"  - {model}: {count} responses")

    # Create interactive scatter plot colored by model
    fig = px.scatter(
        df,
        x='x',
        y='y',
        color='model',
        hover_data={
            'prompt_id': True,
            'prompt': True,
            'response_preview': True,
            'x': False,
            'y': False
        },
        title='Prompt-Centered Model Response Embeddings (UMAP Projection)',
        labels={'x': 'UMAP Dimension 1', 'y': 'UMAP Dimension 2'},
        width=1200,
        height=800
    )

    # Update layout for better readability
    fig.update_traces(marker=dict(size=8, opacity=0.7))
    fig.update_layout(
        font=dict(size=12),
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01
        )
    )

    # Save to HTML
    output_path = Path(output_file)
    fig.write_html(str(output_path))
    print(f"\nVisualization saved to: {output_path.absolute()}")

    # Also show in browser if possible
    fig.show()

def main():
    """Main execution function."""
    print("=" * 60)
    print("Prompt-Centered Model Response Embedding Visualization")
    print("=" * 60)
    print("\nStrategy: For each prompt, subtract the average embedding")
    print("across all model responses. This isolates model-specific")
    print("differences from prompt-specific content.")
    print("=" * 60)

    # Load responses
    print(f"\nLoading responses from: {RESPONSES_FILE}")
    responses = load_responses()
    print(f"Loaded {len(responses)} responses")

    # Embed responses
    embeddings = embed_responses(responses)
    print(f"Original embeddings shape: {embeddings.shape}")

    # Center embeddings by prompt
    centered_embeddings = center_embeddings_by_prompt(responses, embeddings)
    print(f"Centered embeddings shape: {centered_embeddings.shape}")

    # Reduce dimensions
    reduced = reduce_dimensions(centered_embeddings)
    print(f"Reduced embeddings shape: {reduced.shape}")

    # Create visualization
    create_visualization(responses, reduced)

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)
    print("\nInterpretation:")
    print("- Points that cluster by color show consistent model style")
    print("- Spread within a color shows model variability")
    print("- Distance between colors shows model differences")
    print("=" * 60)

if __name__ == "__main__":
    main()
