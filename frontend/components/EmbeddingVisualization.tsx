"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { EmbeddingMetadata, EmbeddingPoint, View } from "@/lib/types";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface EmbeddingVisualizationProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

// Generate distinct colors using HSL color space
const generateDistinctColors = (count: number): string[] => {
  const colors: string[] = [];
  const hueStep = 360 / count;

  for (let i = 0; i < count; i++) {
    const hue = (i * hueStep) % 360;
    // Use high saturation and varied lightness for distinct colors
    const saturation = 70 + (i % 3) * 10;
    const lightness = 45 + (i % 4) * 10;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
};

// Provider to shape mapping
const providerShapes: Record<string, string> = {
  "anthropic": "circle",
  "openai": "square",
  "google": "triangle",
  "x-ai": "diamond",
  "minimax": "star",
  "openrouter": "wye",
  "deepseek": "cross",
};

const getProviderShape = (provider: string): string => {
  return providerShapes[provider] || "circle";
};

export default function EmbeddingVisualization({
  currentView,
  onNavigate,
}: EmbeddingVisualizationProps) {
  const [metadata, setMetadata] = useState<EmbeddingMetadata | null>(null);
  const [modelProviders, setModelProviders] = useState<Record<string, string>>({});
  const [selectedModelsForGeneration, setSelectedModelsForGeneration] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [centerByPrompt, setCenterByPrompt] = useState(true);
  const [allVisualizationData, setAllVisualizationData] = useState<EmbeddingPoint[] | null>(null);
  const [visibleModels, setVisibleModels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await api.getConfig();
      setModelProviders(config.model_providers);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  const loadMetadata = async () => {
    try {
      const data = await api.getEmbeddingMetadata();
      setMetadata(data);
      // Select all models and categories by default
      setSelectedModelsForGeneration(data.models);
      setSelectedCategories(data.categories);
    } catch (err) {
      console.error("Failed to load metadata:", err);
      setError("Failed to load metadata");
    }
  };

  const toggleModelForGeneration = (model: string) => {
    setSelectedModelsForGeneration((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleModelVisibility = (model: string) => {
    setVisibleModels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(model)) {
        newSet.delete(model);
      } else {
        newSet.add(model);
      }
      return newSet;
    });
  };

  const generateVisualization = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.visualizeEmbeddings(
        selectedModelsForGeneration,
        selectedCategories,
        centerByPrompt
      );
      console.log("Visualization data sample:", result.data[0]); // Debug log
      setAllVisualizationData(result.data);
      // Show all models by default
      const allModels = new Set(result.data.map((p: EmbeddingPoint) => p.model));
      setVisibleModels(allModels);
    } catch (err: any) {
      console.error("Failed to generate visualization:", err);
      setError(err.message || "Failed to generate visualization");
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on visible models
  const visibleData = useMemo(() => {
    if (!allVisualizationData) return [];
    return allVisualizationData.filter(point => visibleModels.has(point.model));
  }, [allVisualizationData, visibleModels]);

  // Get unique models in the current visualization
  const modelsInVisualization = useMemo(() => {
    if (!allVisualizationData) return [];
    return Array.from(new Set(allVisualizationData.map(p => p.model)));
  }, [allVisualizationData]);

  // Generate colors for models
  const modelColors = useMemo(() => {
    const colors = generateDistinctColors(modelsInVisualization.length);
    const colorMap: Record<string, string> = {};
    modelsInVisualization.forEach((model, i) => {
      colorMap[model] = colors[i];
    });
    return colorMap;
  }, [modelsInVisualization]);

  // Calculate fixed domain based on all data (not just visible)
  const chartDomain = useMemo(() => {
    if (!allVisualizationData || allVisualizationData.length === 0) {
      return { xDomain: [0, 1], yDomain: [0, 1] };
    }

    const xValues = allVisualizationData.map(p => p.x);
    const yValues = allVisualizationData.map(p => p.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Add 5% padding
    const xPadding = (xMax - xMin) * 0.05;
    const yPadding = (yMax - yMin) * 0.05;

    return {
      xDomain: [xMin - xPadding, xMax + xPadding] as [number, number],
      yDomain: [yMin - yPadding, yMax + yPadding] as [number, number],
    };
  }, [allVisualizationData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      console.log("Tooltip data:", data); // Debug log
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg max-w-sm">
          <p className="font-semibold text-sm mb-1">
            Model: {data.model?.split("/")[1] || data.model}
          </p>
          <p className="text-xs text-muted-foreground mb-1">
            Provider: {data.provider || "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mb-1">
            Category: {data.category}
          </p>
          <p className="text-xs mt-2">
            <span className="font-medium">Prompt:</span> {data.prompt}
          </p>
          <p className="text-xs mt-1">
            <span className="font-medium">Response:</span> {data.response_preview}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!metadata) {
    return (
      <>
        <AppSidebar currentView={currentView} onNavigate={onNavigate} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Embedding Visualization</h1>
          </header>
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </>
    );
  }

  return (
    <>
      <AppSidebar currentView={currentView} onNavigate={onNavigate} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">Embedding Visualization</h1>
        </header>

        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          {/* Main Content Area - Center */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Placeholder when no visualization exists */}
            {!allVisualizationData && (
              <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 flex items-center justify-center p-12">
                  <div className="text-center space-y-4 max-w-md">
                    <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <RefreshCw className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Visualization Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure your filters in the panel on the right and click "Generate Visualization" to create an embedding space visualization.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visualization */}
            {allVisualizationData && (
              <>
                {/* Model Visibility Toggles - Compact horizontal bar */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Label className="text-sm font-medium">Visible Models:</Label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {modelsInVisualization.map((model) => (
                          <div key={model} className="flex items-center space-x-2">
                            <Checkbox
                              id={`vis-${model}`}
                              checked={visibleModels.has(model)}
                              onCheckedChange={() => toggleModelVisibility(model)}
                            />
                            <label
                              htmlFor={`vis-${model}`}
                              className="text-sm cursor-pointer flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: modelColors[model] }}
                              />
                              {model.split("/")[1]}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Main Visualization Card */}
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader>
                    <CardTitle>
                      Embedding Space Visualization
                      <Badge variant="outline" className="ml-2">
                        {visibleData.length} / {allVisualizationData.length} points
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {centerByPrompt
                        ? "Prompt-centered: model differences are isolated from prompt content"
                        : "Raw embeddings: includes both model and prompt signals"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[min(100%,calc(100vh-300px))] aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="X"
                            domain={chartDomain.xDomain}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Y"
                            domain={chartDomain.yDomain}
                          />
                          <ZAxis range={[100, 100]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Scatter
                            name="Models"
                            data={visibleData}
                            isAnimationActive={false}
                            shape={(props: any) => {
                              const { cx, cy, payload } = props;
                              const model = payload.model;
                              const provider = payload.provider;
                              const color = modelColors[model];
                              const size = 8;

                              // Draw different shapes based on provider
                              const shape = getProviderShape(provider);

                              if (shape === "circle") {
                                return <circle cx={cx} cy={cy} r={size} fill={color} opacity={0.7} />;
                              } else if (shape === "square") {
                                return <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill={color} opacity={0.7} />;
                              } else if (shape === "triangle") {
                                const path = `M ${cx},${cy - size} L ${cx + size},${cy + size} L ${cx - size},${cy + size} Z`;
                                return <path d={path} fill={color} opacity={0.7} />;
                              } else if (shape === "diamond") {
                                const path = `M ${cx},${cy - size} L ${cx + size},${cy} L ${cx},${cy + size} L ${cx - size},${cy} Z`;
                                return <path d={path} fill={color} opacity={0.7} />;
                              } else if (shape === "star") {
                                const outerRadius = size;
                                const innerRadius = size * 0.5;
                                const points = [];
                                for (let i = 0; i < 5; i++) {
                                  const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                                  const outerX = cx + outerRadius * Math.cos(angle);
                                  const outerY = cy + outerRadius * Math.sin(angle);
                                  points.push(`${outerX},${outerY}`);

                                  const innerAngle = angle + (2 * Math.PI) / 10;
                                  const innerX = cx + innerRadius * Math.cos(innerAngle);
                                  const innerY = cy + innerRadius * Math.sin(innerAngle);
                                  points.push(`${innerX},${innerY}`);
                                }
                                return <polygon points={points.join(' ')} fill={color} opacity={0.7} />;
                              } else if (shape === "cross") {
                                const width = size * 0.5;
                                return (
                                  <g>
                                    <rect x={cx - width / 2} y={cy - size} width={width} height={size * 2} fill={color} opacity={0.7} />
                                    <rect x={cx - size} y={cy - width / 2} width={size * 2} height={width} fill={color} opacity={0.7} />
                                  </g>
                                );
                              } else {
                                // Default to circle
                                return <circle cx={cx} cy={cy} r={size} fill={color} opacity={0.7} />;
                              }
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Compact Legend */}
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Model Colors */}
                      <div>
                        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Models</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {modelsInVisualization.map((model) => (
                            <div key={model} className="flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: modelColors[model] }}
                              />
                              <span>{model.split("/")[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Provider Shapes */}
                      <div>
                        <h4 className="text-xs font-medium mb-2 text-muted-foreground">Provider Shapes</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {Object.entries(providerShapes).map(([provider, shape]) => (
                            <div key={provider} className="flex items-center gap-1.5">
                              <span className="font-mono text-muted-foreground">{shape}</span>
                              <span>{provider}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Right Sidebar - Generation Options */}
          <div className="w-80 flex-shrink-0 overflow-y-auto">
            <Card className="sticky top-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Generation Options</CardTitle>
                <CardDescription className="text-xs">
                  Configure visualization filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Models</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {metadata.models.map((model) => (
                      <div key={model} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gen-${model}`}
                          checked={selectedModelsForGeneration.includes(model)}
                          onCheckedChange={() => toggleModelForGeneration(model)}
                        />
                        <label
                          htmlFor={`gen-${model}`}
                          className="text-xs cursor-pointer flex-1 flex items-center justify-between"
                        >
                          <span>{model.split("/")[1]}</span>
                          {metadata.model_counts[model] && (
                            <Badge variant="outline" className="text-xs h-5">
                              {metadata.model_counts[model]}
                            </Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Category Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Categories</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {metadata.categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <label
                          htmlFor={`cat-${category}`}
                          className="text-xs cursor-pointer flex-1 flex items-center justify-between"
                        >
                          <span>{category}</span>
                          {metadata.category_counts[category] && (
                            <Badge variant="outline" className="text-xs h-5">
                              {metadata.category_counts[category]}
                            </Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Center by Prompt */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="center"
                    checked={centerByPrompt}
                    onCheckedChange={(checked) => setCenterByPrompt(checked as boolean)}
                  />
                  <label htmlFor="center" className="text-xs cursor-pointer">
                    Center by prompt (isolate model differences)
                  </label>
                </div>

                <Separator />

                {/* Generate Button */}
                <Button
                  onClick={generateVisualization}
                  disabled={loading || selectedModelsForGeneration.length === 0}
                  className="w-full"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-2 text-xs text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
