"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prompt, Response, View } from "@/lib/types";
import { api } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ReviewModeProps {
  prompts: Prompt[];
  responses: Response[];
  onBack: () => void;
  onPractice: (promptId: number) => void;
  onRefresh: () => void;
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function ReviewMode({
  prompts,
  responses,
  onPractice,
  onRefresh,
  currentView,
  onNavigate,
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
    <>
      <AppSidebar currentView={currentView} onNavigate={onNavigate} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">Review Responses</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {prompts.map((prompt) => {
            const promptResponses = getPromptResponses(prompt.id);
            const isExpanded = expandedPromptId === prompt.id;

            if (promptResponses.length === 0) return null;

            return (
              <Card key={prompt.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleExpand(prompt.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{prompt.category}</Badge>
                        <Badge variant="outline">
                          {promptResponses.length} response
                          {promptResponses.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-normal">
                        {prompt.text}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPractice(prompt.id);
                        }}
                      >
                        Practice
                      </Button>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-4">
                    {promptResponses.map((response, idx) => (
                      <Card key={idx} className="border-muted">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <Badge>{response.model}</Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDelete(prompt.id, response.model)
                              }
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
                  </CardContent>
                )}
              </Card>
            );
          })}

          {prompts.filter((p) => getPromptResponses(p.id).length > 0).length ===
            0 && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                No responses generated yet.
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </>
  );
}
