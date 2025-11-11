export interface Prompt {
  id: number;
  text: string;
  category: string;
}

export interface Response {
  prompt_id?: number;
  prompt: string;
  model: string;
  response: string;
}

export type View = "generate" | "review" | "practice" | "batch" | "visualize" | "design";

export interface BatchJobStatus {
  promptId: number;
  model: string;
  status: "queued" | "running" | "completed" | "failed";
  error?: string;
}

export interface EmbeddingPoint {
  x: number;
  y: number;
  model: string;
  provider: string;
  prompt_id: number;
  prompt: string;
  response_preview: string;
  category: string;
}

export interface EmbeddingMetadata {
  models: string[];
  categories: string[];
  model_counts: Record<string, number>;
  category_counts: Record<string, number>;
  total_responses: number;
}
