"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

import { Prompt, Response } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReviewModeProps {
  prompts: Prompt[];
  responses: Response[];
  onPractice: (promptId: number) => void;
  onRefresh: () => void;
}

export default function ReviewMode({
  prompts,
  responses,
  onPractice,
  onRefresh,
}: ReviewModeProps) {
  const [expandedPromptId, setExpandedPromptId] = useState<string | undefined>();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const getPromptResponses = (promptId: number) => {
    return responses.filter((r) => r.prompt_id === promptId);
  };

  const promptsWithResponses = prompts.filter(
    (prompt) => getPromptResponses(prompt.id).length > 0
  );

  const handleDelete = async (promptId: number, model: string) => {
    if (!confirm(`Delete response from ${model}?`)) return;
    const key = `${promptId}-${model}`;
    setDeletingKey(key);
    try {
      await api.deleteResponse(promptId, model);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeletingKey(null);
    }
  };

  if (!promptsWithResponses.length) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-xl">No responses to review</CardTitle>
          <CardDescription>
            Generate a batch to start building your response library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-muted/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Total responses</p>
            <p className="text-2xl font-semibold text-foreground">
              {responses.length}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>

      <Accordion
        type="single"
        collapsible
        value={expandedPromptId}
        onValueChange={(value) => setExpandedPromptId(value)}
        className="space-y-4"
      >
        {promptsWithResponses.map((prompt) => {
          const promptResponses = getPromptResponses(prompt.id);
          const accordionValue = String(prompt.id);

          return (
            <AccordionItem
              key={prompt.id}
              value={accordionValue}
              className="overflow-hidden rounded-xl border bg-card text-card-foreground"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex flex-1 flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                      {prompt.category}
                    </Badge>
                    <span>{promptResponses.length} response(s)</span>
                  </div>
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {prompt.text}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 border-t px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Compare the responses below or jump straight into practice.
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onPractice(prompt.id)}
                    >
                      Practice this prompt
                    </Button>
                  </div>

                  {promptResponses.map((response) => {
                    const key = `${prompt.id}-${response.model}`;
                    const deleting = deletingKey === key;

                    return (
                      <Card key={key} className="border bg-muted/30">
                        <CardHeader className="flex flex-wrap items-center justify-between gap-4 pb-0">
                          <div>
                            <CardTitle className="text-base font-semibold">
                              {response.model.split("/")[1]}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Full model id: {response.model}
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onPractice(prompt.id)}
                            >
                              Practice
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-600"
                              onClick={() => handleDelete(prompt.id, response.model)}
                              disabled={deleting}
                            >
                              {deleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose max-w-none text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {response.response}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
