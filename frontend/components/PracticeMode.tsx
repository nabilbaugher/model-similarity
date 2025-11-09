"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Response, MODELS } from "@/lib/types";

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">
            No responses yet. Generate some first!
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Back to Generate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Practice Mode</h1>
          <div className="text-lg font-semibold text-gray-700">
            Score: {score.correct}/{score.total} (
            {score.total > 0
              ? Math.round((score.correct / score.total) * 100)
              : 0}
            %)
          </div>
        </div>

        <div className="mb-4 text-center text-gray-600">
          Card {currentIndex + 1} of {shuffledResponses.length}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 min-h-[400px] flex flex-col">
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-500 mb-2">
              PROMPT
            </div>
            <div className="text-gray-700 italic mb-6">
              {currentResponse.prompt}
            </div>
          </div>

          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-500 mb-2">
              RESPONSE
            </div>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentResponse.response}
              </ReactMarkdown>
            </div>
          </div>

          {isFlipped && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-semibold text-blue-900 mb-1">
                ACTUAL MODEL
              </div>
              <div className="text-lg font-bold text-blue-700">
                {currentResponse.model}
              </div>
              <div
                className={`mt-2 font-semibold ${
                  guess === currentResponse.model
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {guess === currentResponse.model
                  ? "Correct!"
                  : `Wrong - you guessed ${guess}`}
              </div>
            </div>
          )}
        </div>

        {!isFlipped && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Which model generated this?
            </div>
            <div className="flex gap-3">
              {MODELS.map((model) => (
                <button
                  key={model}
                  onClick={() => setGuess(model)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    guess === model
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {model.split("/")[1]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
          >
            Previous
          </button>

          {!isFlipped ? (
            <button
              onClick={handleFlip}
              disabled={!guess}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Reveal Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentIndex === shuffledResponses.length - 1}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
