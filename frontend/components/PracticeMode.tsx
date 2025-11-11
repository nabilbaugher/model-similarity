"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Response, View } from "@/lib/types";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PracticeModeProps {
  responses: Response[];
  models: string[];
  onBack: () => void;
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function PracticeMode({
  responses,
  models,
  currentView,
  onNavigate,
}: PracticeModeProps) {
  const [shuffledResponses, setShuffledResponses] = useState<Response[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [guess, setGuess] = useState<string>("");
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    // Shuffle responses when component mounts or responses change
    const shuffled = [...responses].sort(() => Math.random() - 0.5);
    setShuffledResponses(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setGuess("");
  }, [responses]);

  const currentResponse = shuffledResponses[currentIndex];

  const handleFlip = () => {
    if (!isFlipped && guess) {
      setIsFlipped(true);
      const isCorrect = guess === currentResponse.model;
      setScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledResponses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setGuess("");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setGuess("");
    }
  };

  if (shuffledResponses.length === 0) {
    return (
      <>
        <AppSidebar currentView={currentView} onNavigate={onNavigate} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Practice Mode</h1>
          </header>
          <div className="flex flex-1 items-center justify-center p-4">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>No Responses Available</CardTitle>
                <CardDescription>
                  Generate some responses first to start practicing!
                </CardDescription>
              </CardHeader>
            </Card>
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
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">Practice Mode</h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base px-3 py-1">
                Card {currentIndex + 1} of {shuffledResponses.length}
              </Badge>
              <Badge className="text-base px-3 py-1">
                Score: {score.correct}/{score.total} (
                {score.total > 0
                  ? Math.round((score.correct / score.total) * 100)
                  : 0}
                %)
              </Badge>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
          <Card className="flex-1">
            <CardHeader>
              <CardDescription className="uppercase text-xs">PROMPT</CardDescription>
              <CardTitle className="text-base font-normal italic text-muted-foreground">
                {currentResponse.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <CardDescription className="uppercase text-xs mb-3">RESPONSE</CardDescription>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentResponse.response}
                  </ReactMarkdown>
                </div>
              </div>

              {isFlipped && (
                <Card className="bg-primary/10 border-primary">
                  <CardHeader>
                    <CardDescription className="uppercase text-xs">ACTUAL MODEL</CardDescription>
                    <CardTitle className="text-primary">
                      {currentResponse.model}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`font-semibold ${
                      guess === currentResponse.model
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {guess === currentResponse.model
                        ? "Correct!"
                        : `Wrong - you guessed ${guess}`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {!isFlipped && (
            <Card>
              <CardHeader>
                <CardDescription>Which model generated this response?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {models.map((model) => (
                    <Button
                      key={model}
                      variant={guess === model ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setGuess(model)}
                    >
                      {model.split("/")[1]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {!isFlipped ? (
              <Button
                onClick={handleFlip}
                disabled={!guess}
              >
                Reveal Answer
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentIndex === shuffledResponses.length - 1}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
