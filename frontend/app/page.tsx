"use client";

import { useState, useEffect } from "react";
import { Prompt, Response, View } from "@/lib/types";
import { api } from "@/lib/api";
import PracticeMode from "@/components/PracticeMode";
import ReviewMode from "@/components/ReviewMode";
import BatchRunner from "@/components/BatchRunner";
import EmbeddingVisualization from "@/components/EmbeddingVisualization";
import { DesignInspiration } from "@/components/DesignInspiration";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [view, setView] = useState<View>("generate");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<
    Record<number, string[]>
  >({});
  const [generating, setGenerating] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadConfig();
    loadPrompts();
    loadResponses();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.getConfig();
      setModels(data.models);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

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
      <>
        <AppSidebar currentView={view} onNavigate={setView} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Generate Responses</h1>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {prompts.map((prompt) => (
              <Card key={prompt.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{prompt.category}</Badge>
                      <Badge variant="outline">
                        {getResponseCount(prompt.id)} responses
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base font-normal mt-2">
                    {prompt.text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <CardDescription className="mb-2">
                        Select models:
                      </CardDescription>
                      <div className="flex gap-2 flex-wrap">
                        {models.map((model) => {
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

                    <Button
                      onClick={() => handleGenerate(prompt.id)}
                      disabled={
                        !selectedModels[prompt.id]?.length ||
                        generating[prompt.id]
                      }
                    >
                      {generating[prompt.id] ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SidebarInset>
      </>
    );
  }

  if (view === "batch") {
    return (
      <BatchRunner
        prompts={prompts}
        responses={responses}
        models={models}
        currentView={view}
        onNavigate={setView}
        onRefresh={loadResponses}
      />
    );
  }

  if (view === "visualize") {
    return (
      <EmbeddingVisualization
        currentView={view}
        onNavigate={setView}
      />
    );
  }

  if (view === "design") {
    return (
      <>
        <AppSidebar currentView={view} onNavigate={setView} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Design Inspiration</h1>
          </header>
          <DesignInspiration />
        </SidebarInset>
      </>
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
        currentView={view}
        onNavigate={setView}
      />
    );
  }

  const filteredResponses = selectedPromptId
    ? responses.filter((r) => r.prompt_id === selectedPromptId)
    : responses;

  return (
    <PracticeMode
      responses={filteredResponses}
      models={models}
      onBack={() => setView("generate")}
      currentView={view}
      onNavigate={setView}
    />
  );
}
