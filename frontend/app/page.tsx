"use client";

import { useState, useEffect } from "react";
import { Prompt, Response, MODELS, View } from "@/lib/types";
import { api } from "@/lib/api";
import PracticeMode from "@/components/PracticeMode";
import ReviewMode from "@/components/ReviewMode";

export default function Home() {
  const [view, setView] = useState<View>("generate");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedModels, setSelectedModels] = useState<
    Record<number, string[]>
  >({});
  const [generating, setGenerating] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadPrompts();
    loadResponses();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await api.getPrompts();
      setPrompts(data);
    } catch (err) {
      console.error("Failed to load prompts:", err);
    }
  };

  const loadResponses = async () => {
    try {
      const data = await api.getResponses();
      setResponses(data);
    } catch (err) {
      console.error("Failed to load responses:", err);
    }
  };

  const toggleModel = (promptId: number, model: string) => {
    setSelectedModels((prev) => {
      const current = prev[promptId] || [];
      const updated = current.includes(model)
        ? current.filter((m) => m !== model)
        : [...current, model];
      return { ...prev, [promptId]: updated };
    });
  };

  const handleGenerate = async (promptId: number) => {
    const models = selectedModels[promptId] || [];
    if (models.length === 0) return;

    setGenerating((prev) => ({ ...prev, [promptId]: true }));

    try {
      await api.generateBatch(promptId, models);
      await loadResponses();
    } catch (err) {
      console.error("Failed to generate:", err);
    } finally {
      setGenerating((prev) => ({ ...prev, [promptId]: false }));
    }
  };

  const getResponseCount = (promptId: number) => {
    return responses.filter((r) => r.prompt_id === promptId).length;
  };

  const startPractice = (promptId: number | null = null) => {
    setSelectedPromptId(promptId);
    setView("practice");
  };

  if (view === "generate") {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Generate Responses
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setView("review")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Review
              </button>
              <button
                onClick={() => startPractice(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Practice All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {prompt.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({getResponseCount(prompt.id)} responses)
                      </span>
                    </div>
                    <div className="text-gray-800">{prompt.text}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Select models:
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {MODELS.map((model) => {
                      const hasResponse = responses.some(
                        (r) => r.prompt_id === prompt.id && r.model === model
                      );
                      const isSelected = (
                        selectedModels[prompt.id] || []
                      ).includes(model);
                      return (
                        <button
                          key={model}
                          onClick={() => toggleModel(prompt.id, model)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : hasResponse
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {model.split("/")[1]} {hasResponse && "✓"}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleGenerate(prompt.id)}
                    disabled={
                      !selectedModels[prompt.id]?.length ||
                      generating[prompt.id]
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                  >
                    {generating[prompt.id] ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === "review") {
    return (
      <ReviewMode
        prompts={prompts}
        responses={responses}
        onBack={() => setView("generate")}
        onPractice={startPractice}
        onRefresh={loadResponses}
      />
    );
  }

  const filteredResponses = selectedPromptId
    ? responses.filter((r) => r.prompt_id === selectedPromptId)
    : responses;

  return (
    <PracticeMode
      responses={filteredResponses}
      onBack={() => setView("generate")}
    />
  );
}
