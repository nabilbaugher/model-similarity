"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Response, MODELS } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface PracticeModeProps {
  responses: Response[];
  onBack: () => void;
}

export default function PracticeMode({ responses, onBack }: PracticeModeProps) {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              No responses yet. Generate some first!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scorePercentage = score.total > 0
    ? Math.round((score.correct / score.total) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Score Card */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-base px-4 py-2">
          Card {currentIndex + 1} of {shuffledResponses.length}
        </Badge>
        <Badge variant="outline" className="text-base px-4 py-2">
          Score: {score.correct}/{score.total} ({scorePercentage}%)
        </Badge>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                PROMPT
              </p>
              <p className="text-base italic">
                {currentResponse.prompt}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              RESPONSE
            </p>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentResponse.response}
              </ReactMarkdown>
            </div>
          </div>

          {isFlipped && (
            <Card className="bg-primary/10 border-primary">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold mb-1">
                  ACTUAL MODEL
                </p>
                <p className="text-lg font-bold mb-3">
                  {currentResponse.model}
                </p>
                <p
                  className={`font-semibold ${
                    guess === currentResponse.model
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {guess === currentResponse.model
                    ? "Correct!"
                    : `Wrong - you guessed ${guess}`}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          {!isFlipped && (
            <div className="w-full space-y-3">
              <p className="text-sm font-semibold">
                Which model generated this?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MODELS.map((model) => (
                  <Button
                    key={model}
                    variant={guess === model ? "default" : "outline"}
                    onClick={() => setGuess(model)}
                    className="w-full"
                  >
                    {model.split("/")[1]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between w-full gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {!isFlipped ? (
              <Button
                onClick={handleFlip}
                disabled={!guess}
              >
                <Eye className="h-4 w-4 mr-2" />
                Reveal Answer
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentIndex === shuffledResponses.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
