"use client";

import { useState, useMemo, useEffect } from "react";
import { Prompt, Response, View, BatchJobStatus } from "@/lib/types";
import { api } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

interface BatchRunnerProps {
  prompts: Prompt[];
  responses: Response[];
  models: string[];
  currentView: View;
  onNavigate: (view: View) => void;
  onRefresh: () => void;
}

export default function BatchRunner({
  prompts,
  responses,
  models,
  currentView,
  onNavigate,
  onRefresh,
}: BatchRunnerProps) {
  // Phase: 'selection' or 'execution'
  const [phase, setPhase] = useState<"selection" | "execution">(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('batchRunnerPhase');
      return (saved as "selection" | "execution") || "selection";
    }
    return "selection";
  });

  // Selection state
  const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('batchRunnerSelectedPrompts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('batchRunnerSelectedModels');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const [batchSize, setBatchSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('batchRunnerBatchSize');
      return saved ? parseInt(saved) : 5;
    }
    return 5;
  });

  // Execution state
  const [jobStatuses, setJobStatuses] = useState<BatchJobStatus[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('batchRunnerJobStatuses');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isRunning, setIsRunning] = useState(false);

  // Persist state to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('batchRunnerPhase', phase);
    }
  }, [phase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('batchRunnerSelectedPrompts', JSON.stringify(Array.from(selectedPrompts)));
    }
  }, [selectedPrompts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('batchRunnerSelectedModels', JSON.stringify(Array.from(selectedModels)));
    }
  }, [selectedModels]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('batchRunnerBatchSize', batchSize.toString());
    }
  }, [batchSize]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('batchRunnerJobStatuses', JSON.stringify(jobStatuses));
    }
  }, [jobStatuses]);

  // Group prompts by category
  const promptsByCategory = useMemo(() => {
    const categories = new Map<string, Prompt[]>();
    prompts.forEach((prompt) => {
      if (!categories.has(prompt.category)) {
        categories.set(prompt.category, []);
      }
      categories.get(prompt.category)!.push(prompt);
    });
    return categories;
  }, [prompts]);

  // Toggle individual prompt
  const togglePrompt = (promptId: number) => {
    setSelectedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  // Toggle all prompts in a category
  const toggleCategory = (category: string) => {
    const categoryPrompts = promptsByCategory.get(category) || [];
    const allSelected = categoryPrompts.every((p) =>
      selectedPrompts.has(p.id)
    );

    setSelectedPrompts((prev) => {
      const newSet = new Set(prev);
      categoryPrompts.forEach((p) => {
        if (allSelected) {
          newSet.delete(p.id);
        } else {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  };

  // Toggle model
  const toggleModel = (model: string) => {
    setSelectedModels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(model)) {
        newSet.delete(model);
      } else {
        newSet.add(model);
      }
      return newSet;
    });
  };

  // Get job status for a specific prompt and model
  const getJobStatus = (
    promptId: number,
    model: string
  ): BatchJobStatus | undefined => {
    return jobStatuses.find(
      (job) => job.promptId === promptId && job.model === model
    );
  };

  // Check if response already exists
  const hasResponse = (promptId: number, model: string): boolean => {
    return responses.some(
      (r) => r.prompt_id === promptId && r.model === model
    );
  };

  // Get cell background color based on state
  const getCellColor = (promptId: number, model: string): string => {
    if (phase === "selection") {
      const isSelected =
        selectedPrompts.has(promptId) && selectedModels.has(model);
      if (isSelected) return "bg-blue-100 dark:bg-blue-900/30 border-blue-300";
      if (hasResponse(promptId, model))
        return "bg-green-50 dark:bg-green-900/20 border-green-200";
      return "bg-gray-50 dark:bg-gray-800 border-gray-200";
    } else {
      const status = getJobStatus(promptId, model);
      if (!status) {
        if (hasResponse(promptId, model))
          return "bg-green-100 dark:bg-green-900/30 border-green-300";
        return "bg-gray-50 dark:bg-gray-800 border-gray-200";
      }
      switch (status.status) {
        case "queued":
          return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300";
        case "running":
          return "bg-blue-200 dark:bg-blue-900/50 border-blue-400 animate-pulse";
        case "completed":
          return "bg-green-100 dark:bg-green-900/30 border-green-300";
        case "failed":
          return "bg-red-100 dark:bg-red-900/30 border-red-300";
      }
    }
  };

  // Get tooltip content for cell
  const getCellTooltip = (promptId: number, model: string, prompt: Prompt) => {
    if (phase === "selection") {
      const isSelected =
        selectedPrompts.has(promptId) && selectedModels.has(model);
      const existing = hasResponse(promptId, model);
      return (
        <div className="max-w-xs">
          <p className="font-semibold mb-1">{prompt.text}</p>
          <p className="text-xs text-muted-foreground">
            {isSelected
              ? "Selected to run"
              : existing
              ? "Response exists"
              : "Click to select"}
          </p>
        </div>
      );
    } else {
      const status = getJobStatus(promptId, model);
      return (
        <div className="max-w-xs">
          <p className="font-semibold mb-1">{prompt.text}</p>
          <p className="text-xs text-muted-foreground">
            Model: {model.split("/")[1]}
          </p>
          {status && (
            <p className="text-xs mt-1">
              Status: {status.status}
              {status.error && (
                <span className="text-red-500"> - {status.error}</span>
              )}
            </p>
          )}
          {!status && hasResponse(promptId, model) && (
            <p className="text-xs mt-1 text-green-600">
              Response already exists
            </p>
          )}
        </div>
      );
    }
  };

  // Run batch generation
  const handleRunBatch = async () => {
    if (selectedPrompts.size === 0 || selectedModels.size === 0) return;

    // Initialize job statuses
    const jobs: BatchJobStatus[] = [];
    selectedPrompts.forEach((promptId) => {
      selectedModels.forEach((model) => {
        jobs.push({
          promptId,
          model,
          status: "queued",
        });
      });
    });
    setJobStatuses(jobs);
    setPhase("execution");
    setIsRunning(true);

    // Process in batches
    const promptIds = Array.from(selectedPrompts);
    const models = Array.from(selectedModels);

    try {
      for (let i = 0; i < promptIds.length; i += batchSize) {
        const batchPromptIds = promptIds.slice(i, i + batchSize);

        // Update statuses to running for this batch
        setJobStatuses((prev) =>
          prev.map((job) =>
            batchPromptIds.includes(job.promptId) && job.status === "queued"
              ? { ...job, status: "running" }
              : job
          )
        );

        // Generate responses for this batch
        try {
          await api.generateBatchMultiple(batchPromptIds, models);

          // Mark as completed
          setJobStatuses((prev) =>
            prev.map((job) =>
              batchPromptIds.includes(job.promptId) && job.status === "running"
                ? { ...job, status: "completed" }
                : job
            )
          );
        } catch (error) {
          // Mark as failed
          setJobStatuses((prev) =>
            prev.map((job) =>
              batchPromptIds.includes(job.promptId) && job.status === "running"
                ? {
                    ...job,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                  }
                : job
            )
          );
        }

        // Refresh responses after each batch
        await onRefresh();
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Reset to selection phase
  const handleReset = () => {
    setPhase("selection");
    setJobStatuses([]);
    setSelectedPrompts(new Set());
    setSelectedModels(new Set());

    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('batchRunnerPhase');
      sessionStorage.removeItem('batchRunnerJobStatuses');
      sessionStorage.removeItem('batchRunnerSelectedPrompts');
      sessionStorage.removeItem('batchRunnerSelectedModels');
    }
  };

  // Calculate progress
  const progress = useMemo(() => {
    if (jobStatuses.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = jobStatuses.filter(
      (job) => job.status === "completed" || job.status === "failed"
    ).length;
    return {
      completed,
      total: jobStatuses.length,
      percentage: Math.round((completed / jobStatuses.length) * 100),
    };
  }, [jobStatuses]);

  return (
    <>
      <AppSidebar currentView={currentView} onNavigate={onNavigate} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">
            Batch Runner
            {phase === "execution" && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {progress.completed} / {progress.total} ({progress.percentage}%)
              </span>
            )}
          </h1>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {phase === "selection" && (
            <>
              {/* Model Selection */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3">Select Models</h3>
                  <div className="flex gap-2 flex-wrap">
                    {models.map((model) => (
                      <Button
                        key={model}
                        variant={
                          selectedModels.has(model) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => toggleModel(model)}
                      >
                        {selectedModels.has(model) && (
                          <Check className="mr-1 h-3 w-3" />
                        )}
                        {model.split("/")[1]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Batch Size Selection */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3">Batch Size</h3>
                  <div className="flex gap-2">
                    {[3, 5, 10].map((size) => (
                      <Button
                        key={size}
                        variant={batchSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBatchSize(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Process {batchSize} prompts at a time
                  </p>
                </CardContent>
              </Card>

              {/* Run Button */}
              <div className="flex gap-2 items-center">
                <Button
                  onClick={handleRunBatch}
                  disabled={
                    selectedPrompts.size === 0 || selectedModels.size === 0
                  }
                  size="lg"
                >
                  Run Selected ({selectedPrompts.size} prompts ×{" "}
                  {selectedModels.size} models = {selectedPrompts.size * selectedModels.size}{" "}
                  jobs)
                </Button>
                {(selectedPrompts.size > 0 || selectedModels.size > 0) && (
                  <Button variant="outline" onClick={handleReset}>
                    Clear Selection
                  </Button>
                )}
              </div>
            </>
          )}

          {phase === "execution" && (
            <div className="flex gap-2 items-center mb-2">
              {isRunning ? (
                <Badge variant="secondary">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Running...
                </Badge>
              ) : (
                <Badge variant="default">Complete</Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                New Batch
              </Button>
            </div>
          )}

          {/* Grid */}
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Header Row with Models */}
                <div className="flex gap-1 mb-1 ml-32">
                  {models.map((model) => (
                    <div
                      key={model}
                      className="w-24 text-xs font-medium text-center p-2"
                    >
                      {model.split("/")[1]}
                    </div>
                  ))}
                </div>

                {/* Category Rows */}
                {Array.from(promptsByCategory.entries()).map(
                  ([category, categoryPrompts]) => (
                    <div key={category} className="mb-4">
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {phase === "selection" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCategory(category)}
                            className="w-28"
                          >
                            {categoryPrompts.every((p) =>
                              selectedPrompts.has(p.id)
                            ) ? (
                              <Check className="mr-1 h-3 w-3" />
                            ) : null}
                            {category}
                          </Button>
                        )}
                        {phase === "execution" && (
                          <Badge variant="secondary" className="w-28">
                            {category}
                          </Badge>
                        )}
                      </div>

                      {/* Prompt Rows */}
                      {categoryPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="flex gap-1 mb-1 items-center"
                        >
                          {/* Prompt Label */}
                          <div className="w-32 text-xs truncate pr-2">
                            Prompt {prompt.id}
                          </div>

                          {/* Model Cells */}
                          {models.map((model) => (
                            <Tooltip key={model}>
                              <TooltipTrigger asChild>
                                <button
                                  className={`w-24 h-12 border-2 rounded transition-colors ${getCellColor(
                                    prompt.id,
                                    model
                                  )} ${
                                    phase === "selection"
                                      ? "cursor-pointer hover:opacity-80"
                                      : "cursor-default"
                                  }`}
                                  onClick={() => {
                                    if (phase === "selection") {
                                      // Toggle both prompt and model
                                      if (!selectedPrompts.has(prompt.id)) {
                                        setSelectedPrompts(
                                          (prev) => new Set(prev).add(prompt.id)
                                        );
                                      }
                                      if (!selectedModels.has(model)) {
                                        setSelectedModels(
                                          (prev) => new Set(prev).add(model)
                                        );
                                      }
                                      // If both were already selected, deselect the prompt
                                      if (
                                        selectedPrompts.has(prompt.id) &&
                                        selectedModels.has(model)
                                      ) {
                                        togglePrompt(prompt.id);
                                      }
                                    }
                                  }}
                                  disabled={phase === "execution"}
                                >
                                  <div className="flex items-center justify-center h-full">
                                    {phase === "execution" &&
                                      getJobStatus(prompt.id, model)
                                        ?.status === "running" && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      )}
                                    {(phase === "execution" &&
                                      getJobStatus(prompt.id, model)
                                        ?.status === "completed") ||
                                    (phase === "selection" &&
                                      hasResponse(prompt.id, model)) ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : null}
                                  </div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {getCellTooltip(prompt.id, model, prompt)}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </SidebarInset>
    </>
  );
}
