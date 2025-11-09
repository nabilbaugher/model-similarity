"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Response, MODELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="w-full h-full flex items-center justify-center">
        <Card className="p-8 max-w-sm">
          <div className="text-center">
            <div className="text-slate-600 mb-4">
              No responses yet. Generate some first!
            </div>
            <Button onClick={onBack}>Back to Generate</Button>
          </div>
        </Card>
      </div>
    );
  }

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="w-full p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Practice Mode</h1>
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-900">
              {score.correct}/{score.total}
            </div>
            <div className="text-sm text-slate-600">{accuracy}% correct</div>
          </div>
        </div>

        <div className="mb-4 text-center text-slate-600">
          Card {currentIndex + 1} of {shuffledResponses.length}
        </div>

        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="mb-6">
              <div className="text-sm font-semibold text-slate-500 uppercase mb-2">
                Prompt
              </div>
              <div className="text-slate-700 italic mb-6">
                {currentResponse.prompt}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-semibold text-slate-500 uppercase mb-2">
                Response
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentResponse.response}
                </ReactMarkdown>
              </div>
            </div>

            {isFlipped && (
              <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-sm font-semibold text-slate-700 mb-2">
                  ACTUAL MODEL
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-3">
                  {currentResponse.model}
                </div>
                <div
                  className={`font-semibold text-lg ${
                    guess === currentResponse.model
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {guess === currentResponse.model
                    ? "✓ Correct!"
                    : `✗ Wrong - you guessed ${guess}`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!isFlipped && (
          <div className="mb-8">
            <div className="text-sm font-semibold text-slate-700 mb-4">
              Which model generated this?
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map((model) => (
                <Button
                  key={model}
                  onClick={() => setGuess(model)}
                  variant={guess === model ? "default" : "outline"}
                  size="lg"
                >
                  {model.split("/")[1]}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
          >
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
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
