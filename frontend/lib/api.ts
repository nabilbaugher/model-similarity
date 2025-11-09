const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
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
};
