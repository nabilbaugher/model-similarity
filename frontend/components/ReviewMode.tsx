"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prompt, Response } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const promptsWithResponses = prompts.filter((p) => getPromptResponses(p.id).length > 0);

  return (
    <div className="w-full p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Review Responses</h1>
          <div className="w-24"></div>
        </div>

        <div className="space-y-4">
          {promptsWithResponses.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-slate-600">
                No responses generated yet.
              </div>
            </Card>
          ) : (
            promptsWithResponses.map((prompt) => {
              const promptResponses = getPromptResponses(prompt.id);
              const isExpanded = expandedPromptId === prompt.id;

              return (
                <Card key={prompt.id} className="overflow-hidden">
                  <div
                    className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(prompt.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{prompt.category}</Badge>
                          <Badge variant="outline">
                            {promptResponses.length} response{promptResponses.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-slate-900 font-medium">{prompt.text}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPractice(prompt.id);
                          }}
                          size="sm"
                        >
                          Practice
                        </Button>
                        <span className="text-slate-400 text-xl">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50">
                      <div className="p-6 space-y-4">
                        {promptResponses.map((response, idx) => (
                          <Card key={idx} className="border-slate-300">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-slate-900">
                                  {response.model}
                                </h4>
                                <Button
                                  onClick={() =>
                                    handleDelete(prompt.id, response.model)
                                  }
                                  variant="destructive"
                                  size="sm"
                                >
                                  Delete
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {response.response}
                                </ReactMarkdown>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
