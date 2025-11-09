"use client";

import { useState, useEffect } from "react";
import { Prompt, Response, MODELS, View } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import PracticeMode from "@/components/PracticeMode";
import ReviewMode from "@/components/ReviewMode";

export default function Home() {
  const [view, setView] = useState<View>("generate");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedModels, setSelectedModels] = useState<Record<number, string[]>>({});
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

  const getTotalResponses = () => responses.length;

  if (view === "generate") {
    return (
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <h1 className="text-xl font-bold text-slate-900">Model Similarity</h1>
            <p className="text-xs text-slate-500">Test & Practice</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={true} onClick={() => setView("generate" as View)}>
                  <span>Generate Responses</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} onClick={() => setView("review" as View)}>
                  <span>Review ({getTotalResponses()})</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} onClick={() => startPractice(null)}>
                  <span>Practice Mode</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Generate Responses</h2>
              <p className="text-slate-600 mt-2">Select models and generate responses from prompts</p>
            </div>

            <div className="space-y-4">
              {prompts.map((prompt) => (
                <Card key={prompt.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{prompt.category}</Badge>
                          <Badge variant="outline">{getResponseCount(prompt.id)} responses</Badge>
                        </div>
                        <CardTitle className="text-xl">{prompt.text}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-3">Select models:</label>
                        <div className="flex gap-2 flex-wrap">
                          {MODELS.map((model) => {
                            const hasResponse = responses.some(
                              (r) => r.prompt_id === prompt.id && r.model === model
                            );
                            const isSelected = (selectedModels[prompt.id] || []).includes(model);
                            return (
                              <Button
                                key={model}
                                onClick={() => toggleModel(prompt.id, model)}
                                variant={
                                  isSelected
                                    ? "default"
                                    : hasResponse
                                    ? "outline"
                                    : "secondary"
                                }
                                size="sm"
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
          </div>
        </main>
      </div>
    );
  }

  if (view === "review") {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar>
          <SidebarHeader>
            <h1 className="text-xl font-bold text-slate-900">Model Similarity</h1>
            <p className="text-xs text-slate-500">Test & Practice</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} onClick={() => setView("generate" as View)}>
                  <span>Generate Responses</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={true} onClick={() => setView("review" as View)}>
                  <span>Review ({getTotalResponses()})</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} onClick={() => startPractice(null)}>
                  <span>Practice Mode</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <ReviewMode
            prompts={prompts}
            responses={responses}
            onBack={() => setView("generate")}
            onPractice={startPractice}
            onRefresh={loadResponses}
          />
        </div>
      </div>
    );
  }

  const filteredResponses = selectedPromptId
    ? responses.filter((r) => r.prompt_id === selectedPromptId)
    : responses;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar>
        <SidebarHeader>
          <h1 className="text-xl font-bold text-slate-900">Model Similarity</h1>
          <p className="text-xs text-slate-500">Test & Practice</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={false} onClick={() => setView("generate" as View)}>
                <span>Generate Responses</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={false} onClick={() => setView("review" as View)}>
                <span>Review ({getTotalResponses()})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={true} onClick={() => startPractice(null)}>
                <span>Practice Mode</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 overflow-auto">
        <PracticeMode
          responses={filteredResponses}
          onBack={() => setView("generate" as View)}
        />
      </div>
    </div>
  );
}
