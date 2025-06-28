"use client";

import { useState } from "react";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Check,
  Brain,
  Search,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestion?: {
    action: string;
    preview: string;
    type?: "validation" | "search" | "correction" | "rule";
    data?: any;
  };
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        'Hi! I\'m your AI assistant. I can help you:\n• Fix data issues and validate your files\n• Search data with natural language\n• Create optimization rules\n• Generate data corrections\n\nTry asking: "Fix all broken JSON fields", "Show tasks with duration > 2", or "Create co-run rule for T1 and T2".',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sessionId, sessionData, validateCurrentSession } = useSession();

  const quickSuggestions = [
    "Run AI validation on my data",
    "Show tasks with duration > 2 and prefer phase 2",
    "Fix all broken JSON fields",
    "Find workers with missing skills",
    "Generate data correction suggestions",
    "Check for skill coverage issues",
  ];

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await getAIResponse(currentInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        timestamp: new Date(),
        suggestion: response.suggestion,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = async (
    input: string
  ): Promise<{ content: string; suggestion?: any }> => {
    const lowerInput = input.toLowerCase();

    // Check if we have session data
    if (!sessionId || Object.keys(sessionData).length === 0) {
      return {
        content:
          "Please upload your data files first. I need clients.csv, workers.csv, and tasks.csv to help you.",
      };
    }

    // AI Validation
    if (
      lowerInput.includes("validation") ||
      lowerInput.includes("validate") ||
      lowerInput.includes("ai validation")
    ) {
      try {
        const response = await fetch("/api/ai-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();
        if (result.success) {
          const errorCount = result.aiValidation.errors.length;
          const correctionCount = result.corrections.length;

          // Better messaging based on actual results
          let content = `AI validation complete! `;

          if (errorCount > 0) {
            content += `Found ${errorCount} potential issues. `;
          } else {
            content += `No issues detected. `;
          }

          if (correctionCount > 0) {
            content += `Generated ${correctionCount} correction suggestions.`;

            return {
              content,
              suggestion: {
                action: "Apply AI Corrections",
                preview: `${correctionCount} smart corrections available`,
                type: "correction",
                data: result.corrections,
              },
            };
          } else {
            content += `No corrections available - your data looks good!`;
            return { content };
          }
        }
      } catch (error) {
        console.error("AI validation failed:", error);
        return {
          content:
            "AI validation failed. Please check your data upload and try again.",
        };
      }
    }

    // Natural Language Search
    if (
      lowerInput.includes("show") ||
      lowerInput.includes("find") ||
      lowerInput.includes("search")
    ) {
      try {
        const response = await fetch("/api/nl-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, query: input }),
        });

        const result = await response.json();
        if (result.success) {
          const resultCount = result.results.results.length;

          return {
            content: `Found ${resultCount} records matching "${input}". ${result.results.explanation}`,
            suggestion: {
              action: "View Search Results",
              preview: `${resultCount} records found in ${result.results.targetTable}`,
              type: "search",
              data: result.results,
            },
          };
        }
      } catch (error) {
        console.error("Natural language search failed:", error);
      }
    }

    // Data Correction
    if (
      lowerInput.includes("fix") ||
      lowerInput.includes("correct") ||
      lowerInput.includes("repair")
    ) {
      if (lowerInput.includes("json")) {
        return {
          content:
            "I found issues with JSON fields in your data. I can automatically fix malformed JSON entries.",
          suggestion: {
            action: "Fix JSON Fields",
            preview: "Auto-repair malformed JSON entries",
            type: "correction",
            data: { type: "json" },
          },
        };
      }

      try {
        const response = await fetch("/api/ai-correct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, autoApply: false }),
        });

        const result = await response.json();
        if (result.success) {
          return {
            content: `I've analyzed your data and found ${result.suggestions.length} potential corrections. These are AI-generated suggestions based on data patterns.`,
            suggestion: {
              action: "Apply All Corrections",
              preview: `${result.suggestions.length} smart corrections ready`,
              type: "correction",
              data: result.suggestions,
            },
          };
        }
      } catch (error) {
        console.error("Data correction failed:", error);
      }
    }

    // Skill Coverage Analysis
    if (lowerInput.includes("skill") || lowerInput.includes("coverage")) {
      const tasksData = sessionData.tasks?.data || [];
      const workersData = sessionData.workers?.data || [];

      const uncoveredSkills = [];
      tasksData.forEach((task) => {
        if (task.RequiredSkills) {
          const skills = task.RequiredSkills.split(",").map((s: string) =>
            s.trim()
          );
          skills.forEach((skill) => {
            const hasWorker = workersData.some(
              (worker) => worker.Skills && worker.Skills.includes(skill)
            );
            if (!hasWorker && !uncoveredSkills.includes(skill)) {
              uncoveredSkills.push(skill);
            }
          });
        }
      });

      return {
        content:
          uncoveredSkills.length > 0
            ? `Found ${
                uncoveredSkills.length
              } skills without worker coverage: ${uncoveredSkills.join(", ")}`
            : "Great! All required skills are covered by your workers.",
      };
    }

    // Duration Analysis
    if (lowerInput.includes("duration") && lowerInput.includes("2")) {
      const tasksData = sessionData.tasks?.data || [];
      const longTasks = tasksData.filter(
        (task) => parseFloat(task.Duration) > 2
      );

      return {
        content: `Found ${longTasks.length} tasks with duration > 2 hours. These tasks might need special handling or experienced workers.`,
        suggestion: {
          action: "Highlight Long Tasks",
          preview: `${longTasks.length} tasks need attention`,
          type: "search",
          data: { results: longTasks, targetTable: "tasks" },
        },
      };
    }

    // Co-run Rules
    if (
      lowerInput.includes("co-run") ||
      (lowerInput.includes("t1") && lowerInput.includes("t2"))
    ) {
      return {
        content:
          "I can create a co-run rule linking tasks together. This ensures they're assigned to workers who can handle both tasks simultaneously.",
        suggestion: {
          action: "Create Co-run Rule",
          preview: "Link tasks T1 and T2 for joint execution",
          type: "rule",
          data: { type: "co-run", tasks: ["T1", "T2"] },
        },
      };
    }

    // Default fallback with better context
    return {
      content:
        "I can help you with data validation, natural language search, fixing data issues, and creating optimization rules. What would you like me to help you with?",
    };
  };

  const applySuggestion = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.suggestion) return;

    setIsLoading(true);
    try {
      const { suggestion } = message;

      switch (suggestion.type) {
        case "validation":
          await validateCurrentSession();
          break;

        case "correction":
          if (suggestion.data?.type === "json") {
            // Handle JSON fix specifically - could implement later
            console.log("JSON fixes not yet implemented");
          } else {
            // ✅ FIXED: Apply AI corrections with proper error handling
            try {
              const response = await fetch("/api/ai-correct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  suggestions: suggestion.data,
                  autoApply: true,
                }),
              });

              const result = await response.json();

              if (response.ok && result.success) {
                const successMessage: Message = {
                  id: Date.now().toString(),
                  type: "assistant",
                  content: `✅ Successfully applied ${
                    result.appliedCount
                  } corrections to your data! Files updated: ${
                    result.correctedFiles?.join(", ") || "unknown"
                  }`,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, successMessage]);

                // ✅ Trigger a validation refresh after corrections
                setTimeout(async () => {
                  if (validateCurrentSession) {
                    await validateCurrentSession();
                  }
                }, 1000);
              } else {
                throw new Error(
                  result.error || result.details || "Unknown error"
                );
              }
            } catch (correctionError) {
              console.error("Failed to apply corrections:", correctionError);
              const errorMessage: Message = {
                id: Date.now().toString(),
                type: "assistant",
                content: `❌ Failed to apply corrections: ${
                  correctionError instanceof Error
                    ? correctionError.message
                    : String(correctionError)
                }`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
            }
          }
          break;

        case "search":
          // Could integrate with data grid to highlight results
          console.log("Search results:", suggestion.data);
          break;

        case "rule":
          // Could integrate with rule builder
          console.log("Creating rule:", suggestion.data);
          break;
      }
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: "Failed to apply the suggestion. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectSuggestion = (messageId: string) => {
    console.log("Rejecting suggestion for message:", messageId);
    // Remove suggestion from the message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, suggestion: undefined } : msg
      )
    );
  };

  const getSuggestionIcon = (type?: string) => {
    switch (type) {
      case "validation":
        return <Brain className="h-3 w-3 mr-1" />;
      case "search":
        return <Search className="h-3 w-3 mr-1" />;
      case "correction":
        return <Wand2 className="h-3 w-3 mr-1" />;
      case "rule":
        return <Settings className="h-3 w-3 mr-1" />;
      default:
        return <Check className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90 shadow-lg z-50"
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {/* AI Assistant Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#181825] border-l border-[#313244] z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#313244]">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-[#cba6f7] rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-[#1e1e2e]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#cdd6f4]">AI Assistant</h3>
                  <p className="text-xs text-[#6c7086]">
                    AI-powered data processing & validation
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Session Status */}
            <div className="px-4 py-2 border-b border-[#313244] bg-[#1e1e2e]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6c7086]">Session Status:</span>
                <Badge
                  variant="outline"
                  className={
                    Object.keys(sessionData).length > 0
                      ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                      : "bg-[#f38ba8]/20 text-[#f38ba8] border-[#f38ba8]/30"
                  }
                >
                  {Object.keys(sessionData).length > 0
                    ? `${Object.keys(sessionData).length} files loaded`
                    : "No data"}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-[#cba6f7] text-[#1e1e2e]"
                        : "bg-[#313244] text-[#cdd6f4]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">
                      {message.content}
                    </p>
                    {message.suggestion && (
                      <div className="mt-3 p-2 bg-[#45475a] rounded border border-[#585b70]">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="outline"
                            className="bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30 text-xs"
                          >
                            {message.suggestion.type || "Suggestion"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#cdd6f4] font-medium mb-1">
                          {message.suggestion.action}
                        </p>
                        <p className="text-xs text-[#6c7086] mb-3">
                          {message.suggestion.preview}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => applySuggestion(message.id)}
                            disabled={isLoading}
                            className="h-6 px-2 text-xs bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                          >
                            {getSuggestionIcon(message.suggestion.type)}
                            Apply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectSuggestion(message.id)}
                            className="h-6 px-2 text-xs bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244]"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#313244] text-[#cdd6f4] rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#cba6f7] rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-[#cba6f7] rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#cba6f7] rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#6c7086]">
                        Processing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="p-4 border-t border-[#313244] bg-[#1e1e2e]">
              <p className="text-xs text-[#6c7086] mb-2">Quick suggestions:</p>
              <div className="space-y-1">
                {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputValue(suggestion)}
                    className="w-full justify-start text-xs text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] h-auto py-1 px-2"
                  >
                    "{suggestion}"
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#313244] bg-[#1e1e2e]">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-[#181825] border-[#45475a] text-[#cdd6f4] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90 disabled:bg-[#6c7086] disabled:text-[#45475a]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
