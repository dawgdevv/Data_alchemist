"use client";

import { useState } from "react";
import { MessageSquare, Send, X, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestion?: {
    action: string;
    preview: string;
  };
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        'Hi! I\'m your AI assistant. I can help you fix data issues, create rules, and optimize your workflow. Try asking me something like "Fix all broken JSON fields" or "Show tasks with duration > 2".',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickSuggestions = [
    "Fix all broken JSON fields",
    "Show tasks with duration > 2 and prefer phase 2",
    "Add a co-run rule between Task T1 and T2",
    "Find workers with missing rate information",
    "Optimize for fair distribution",
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
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: getAIResponse(inputValue),
        timestamp: new Date(),
        suggestion: getSuggestion(inputValue),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("fix") && lowerInput.includes("json")) {
      return "I found 3 rows with malformed JSON in your data. I can automatically fix these by parsing and reformatting the JSON fields. Would you like me to apply these fixes?";
    }

    if (lowerInput.includes("duration") && lowerInput.includes("2")) {
      return "I found 5 tasks with duration > 2 hours. 3 of them are in phase 2. Here's what I can do: prioritize these tasks, assign them to experienced workers, or create a rule to handle them specially.";
    }

    if (
      lowerInput.includes("co-run") ||
      lowerInput.includes("t1") ||
      lowerInput.includes("t2")
    ) {
      return "I can create a co-run rule linking Task T1 and T2. This will ensure they're assigned to workers who can handle both tasks simultaneously. Should I add this rule to your configuration?";
    }

    if (lowerInput.includes("missing") && lowerInput.includes("rate")) {
      return "I found 2 workers with missing rate information: Jane Smith and Bob Wilson. I can either flag these for manual review or estimate rates based on similar worker profiles.";
    }

    return "I understand you want to optimize your data processing. Could you be more specific about what you'd like me to help with? I can fix data issues, create rules, or analyze your current setup.";
  };

  const getSuggestion = (
    input: string
  ): { action: string; preview: string } | undefined => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("fix") && lowerInput.includes("json")) {
      return {
        action: "Fix JSON Fields",
        preview: "Will repair 3 malformed JSON entries in workers.csv",
      };
    }

    if (lowerInput.includes("co-run")) {
      return {
        action: "Add Co-run Rule",
        preview: "Create rule: Tasks T1 and T2 must be assigned together",
      };
    }

    return undefined;
  };

  const applySuggestion = (messageId: string) => {
    console.log("Applying suggestion for message:", messageId);
    // Implementation would apply the suggested changes
  };

  const rejectSuggestion = (messageId: string) => {
    console.log("Rejecting suggestion for message:", messageId);
    // Implementation would dismiss the suggestion
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
                    Natural language data processing
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
                    <p className="text-sm">{message.content}</p>
                    {message.suggestion && (
                      <div className="mt-3 p-2 bg-[#45475a] rounded border border-[#585b70]">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="outline"
                            className="bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30 text-xs"
                          >
                            Suggestion
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
                            className="h-6 px-2 text-xs bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                          >
                            <Check className="h-3 w-3 mr-1" />
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
                        Thinking...
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
