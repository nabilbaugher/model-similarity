"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  GraduationCap,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Prompt, Response, MODELS, View } from "@/lib/types";
import { api } from "@/lib/api";
import PracticeMode from "@/components/PracticeMode";
import ReviewMode from "@/components/ReviewMode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems: {
  id: View;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    id: "generate",
    label: "Generate",
    description: "Batch prompts across your models",
    icon: Sparkles,
  },
  {
    id: "review",
    label: "Review",
    description: "Compare and curate stored responses",
    icon: ListChecks,
  },
  {
    id: "practice",
    label: "Practice",
    description: "Test if you can spot the model",
    icon: GraduationCap,
  },
];

const viewMeta: Record<View, { title: string; description: string }> = {
  generate: {
    title: "Batch generation",
    description: "Select prompts, run models, and build your comparison set.",
  },
  review: {
    title: "Review responses",
    description: "Collapse and compare every stored response, delete noise, and drill down by prompt.",
  },
  practice: {
    title: "Practice mode",
    description: "Flashcards that help you identify a model's fingerprint without peeking.",
  },
};

interface GenerateViewProps {
  prompts: Prompt[];
  responses: Response[];
  selectedModels: Record<number, string[]>;
  generating: Record<number, boolean>;
  onToggleModel: (promptId: number, model: string) => void;
  onGenerate: (promptId: number) => Promise<void>;
  onPracticePrompt: (promptId: number) => void;
}

function GenerateView({
  prompts,
  responses,
  selectedModels,
  generating,
  onToggleModel,
  onGenerate,
  onPracticePrompt,
}: GenerateViewProps) {
  if (!prompts.length) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-xl">No prompts yet</CardTitle>
          <CardDescription>
            Add prompts via the API so you can start generating responses.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {prompts.map((prompt) => {
        const selected = selectedModels[prompt.id] || [];
        const responseCount = responses.filter(
          (r) => r.prompt_id === prompt.id
        ).length;

        return (
          <Card key={prompt.id} className="border border-border/70">
            <CardHeader className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-muted-foreground">
                  <Badge variant="outline" className="px-2 py-0.5">
                    {prompt.category}
                  </Badge>
                  <Badge variant={responseCount ? "secondary" : "outline"}>
                    {responseCount} saved
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-snug">
                  {prompt.text}
                </CardTitle>
                <CardDescription>
                  Select the models you want to compare for this prompt.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPracticePrompt(prompt.id)}
                disabled={responseCount === 0}
              >
                Quick practice
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                {MODELS.map((model) => {
                  const label = model.split("/")[1];
                  const isSelected = selected.includes(model);
                  const hasResponse = responses.some(
                    (r) => r.prompt_id === prompt.id && r.model === model
                  );

                  return (
                    <Button
                      key={model}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "justify-between text-sm",
                        !isSelected &&
                          hasResponse &&
                          "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                      )}
                      onClick={() => onToggleModel(prompt.id, model)}
                    >
                      <span className="font-medium">{label}</span>
                      <div className="flex items-center gap-2 text-xs">
                        {hasResponse && <Badge variant="secondary">Saved</Badge>}
                        {isSelected && (
                          <span className="text-primary-foreground/80">Selected</span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t px-6 py-4">
              <Button
                type="button"
                onClick={() => onGenerate(prompt.id)}
                disabled={!selected.length || generating[prompt.id]}
              >
                {generating[prompt.id] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate batch"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={responseCount === 0}
                onClick={() => onPracticePrompt(prompt.id)}
              >
                Practice responses
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

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
    if (!models.length) return;

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

  const startPractice = (promptId: number | null = null) => {
    setSelectedPromptId(promptId);
    setView("practice");
  };

  const filteredResponses = useMemo(() => {
    return selectedPromptId
      ? responses.filter((r) => r.prompt_id === selectedPromptId)
      : responses;
  }, [responses, selectedPromptId]);

  const headerActions = (() => {
    if (view === "generate") {
      return (
        <>
          <Button variant="outline" onClick={() => setView("review")}>
            Review library
          </Button>
          <Button onClick={() => startPractice(null)}>
            Practice all
          </Button>
        </>
      );
    }

    if (view === "review") {
      return (
        <Button variant="outline" onClick={() => setView("generate")}>
          Back to generate
        </Button>
      );
    }

    return (
      <Button variant="outline" onClick={() => setView("generate")}>
        Exit practice
      </Button>
    );
  })();

  let content: ReactNode = null;

  if (view === "generate") {
    content = (
      <GenerateView
        prompts={prompts}
        responses={responses}
        selectedModels={selectedModels}
        generating={generating}
        onToggleModel={toggleModel}
        onGenerate={handleGenerate}
        onPracticePrompt={(promptId) => startPractice(promptId)}
      />
    );
  } else if (view === "review") {
    content = (
      <ReviewMode
        prompts={prompts}
        responses={responses}
        onPractice={(promptId) => startPractice(promptId)}
        onRefresh={loadResponses}
      />
    );
  } else {
    content = (
      <PracticeMode
        responses={filteredResponses}
        onExit={() => setView("generate")}
      />
    );
  }

  const navBadges: Record<View, string> = {
    generate: String(prompts.length),
    review: String(responses.length),
    practice: String(filteredResponses.length || 0),
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-3 py-2">
            <Sparkles className="h-4 w-4 text-sidebar-primary" />
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">
                Model Similarity
              </p>
              <p className="text-xs text-sidebar-foreground/70">Research kit</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={view === item.id}
                        onClick={() => setView(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>{navBadges[item.id]}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="gap-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/20 p-3 text-xs text-sidebar-foreground">
            <div className="flex items-center justify-between">
              <span>Prompts</span>
              <Badge variant="outline">{prompts.length}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Responses</span>
              <Badge variant="outline">{responses.length}</Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => startPractice(null)}
          >
            <GraduationCap className="mr-2 h-4 w-4" /> Practice all
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={loadResponses}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh data
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset>
        <div className="flex min-h-svh flex-1 flex-col">
          <header className="flex flex-col gap-2 border-b px-6 py-4 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  {viewMeta[view].title}
                </p>
                <h1 className="text-xl font-semibold text-foreground">
                  {viewMeta[view].description.split(".")[0]}
                </h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground md:flex-1">
              {viewMeta[view].description}
            </p>
            <div className="flex flex-wrap gap-2">{headerActions}</div>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {content}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
