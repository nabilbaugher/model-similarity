"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Response, MODELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PracticeModeProps {
  responses: Response[];
  onExit: () => void;
}

export default function PracticeMode({ responses, onExit }: PracticeModeProps) {
  const [shuffledResponses, setShuffledResponses] = useState<Response[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [guess, setGuess] = useState<string>("");
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (!responses?.length) {
      setShuffledResponses([]);
      setCurrentIndex(0);
      setGuess("");
      setIsFlipped(false);
      setScore({ correct: 0, total: 0 });
      return;
    }

    const shuffled = [...responses].sort(() => Math.random() - 0.5);
    setShuffledResponses(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setGuess("");
    setScore({ correct: 0, total: 0 });
  }, [responses]);

  const currentResponse = shuffledResponses[currentIndex];
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const handleFlip = () => {
    if (!currentResponse || !guess || isFlipped) return;

    const isCorrect = guess === currentResponse.model;
    setIsFlipped(true);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
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

  if (!shuffledResponses.length) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-xl">No responses yet</CardTitle>
          <CardDescription>
            Generate a few batches first so we can build a study deck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onExit}>Back to workspace</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Practice mode</h2>
          <p className="text-sm text-muted-foreground">
            Guess which model wrote the response, then reveal the answer to track your score.
          </p>
        </div>
        <Button variant="outline" onClick={onExit}>
          Exit practice
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Correct</CardDescription>
            <CardTitle className="text-3xl font-semibold">{score.correct}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total revealed</CardDescription>
            <CardTitle className="text-3xl font-semibold">{score.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accuracy</CardDescription>
            <CardTitle className="text-3xl font-semibold">{accuracy}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit uppercase tracking-wide">
              Prompt #{currentResponse.prompt_id ?? currentIndex + 1}
            </Badge>
            <CardTitle className="text-xl leading-tight">
              {currentResponse.prompt}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {shuffledResponses.length}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">Selected</p>
            <p className="text-base font-semibold text-foreground">
              {guess ? guess.split("/")[1] : "None"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Response
            </p>
            <ScrollArea className="h-[280px] rounded-lg border bg-muted/30 p-4">
              <div className="prose max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentResponse.response}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </div>

          {isFlipped && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Actual model
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{currentResponse.model}</Badge>
                <span className="text-sm font-medium">
                  {guess === currentResponse.model
                    ? "Nice! You nailed it."
                    : `Not quite — you picked ${guess.split("/")[1]}`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Which model generated this?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODELS.map((model) => {
                const label = model.split("/")[1];
                return (
                  <Button
                    key={model}
                    variant={guess === model ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => {
                      setGuess(model);
                      if (isFlipped) {
                        setIsFlipped(false);
                      }
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === shuffledResponses.length - 1}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {!isFlipped ? (
              <Button onClick={handleFlip} disabled={!guess}>
                Reveal answer
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  if (currentIndex === shuffledResponses.length - 1) {
                    setIsFlipped(false);
                    setGuess("");
                  } else {
                    handleNext();
                  }
                }}
              >
                {currentIndex === shuffledResponses.length - 1
                  ? "Restart card"
                  : "Continue"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
