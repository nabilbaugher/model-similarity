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

export const MODELS = [
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-5",
  "google/gemini-2.5-pro",
  "anthropic/claude-haiku-4.5",
];

export type View = "generate" | "review" | "practice";
