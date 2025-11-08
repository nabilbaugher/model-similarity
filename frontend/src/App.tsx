import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Prompt {
  id: number;
  text: string;
  category: string;
}

interface Response {
  prompt_id?: number;
  prompt: string;
  model: string;
  response: string;
}

const MODELS = [
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-5",
  "google/gemini-2.5-pro",
  "anthropic/claude-haiku-4.5",
];

type View = "generate" | "review" | "practice";

function App() {
  const [view, setView] = useState<View>("generate");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedModels, setSelectedModels] = useState<
    Record<number, string[]>
  >({});
  const [generating, setGenerating] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadPrompts();
    loadResponses();
  }, []);

  const loadPrompts = () => {
    fetch("http://localhost:8000/prompts")
      .then((res) => res.json())
      .then((data) => setPrompts(data))
      .catch((err) => console.error("Failed to load prompts:", err));
  };

  const loadResponses = () => {
    fetch("http://localhost:8000/responses")
      .then((res) => res.json())
      .then((data) => setResponses(data))
      .catch((err) => console.error("Failed to load responses:", err));
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
      await fetch("http://localhost:8000/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_id: promptId, models }),
      });
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
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Generate Responses
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setView("review")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Review
              </button>
              <button
                onClick={() => startPractice(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Practice All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {prompt.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({getResponseCount(prompt.id)} responses)
                      </span>
                    </div>
                    <div className="text-gray-800">{prompt.text}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Select models:
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {MODELS.map((model) => {
                      const hasResponse = responses.some(
                        (r) => r.prompt_id === prompt.id && r.model === model
                      );
                      const isSelected = (
                        selectedModels[prompt.id] || []
                      ).includes(model);
                      return (
                        <button
                          key={model}
                          onClick={() => toggleModel(prompt.id, model)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : hasResponse
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {model.split("/")[1]} {hasResponse && "✓"}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleGenerate(prompt.id)}
                    disabled={
                      !selectedModels[prompt.id]?.length ||
                      generating[prompt.id]
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                  >
                    {generating[prompt.id] ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      />
    );
  }

  const filteredResponses = selectedPromptId
    ? responses.filter((r) => r.prompt_id === selectedPromptId)
    : responses;

  return (
    <PracticeMode
      responses={filteredResponses}
      onBack={() => setView("generate")}
    />
  );
}

function PracticeMode({
  responses,
  onBack,
}: {
  responses: Response[];
  onBack: () => void;
}) {
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

function ReviewMode({
  prompts,
  responses,
  onBack,
  onPractice,
  onRefresh,
}: {
  prompts: Prompt[];
  responses: Response[];
  onBack: () => void;
  onPractice: (promptId: number) => void;
  onRefresh: () => void;
}) {
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);

  const getPromptResponses = (promptId: number) => {
    return responses.filter((r) => r.prompt_id === promptId);
  };

  const handleDelete = async (promptId: number, model: string) => {
    if (!confirm(`Delete response from ${model}?`)) return;

    try {
      await fetch(
        `http://localhost:8000/responses/${promptId}?model=${encodeURIComponent(
          model
        )}`,
        {
          method: "DELETE",
        }
      );
      onRefresh();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleExpand = (promptId: number) => {
    setExpandedPromptId(expandedPromptId === promptId ? null : promptId);
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Review Responses</h1>
          <div className="w-24"></div>
        </div>

        <div className="space-y-4">
          {prompts.map((prompt) => {
            const promptResponses = getPromptResponses(prompt.id);
            const isExpanded = expandedPromptId === prompt.id;

            if (promptResponses.length === 0) return null;

            return (
              <div key={prompt.id} className="bg-white rounded-lg shadow">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(prompt.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {prompt.category}
                        </span>
                        <span className="text-xs text-blue-600 font-semibold">
                          {promptResponses.length} response
                          {promptResponses.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-gray-800">{prompt.text}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPractice(prompt.id);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Practice
                      </button>
                      <span className="text-gray-400">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 space-y-4">
                    {promptResponses.map((response, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-semibold text-gray-700">
                            {response.model}
                          </div>
                          <button
                            onClick={() =>
                              handleDelete(prompt.id, response.model)
                            }
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="prose max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response.response}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {prompts.filter((p) => getPromptResponses(p.id).length > 0).length ===
          0 && (
          <div className="text-center text-gray-600 mt-12">
            No responses generated yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
