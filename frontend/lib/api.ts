const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async getConfig() {
    const res = await fetch(`${API_BASE_URL}/config`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error("Failed to load config");
    return res.json();
  },

  async getPrompts() {
    const res = await fetch(`${API_BASE_URL}/prompts`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error("Failed to load prompts");
    return res.json();
  },

  async getResponses() {
    const res = await fetch(`${API_BASE_URL}/responses`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error("Failed to load responses");
    return res.json();
  },

  async generateBatch(promptId: number, models: string[]) {
    const res = await fetch(`${API_BASE_URL}/generate-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_id: promptId, models }),
    });
    if (!res.ok) throw new Error("Failed to generate responses");
    return res.json();
  },

  async deleteResponse(promptId: number, model: string) {
    const res = await fetch(
      `${API_BASE_URL}/responses/${promptId}?model=${encodeURIComponent(model)}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) throw new Error("Failed to delete response");
    return res.json();
  },

  async generateBatchMultiple(promptIds: number[], models: string[]) {
    const res = await fetch(`${API_BASE_URL}/generate-batch-multiple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_ids: promptIds, models }),
    });
    if (!res.ok) throw new Error("Failed to generate batch responses");
    return res.json();
  },

  async getEmbeddingMetadata() {
    const res = await fetch(`${API_BASE_URL}/embeddings/metadata`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error("Failed to load embedding metadata");
    return res.json();
  },

  async visualizeEmbeddings(
    models?: string[],
    categories?: string[],
    centerByPrompt: boolean = true
  ) {
    const res = await fetch(`${API_BASE_URL}/embeddings/visualize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        models: models || null,
        categories: categories || null,
        center_by_prompt: centerByPrompt,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to generate visualization");
    }
    return res.json();
  },
};
