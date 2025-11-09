"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prompt, Response } from "@/lib/types";
import { api } from "@/lib/api";

interface ReviewModeProps {
  prompts: Prompt[];
  responses: Response[];
  onBack: () => void;
  onPractice: (promptId: number) => void;
  onRefresh: () => void;
}

export default function ReviewMode({
  prompts,
  responses,
  onBack,
  onPractice,
  onRefresh,
}: ReviewModeProps) {
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);

  const getPromptResponses = (promptId: number) => {
    return responses.filter((r) => r.prompt_id === promptId);
  };

  const handleDelete = async (promptId: number, model: string) => {
    if (!confirm(`Delete response from ${model}?`)) return;

    try {
      await api.deleteResponse(promptId, model);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleExpand = (promptId: number) => {
    setExpandedPromptId(expandedPromptId === promptId ? null : promptId);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Review Responses</h1>
          <div className="w-24"></div>
        </div>

        <div className="space-y-4">
          {prompts.map((prompt) => {
            const promptResponses = getPromptResponses(prompt.id);
            const isExpanded = expandedPromptId === prompt.id;

            if (promptResponses.length === 0) return null;

            return (
              <div key={prompt.id} className="bg-white rounded-lg shadow">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(prompt.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {prompt.category}
                        </span>
                        <span className="text-xs text-blue-600 font-semibold">
                          {promptResponses.length} response
                          {promptResponses.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-gray-800">{prompt.text}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPractice(prompt.id);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Practice
                      </button>
                      <span className="text-gray-400">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 space-y-4">
                    {promptResponses.map((response, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-semibold text-gray-700">
                            {response.model}
                          </div>
                          <button
                            onClick={() =>
                              handleDelete(prompt.id, response.model)
                            }
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="prose max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response.response}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {prompts.filter((p) => getPromptResponses(p.id).length > 0).length ===
          0 && (
          <div className="text-center text-gray-600 mt-12">
            No responses generated yet.
          </div>
        )}
      </div>
    </div>
  );
}
