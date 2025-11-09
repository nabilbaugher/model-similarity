"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prompt, Response } from "@/lib/types";
import { api } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

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

  const promptsWithResponses = prompts.filter(
    (p) => getPromptResponses(p.id).length > 0
  );

  if (promptsWithResponses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No responses generated yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-4">
        {promptsWithResponses.map((prompt) => {
          const promptResponses = getPromptResponses(prompt.id);

          return (
            <AccordionItem key={prompt.id} value={`prompt-${prompt.id}`} className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-start justify-between w-full pr-4">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{prompt.category}</Badge>
                        <Badge variant="outline">
                          {promptResponses.length} response
                          {promptResponses.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-base font-normal">{prompt.text}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPractice(prompt.id);
                      }}
                      className="ml-4"
                    >
                      Practice
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4 space-y-4">
                    {promptResponses.map((response, idx) => (
                      <Card key={idx} className="border-muted">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="default">{response.model}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(prompt.id, response.model)
                              }
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {response.response}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
