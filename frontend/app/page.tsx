"use client";

import { useState, useEffect } from "react";
import { Prompt, Response, MODELS, View } from "@/lib/types";
import { api } from "@/lib/api";
import PracticeMode from "@/components/PracticeMode";
import ReviewMode from "@/components/ReviewMode";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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

  const filteredResponses = selectedPromptId
    ? responses.filter((r) => r.prompt_id === selectedPromptId)
    : responses;

  return (
    <SidebarProvider>
      <AppSidebar view={view} onNavigate={setView} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">
            {view === "generate" && "Generate Responses"}
            {view === "review" && "Review Responses"}
            {view === "practice" && "Practice Mode"}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {view === "generate" && (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <Card key={prompt.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{prompt.category}</Badge>
                          <Badge variant="outline">
                            {getResponseCount(prompt.id)} responses
                          </Badge>
                        </div>
                        <CardDescription className="text-base text-foreground pt-2">
                          {prompt.text}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Select models:</p>
                        <div className="flex gap-2 flex-wrap">
                          {MODELS.map((model) => {
                            const hasResponse = responses.some(
                              (r) => r.prompt_id === prompt.id && r.model === model
                            );
                            const isSelected = (
                              selectedModels[prompt.id] || []
                            ).includes(model);
                            return (
                              <Button
                                key={model}
                                variant={isSelected ? "default" : hasResponse ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => toggleModel(prompt.id, model)}
                              >
                                {model.split("/")[1]} {hasResponse && "✓"}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleGenerate(prompt.id)}
                      disabled={
                        !selectedModels[prompt.id]?.length ||
                        generating[prompt.id]
                      }
                    >
                      {generating[prompt.id] && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {generating[prompt.id] ? "Generating..." : "Generate"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {view === "review" && (
            <ReviewMode
              prompts={prompts}
              responses={responses}
              onBack={() => setView("generate")}
              onPractice={startPractice}
              onRefresh={loadResponses}
            />
          )}

          {view === "practice" && (
            <PracticeMode
              responses={filteredResponses}
              onBack={() => setView("generate")}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
