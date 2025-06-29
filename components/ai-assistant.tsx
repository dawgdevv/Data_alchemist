"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Check,
  Brain,
  Search,
  Wand2,
  Settings,
  Activity,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  TrendingUp,
  Star,
  Target,
  Clock,
  Shield,
  Award,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/hooks/use-session";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestion?: {
    action: string;
    preview: string;
    type?:
      | "validation"
      | "search"
      | "correction"
      | "rule"
      | "quality"
      | "patterns"
      | "enhancement";
    data?: any;
  };
  metadata?: {
    confidence?: number;
    category?: string;
    priority?: "high" | "medium" | "low";
    aiGenerated?: boolean;
  };
}

interface ValidationSummary {
  totalIssues: number;
  criticalIssues: number;
  autoFixableIssues: number;
  dataQualityScore: number;
  confidence: number;
  recommendation: string;
}

export default function AIAssistant({ uploadedFiles }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        'Hi! I\'m your **Enhanced AI Assistant** with advanced validation capabilities. I can help you:\n\n🔍 **Advanced Data Analysis**\n• Comprehensive data quality assessment\n• Pattern detection and anomaly identification\n• Semantic validation and business logic checks\n\n🛠️ **Smart Corrections**\n• Auto-fix common data issues\n• Intelligent suggestions with confidence scores\n• Context-aware data improvements\n\n🔬 **Deep Insights**\n• Data readiness scoring\n• Quality grading (A-F scale)\n• Estimated fix times and priorities\n\nTry: "Run comprehensive validation", "What\'s my data quality score?", or "Show me high-priority issues".',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationSummary, setValidationSummary] =
    useState<ValidationSummary | null>(null);
  const { sessionId, sessionData, validateCurrentSession } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousSessionDataRef = useRef<any>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Detect file uploads and show processing message
  useEffect(() => {
    const currentFiles = Object.keys(sessionData);
    const previousFiles = Object.keys(previousSessionDataRef.current);

    // Detect any change in uploaded files (new files or replacements)
    if (
      currentFiles.length > 0 &&
      (currentFiles.length !== previousFiles.length ||
        !currentFiles.every((f) => previousFiles.includes(f)))
    ) {
      const newFiles = currentFiles.filter(
        (file) => !previousFiles.includes(file)
      );

      // Only show message if there are new files
      if (newFiles.length > 0) {
        const newMessage: Message = {
          id: `upload-${Date.now()}`,
          type: "assistant",
          content: `🎉 **Files detected!** I can now analyze: ${currentFiles.join(
            ", "
          )}\n\n✨ **Ready to help you with:**\n• Run comprehensive validation\n• Check data quality\n• Find patterns and issues\n• Generate insights\n\nJust ask me anything about your data!`,
          timestamp: new Date(),
          metadata: {
            category: "file_upload",
            priority: "medium",
            aiGenerated: true,
          },
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    }

    // Update tracking reference
    previousSessionDataRef.current = sessionData;
  }, [sessionData]);

  const quickSuggestions = [
    "Run comprehensive AI validation",
    "What's my data quality grade?",
    "Show high-priority issues only",
    "Auto-fix all fixable problems",
    "Analyze data patterns and anomalies",
    "Generate data quality report",
    "Show me skill coverage gaps",
    "Estimate time to fix all issues",
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
      const response = await getEnhancedAIResponse(currentInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        timestamp: new Date(),
        suggestion: response.suggestion,
        metadata: response.metadata,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I encountered an error processing your request. Please try again or check your data upload status.",
        timestamp: new Date(),
        metadata: { priority: "high" },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnhancedAIResponse = async (
    input: string
  ): Promise<{
    content: string;
    suggestion?: any;
    metadata?: any;
  }> => {
    const lowerInput = input.toLowerCase();

    // Check if we have session data
    if (!sessionId || Object.keys(sessionData).length === 0) {
      return {
        content:
          "Please upload your data files first. I need clients.csv, workers.csv, and tasks.csv to provide comprehensive analysis.",
        metadata: { priority: "high" },
      };
    }

    // ✅ ENHANCED: Comprehensive AI Validation
    if (
      lowerInput.includes("comprehensive") ||
      lowerInput.includes("advanced") ||
      lowerInput.includes("ai validation") ||
      lowerInput.includes("deep analysis")
    ) {
      try {
        const response = await fetch("/api/ai-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();
        if (result.success) {
          const summary = result.summary;
          setValidationSummary(summary);

          const insights = result.insights;

          return {
            content: `🎯 **Comprehensive AI Analysis Complete**

📊 **Data Quality Grade: ${insights.dataQualityGrade}** (${
              summary.dataQualityScore
            }%)
🔍 **Issues Found:** ${summary.totalIssues} total (${
              summary.criticalIssues
            } critical)
⚡ **Auto-fixable:** ${summary.autoFixableIssues} issues
🎚️ **Readiness Score:** ${insights.readinessScore}%
⏱️ **Estimated Fix Time:** ${insights.estimatedFixTime}

🔬 **Key Insights:**
${insights.topIssues.map((issue: string) => `• ${issue}`).join("\n")}

🛠️ **Recommended Actions:**
${insights.recommendedActions.map((action: string) => `• ${action}`).join("\n")}

**Overall Assessment:** ${summary.recommendation}`,
            suggestion: {
              action: "View Detailed Report",
              preview: `${summary.totalIssues} issues found, ${summary.autoFixableIssues} auto-fixable`,
              type: "validation",
              data: result,
            },
            metadata: {
              confidence: summary.confidence / 100,
              category: "comprehensive_analysis",
              priority: summary.criticalIssues > 0 ? "high" : "medium",
            },
          };
        }
      } catch (error) {
        console.error("Comprehensive validation failed:", error);
      }
    }

    // ✅ Data Quality Score Query (Simplified)
    if (
      lowerInput.includes("quality score") ||
      lowerInput.includes("quality grade") ||
      lowerInput.includes("data grade")
    ) {
      // Simple quality assessment based on available data
      const totalErrors = Object.values(sessionData).reduce((sum, fileData) => {
        return (
          sum +
          fileData.data.filter((row) =>
            Object.values(row).some((val) => !val || val === "" || val === null)
          ).length
        );
      }, 0);

      const totalRows = Object.values(sessionData).reduce(
        (sum, fileData) => sum + fileData.data.length,
        0
      );
      const qualityScore =
        totalRows > 0 ? Math.max(0, (totalRows - totalErrors) / totalRows) : 0;
      const grade = getQualityGrade(qualityScore);

      return {
        content: `📈 **Data Quality Assessment**

🎯 **Overall Score:** ${Math.round(qualityScore * 100)}%
📊 **Grade:** ${grade}

**Quality Analysis:**
• **Completeness:** ${Math.round(
          (1 - totalErrors / Math.max(totalRows, 1)) * 100
        )}%
• **Total Records:** ${totalRows}
• **Issues Found:** ${totalErrors}

**File Breakdown:**
${Object.entries(sessionData)
  .map(([file, data]) => `• ${file}: ${data.data.length} rows`)
  .join("\n")}

**Status:** ${qualityScore >= 0.8 ? "✅ Ready for use" : "⚠️ Needs attention"}
**Recommendation:** ${
          qualityScore >= 0.8
            ? "Data quality is good!"
            : "Fix validation issues first"
        }`,
        suggestion:
          qualityScore < 0.8
            ? {
                action: "Run Validation",
                preview: `Fix ${totalErrors} issues to improve quality`,
                type: "validation",
              }
            : undefined,
        metadata: {
          confidence: 0.85,
          category: "quality_assessment",
          priority: qualityScore < 0.7 ? "high" : "medium",
        },
      };
    }

    // ✅ High Priority Issues Query
    if (
      lowerInput.includes("high-priority") ||
      lowerInput.includes("critical") ||
      lowerInput.includes("urgent")
    ) {
      try {
        const response = await fetch("/api/ai-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();
        if (result.success) {
          const criticalErrors = result.categorizedResults.errors.critical;
          const criticalSuggestions =
            result.categorizedResults.suggestions.critical;

          return {
            content: `🚨 **High-Priority Issues Analysis**

**Critical Errors (${criticalErrors.length}):**
${criticalErrors
  .slice(0, 3)
  .map((error: any) => `• ${error.message} (Row ${error.row}, ${error.file})`)
  .join("\n")}

**Critical Fixes Needed (${criticalSuggestions.length}):**
${criticalSuggestions
  .slice(0, 3)
  .map((fix: any) => `• ${fix.reasoning} (Priority: ${fix.priority}/10)`)
  .join("\n")}

${
  criticalErrors.length + criticalSuggestions.length === 0
    ? "✅ **No critical issues found!** Your data is in good shape."
    : "⚠️ **Immediate attention required** - These issues could block processing."
}`,
            suggestion:
              criticalErrors.length + criticalSuggestions.length > 0
                ? {
                    action: "Fix Critical Issues",
                    preview: `${
                      criticalErrors.length + criticalSuggestions.length
                    } critical issues`,
                    type: "correction",
                    data: {
                      errors: criticalErrors,
                      suggestions: criticalSuggestions,
                    },
                  }
                : undefined,
            metadata: {
              confidence: 0.9,
              category: "critical_analysis",
              priority: "high",
            },
          };
        }
      } catch (error) {
        console.error("Critical analysis failed:", error);
      }
    }

    // ✅ Auto-fix Query
    if (
      lowerInput.includes("auto-fix") ||
      lowerInput.includes("fix all") ||
      lowerInput.includes("apply fixes")
    ) {
      try {
        const response = await fetch("/api/ai-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();
        if (result.success) {
          const autoFixable = result.categorizedResults.suggestions.autoFixable;

          return {
            content: `🔧 **Auto-Fix Analysis**

**Auto-fixable Issues:** ${autoFixable.length}

${autoFixable
  .slice(0, 5)
  .map((fix: any) => `• ${fix.reasoning} (${fix.confidence * 100}% confidence)`)
  .join("\n")}

${
  autoFixable.length > 0
    ? `⚡ **Ready to apply ${autoFixable.length} automatic fixes** - These changes have high confidence scores and are safe to apply.`
    : "✅ **No auto-fixes needed** - Your data doesn't have issues that can be automatically corrected."
}`,
            suggestion:
              autoFixable.length > 0
                ? {
                    action: "Apply All Auto-Fixes",
                    preview: `${autoFixable.length} safe auto-fixes available`,
                    type: "correction",
                    data: { suggestions: autoFixable, autoApply: true },
                  }
                : undefined,
            metadata: {
              confidence: 0.95,
              category: "auto_fix",
              priority: autoFixable.length > 0 ? "medium" : "low",
            },
          };
        }
      } catch (error) {
        console.error("Auto-fix analysis failed:", error);
      }
    }

    // ✅ Pattern Detection Query (Simplified)
    if (
      lowerInput.includes("pattern") ||
      lowerInput.includes("anomal") ||
      lowerInput.includes("unusual")
    ) {
      // Simple pattern detection based on data structure
      const patterns = [];
      let anomalies = 0;

      // Check for common patterns and anomalies
      Object.entries(sessionData).forEach(([fileType, fileData]) => {
        const emptyRowCount = fileData.data.filter((row) =>
          Object.values(row).every((val) => !val || val === "")
        ).length;

        if (emptyRowCount > 0) {
          patterns.push(`Empty rows in ${fileType}: ${emptyRowCount} found`);
          anomalies++;
        }

        // Check for duplicate values in key fields
        if (fileType === "clients" && fileData.data.length > 0) {
          const clientIds = fileData.data
            .map((row) => row.ClientID)
            .filter(Boolean);
          const duplicates = clientIds.length - new Set(clientIds).size;
          if (duplicates > 0) {
            patterns.push(
              `Duplicate ClientIDs in ${fileType}: ${duplicates} found`
            );
            anomalies++;
          }
        }

        // Check for unusual data lengths
        if (fileData.data.length < 5 && fileData.data.length > 0) {
          patterns.push(
            `Small dataset in ${fileType}: only ${fileData.data.length} records`
          );
        }
      });

      return {
        content: `🔍 **Pattern Analysis Complete**

**Patterns Detected:** ${patterns.length}
**Anomalies Found:** ${anomalies}

**Key Patterns:**
${
  patterns.length > 0
    ? patterns
        .slice(0, 3)
        .map((p) => `• ${p}`)
        .join("\n")
    : "• No unusual patterns detected"
}

${
  patterns.length === 0
    ? "✅ **No unusual patterns detected** - Your data follows expected patterns."
    : "📊 **Analysis complete** - Review patterns for optimization opportunities."
}`,
        suggestion:
          patterns.length > 0
            ? {
                action: "Run Data Validation",
                preview: `${patterns.length} patterns detected`,
                type: "validation",
              }
            : undefined,
        metadata: {
          confidence: 0.8,
          category: "pattern_analysis",
          priority: anomalies > 2 ? "high" : "medium",
        },
      };
    }

    // ✅ Data Quality Report Generation
    if (
      lowerInput.includes("generate report") ||
      lowerInput.includes("quality report") ||
      lowerInput.includes("full report")
    ) {
      try {
        const response = await fetch("/api/ai-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();
        if (result.success) {
          const summary = result.summary;
          const insights = result.insights;

          return {
            content: `📋 **Comprehensive Data Quality Report**

**Executive Summary:**
• Overall Grade: **${insights.dataQualityGrade}** (${summary.dataQualityScore}%)
• Readiness Score: **${insights.readinessScore}%**
• Total Issues: **${summary.totalIssues}** (${summary.criticalIssues} critical)
• Fix Time: **${insights.estimatedFixTime}**

**Quality Metrics:**
• Completeness: ${Math.round(
              result.aiValidation.dataQuality.completeness * 100
            )}%
• Consistency: ${Math.round(result.aiValidation.dataQuality.consistency * 100)}%
• Accuracy: ${Math.round(result.aiValidation.dataQuality.accuracy * 100)}%

**File-by-File Scores:**
${Object.entries(result.aiValidation.dataQuality.fileScores)
  .map(
    ([file, score]: [string, any]) => `• ${file}: ${Math.round(score * 100)}%`
  )
  .join("\n")}

**Recommendation:** ${summary.recommendation}`,
            suggestion: {
              action: "Export Full Report",
              preview: "Complete analysis with all details",
              type: "quality",
              data: result,
            },
            metadata: {
              confidence: 0.98,
              category: "full_report",
              priority: "medium",
            },
          };
        }
      } catch (error) {
        console.error("Report generation failed:", error);
      }
    }

    // ✅ Smart Rule Recommendations (Simplified)
    if (
      lowerInput.includes("recommend") &&
      (lowerInput.includes("rule") || lowerInput.includes("optimization"))
    ) {
      // Simple rule recommendations based on data patterns
      const recommendations = [];

      if (sessionData.tasks && sessionData.workers) {
        const taskCount = sessionData.tasks.data.length;
        const workerCount = sessionData.workers.data.length;

        if (taskCount > workerCount * 3) {
          recommendations.push(
            "Consider load balancing - many tasks per worker"
          );
        }

        if (workerCount > taskCount * 2) {
          recommendations.push("Worker utilization could be improved");
        }
      }

      if (sessionData.clients) {
        const highPriorityClients = sessionData.clients.data.filter(
          (client) => parseInt(client.PriorityLevel) >= 4
        ).length;

        if (highPriorityClients > sessionData.clients.data.length * 0.5) {
          recommendations.push(
            "Too many high-priority clients - consider priority rebalancing"
          );
        }
      }

      return {
        content: `🎯 **Smart Rule Recommendations**

**Found ${recommendations.length} optimization opportunities:**
${
  recommendations.length > 0
    ? recommendations.map((r) => `• ${r}`).join("\n")
    : "• Current setup looks well balanced"
}

**Quick Suggestions:**
• Set up worker load limits to prevent overallocation
• Define skill-based task assignment rules
• Create priority-based scheduling constraints

**Next Steps:**
${
  recommendations.length > 0
    ? "Review the suggestions and implement in Rule Builder"
    : "Your current configuration appears optimized"
}`,
        suggestion: {
          action: "Open Rule Builder",
          preview: `${recommendations.length} suggestions available`,
          type: "rule",
        },
        metadata: {
          confidence: 0.75,
          category: "rule_recommendations",
          priority: recommendations.length > 2 ? "high" : "medium",
        },
      };
    }

    // ✅ Data Enrichment Suggestions (Simplified)
    if (
      lowerInput.includes("improve") ||
      lowerInput.includes("enhance") ||
      lowerInput.includes("missing")
    ) {
      // Simple enrichment analysis based on standard fields
      const suggestions = [];
      const missingFields = [];

      // Check for common missing fields
      Object.entries(sessionData).forEach(([fileType, fileData]) => {
        if (fileType === "clients" && fileData.data.length > 0) {
          const hasEmail = fileData.data.some(
            (row) => row.Email || row.ContactEmail
          );
          const hasPhone = fileData.data.some(
            (row) => row.Phone || row.ContactPhone
          );

          if (!hasEmail) missingFields.push("Email/ContactEmail in clients");
          if (!hasPhone) missingFields.push("Phone/ContactPhone in clients");
        }

        if (fileType === "workers" && fileData.data.length > 0) {
          const hasExperience = fileData.data.some(
            (row) => row.Experience || row.YearsExperience
          );
          const hasCostRate = fileData.data.some(
            (row) => row.CostRate || row.HourlyRate
          );

          if (!hasExperience) missingFields.push("Experience level in workers");
          if (!hasCostRate) missingFields.push("Cost/Hourly rate in workers");
        }

        if (fileType === "tasks" && fileData.data.length > 0) {
          const hasDeadline = fileData.data.some(
            (row) => row.Deadline || row.DueDate
          );
          const hasPriority = fileData.data.some(
            (row) => row.Priority || row.TaskPriority
          );

          if (!hasDeadline) missingFields.push("Deadline/DueDate in tasks");
          if (!hasPriority) missingFields.push("Priority level in tasks");
        }
      });

      // Check for data improvements
      if (sessionData.clients) {
        const incompleteClients = sessionData.clients.data.filter(
          (row) => !row.AttributesJSON || row.AttributesJSON === "{}"
        ).length;

        if (incompleteClients > 0) {
          suggestions.push(
            `${incompleteClients} clients have incomplete attributes`
          );
        }
      }

      return {
        content: `🚀 **Data Enhancement Opportunities**

**Missing Fields (${missingFields.length}):**
${
  missingFields.length > 0
    ? missingFields
        .slice(0, 3)
        .map((f) => `• ${f}`)
        .join("\n")
    : "• All standard fields are present"
}

**Potential Improvements (${suggestions.length}):**
${
  suggestions.length > 0
    ? suggestions.map((s) => `• ${s}`).join("\n")
    : "• Data structure looks complete"
}

**Enhancement Recommendations:**
• Add contact information (email, phone) for better communication
• Include experience levels and rates for better resource planning
• Set deadlines and priorities for improved task management
• Enrich client attributes with additional business context

**Impact:** ${
          missingFields.length + suggestions.length > 0
            ? "These enhancements will improve data usability and planning accuracy"
            : "Your data is well-structured for current needs"
        }`,
        suggestion:
          missingFields.length > 0
            ? {
                action: "Review Data Structure",
                preview: `${missingFields.length} fields could be added`,
                type: "enhancement",
              }
            : undefined,
        metadata: {
          confidence: 0.8,
          category: "data_enrichment",
          priority: missingFields.length > 2 ? "medium" : "low",
        },
      };
    }

    // ✅ Natural Language Search (Simplified)
    if (
      lowerInput.includes("show") ||
      lowerInput.includes("find") ||
      lowerInput.includes("search") ||
      lowerInput.includes("list")
    ) {
      // Simple search implementation using basic string matching
      let results = [];
      let targetTable = "";

      // Extract search parameters
      if (lowerInput.includes("task")) {
        targetTable = "tasks";
        if (sessionData.tasks) {
          results = sessionData.tasks.data.filter((row) => {
            const searchableText = Object.values(row).join(" ").toLowerCase();
            return lowerInput
              .split(" ")
              .some((term) => term.length > 2 && searchableText.includes(term));
          });
        }
      } else if (lowerInput.includes("worker")) {
        targetTable = "workers";
        if (sessionData.workers) {
          results = sessionData.workers.data.filter((row) => {
            const searchableText = Object.values(row).join(" ").toLowerCase();
            return lowerInput
              .split(" ")
              .some((term) => term.length > 2 && searchableText.includes(term));
          });
        }
      } else if (lowerInput.includes("client")) {
        targetTable = "clients";
        if (sessionData.clients) {
          results = sessionData.clients.data.filter((row) => {
            const searchableText = Object.values(row).join(" ").toLowerCase();
            return lowerInput
              .split(" ")
              .some((term) => term.length > 2 && searchableText.includes(term));
          });
        }
      } else {
        // Search all tables
        Object.entries(sessionData).forEach(([table, data]) => {
          const matches = data.data.filter((row) => {
            const searchableText = Object.values(row).join(" ").toLowerCase();
            return lowerInput
              .split(" ")
              .some((term) => term.length > 2 && searchableText.includes(term));
          });
          if (matches.length > 0) {
            results = [
              ...results,
              ...matches.map((match) => ({ ...match, _table: table })),
            ];
            if (!targetTable) targetTable = table;
          }
        });
      }

      return {
        content: `🔍 **Search Results** ${
          targetTable ? `in ${targetTable}` : "across all data"
        }

**Found:** ${results.length} matching records

${
  results.length > 0
    ? `**Sample Results:**\n${results
        .slice(0, 3)
        .map(
          (r: any, i: number) =>
            `${i + 1}. ${Object.entries(r)
              .filter(([k]) => !k.startsWith("_"))
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}`
        )
        .join("\n")}`
    : "**No matching records found** - Try different search terms or check your data."
}

**Search Tips:**
• Use specific terms like "Python", "urgent", or task names
• Try "show tasks with duration > 3" for numeric filters
• Search by file type: "find workers with..." or "show clients..."`,
        suggestion:
          results.length > 0
            ? {
                action: "View Data Grid",
                preview: `${results.length} results found`,
                type: "search",
                data: { results, targetTable },
              }
            : undefined,
        metadata: {
          confidence: 0.7,
          category: "search",
          priority: "low",
        },
      };
    }

    // ✅ Time Estimation Query
    if (
      lowerInput.includes("time to fix") ||
      lowerInput.includes("estimate") ||
      lowerInput.includes("how long")
    ) {
      try {
        const response = await fetch("/api/ai-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();
        if (result.success) {
          const insights = result.insights;
          const autoFixable =
            result.categorizedResults.suggestions.autoFixable.length;
          const manual = result.summary.totalIssues - autoFixable;

          return {
            content: `⏱️ **Fix Time Estimation**

**Estimated Total Time:** ${insights.estimatedFixTime}

**Breakdown:**
• **Auto-fixes:** ${autoFixable} issues (~${Math.round(
              autoFixable * 0.1
            )} minutes)
• **Manual fixes:** ${manual} issues (~${Math.round(manual * 2)} minutes)

**Efficiency Tips:**
• Apply auto-fixes first for quick wins
• Focus on critical issues (${result.summary.criticalIssues}) before warnings
• Use batch operations where possible

**Current Status:** ${result.summary.recommendation}`,
            suggestion:
              autoFixable > 0
                ? {
                    action: "Start with Auto-Fixes",
                    preview: `${autoFixable} quick fixes available`,
                    type: "correction",
                    data: {
                      suggestions:
                        result.categorizedResults.suggestions.autoFixable,
                    },
                  }
                : undefined,
            metadata: {
              confidence: 0.8,
              category: "time_estimation",
              priority: "medium",
            },
          };
        }
      } catch (error) {
        console.error("Time estimation failed:", error);
      }
    }

    // ✅ Legacy Support - AI Validation
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
          const summary = result.summary;

          return {
            content: `🤖 **AI Validation Complete**

**Summary:**
• Issues Found: **${summary.totalIssues}** (${summary.criticalIssues} critical)
• Data Quality: **${summary.dataQualityScore}%**
• Auto-fixable: **${summary.autoFixableIssues}** issues
• Confidence: **${summary.confidence}%**

**Assessment:** ${summary.recommendation}

Try asking me for "comprehensive validation" for detailed analysis!`,
            suggestion: {
              action: "Run Comprehensive Analysis",
              preview: "Get detailed insights and patterns",
              type: "validation",
              data: result,
            },
            metadata: {
              confidence: summary.confidence / 100,
              category: "basic_validation",
              priority: summary.criticalIssues > 0 ? "high" : "medium",
            },
          };
        }
      } catch (error) {
        console.error("AI validation failed:", error);
        return {
          content:
            "AI validation failed. Please check your data upload and try again.",
          metadata: { priority: "high" },
        };
      }
    }

    // ✅ Legacy Support - Data Correction
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
            content: `I've analyzed your data and found ${
              result.suggestions?.length || 0
            } potential corrections. These are AI-generated suggestions based on data patterns.`,
            suggestion: {
              action: "Apply All Corrections",
              preview: `${
                result.suggestions?.length || 0
              } smart corrections ready`,
              type: "correction",
              data: result.suggestions,
            },
          };
        }
      } catch (error) {
        console.error("Data correction failed:", error);
      }
    }

    // ✅ Legacy Support - Skill Coverage
    if (lowerInput.includes("skill") || lowerInput.includes("coverage")) {
      const tasksData = sessionData.tasks?.data || [];
      const workersData = sessionData.workers?.data || [];

      const uncoveredSkills: string[] = [];
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
            ? `🔍 **Skill Coverage Analysis**

**Uncovered Skills (${uncoveredSkills.length}):**
${uncoveredSkills.map((skill) => `• ${skill}`).join("\n")}

⚠️ **Impact:** These skills are required by tasks but no workers have them. Consider:
• Hiring workers with these skills
• Training existing workers
• Modifying task requirements`
            : "✅ **Skill Coverage Complete!** All required skills are covered by your workers.",
        metadata: {
          confidence: 0.9,
          category: "skill_analysis",
          priority: uncoveredSkills.length > 0 ? "high" : "low",
        },
      };
    }

    // ✅ Default fallback with enhanced context
    return {
      content: `🤖 **I'm here to help!** I can assist with:

**🔍 Advanced Analysis:**
• "Run comprehensive validation" - Deep AI analysis
• "What's my data quality grade?" - Quality scoring
• "Show high-priority issues" - Critical problems first

**🛠️ Smart Fixes:**
• "Auto-fix all problems" - Apply safe corrections
• "Fix time estimation" - How long will repairs take?
• "Generate quality report" - Complete assessment

**🔎 Intelligent Search:**
• "Show tasks with duration > 2" - Natural language queries
• "Find workers with Python skills" - Complex filtering

What would you like me to help you with?`,
      metadata: {
        confidence: 1.0,
        category: "help",
        priority: "low",
      },
    };
  };

  // ✅ Helper function for quality grading
  const getQualityGrade = (score: number): string => {
    if (score >= 0.9) return "A";
    if (score >= 0.8) return "B";
    if (score >= 0.7) return "C";
    if (score >= 0.6) return "D";
    return "F";
  };

  const applySuggestion = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.suggestion) return;

    setIsLoading(true);
    try {
      const { suggestion } = message;

      switch (suggestion.type) {
        case "validation":
          // Run comprehensive validation
          try {
            const response = await fetch("/api/ai-validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });

            const result = await response.json();
            if (result.success) {
              const successMessage: Message = {
                id: Date.now().toString(),
                type: "assistant",
                content: `✅ **Validation Complete!** Found ${result.summary.totalIssues} issues (${result.summary.criticalIssues} critical). Data quality score: ${result.summary.dataQualityScore}%`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, successMessage]);
            }
          } catch (error) {
            console.error("Validation failed:", error);
          }
          break;

        case "correction":
          if (suggestion.data?.type === "json") {
            // Handle JSON fix specifically
            try {
              const response = await fetch("/api/ai-correct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  fixType: "json",
                  autoApply: true,
                }),
              });

              const result = await response.json();
              if (response.ok && result.success) {
                const successMessage: Message = {
                  id: Date.now().toString(),
                  type: "assistant",
                  content: `✅ Successfully fixed ${
                    result.fixedCount || 0
                  } JSON fields in your data!`,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, successMessage]);

                // Trigger validation refresh
                setTimeout(async () => {
                  if (validateCurrentSession) {
                    await validateCurrentSession();
                  }
                }, 1000);
              } else {
                throw new Error(result.error || "JSON fix failed");
              }
            } catch (jsonError) {
              console.error("Failed to fix JSON:", jsonError);
              const errorMessage: Message = {
                id: Date.now().toString(),
                type: "assistant",
                content: `❌ Failed to fix JSON fields: ${
                  jsonError instanceof Error
                    ? jsonError.message
                    : String(jsonError)
                }`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
            }
          } else if (suggestion.data?.autoApply) {
            // Handle auto-fix suggestions
            try {
              const response = await fetch("/api/ai-correct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  suggestions: suggestion.data.suggestions,
                  autoApply: true,
                }),
              });

              const result = await response.json();
              if (response.ok && result.success) {
                const successMessage: Message = {
                  id: Date.now().toString(),
                  type: "assistant",
                  content: `✅ **Auto-fixes Applied!** Successfully corrected ${
                    result.appliedCount ||
                    suggestion.data.suggestions?.length ||
                    0
                  } issues. Files updated: ${
                    result.correctedFiles?.join(", ") || "data files"
                  }`,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, successMessage]);

                // Trigger validation refresh
                setTimeout(async () => {
                  if (validateCurrentSession) {
                    await validateCurrentSession();
                  }
                }, 1000);
              } else {
                throw new Error(result.error || "Auto-fix failed");
              }
            } catch (autoFixError) {
              console.error("Auto-fix failed:", autoFixError);
              const errorMessage: Message = {
                id: Date.now().toString(),
                type: "assistant",
                content: `❌ Auto-fix failed: ${
                  autoFixError instanceof Error
                    ? autoFixError.message
                    : String(autoFixError)
                }`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
            }
          } else {
            // Handle general corrections
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
                  content: `✅ **Corrections Applied!** Successfully fixed ${
                    result.appliedCount || 0
                  } issues. ${
                    result.correctedFiles?.length
                      ? `Files updated: ${result.correctedFiles.join(", ")}`
                      : "Data has been updated."
                  }`,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, successMessage]);

                // Trigger validation refresh
                setTimeout(async () => {
                  if (validateCurrentSession) {
                    await validateCurrentSession();
                  }
                }, 1000);
              } else {
                throw new Error(result.error || "Correction failed");
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

        case "quality":
          // Show quality report summary
          const qualityMessage: Message = {
            id: Date.now().toString(),
            type: "assistant",
            content: `📊 **Quality Report Generated!** Your data quality analysis is complete. Check the validation panel for detailed metrics and recommendations.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, qualityMessage]);
          break;

        case "patterns":
          // Show pattern analysis summary
          const patternMessage: Message = {
            id: Date.now().toString(),
            type: "assistant",
            content: `🔍 **Pattern Analysis Complete!** I've identified data patterns and anomalies. Review the insights to optimize your data structure.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, patternMessage]);
          break;

        case "search":
          // Could integrate with data grid to highlight results
          const searchMessage: Message = {
            id: Date.now().toString(),
            type: "assistant",
            content: `🔍 **Search Results Ready!** Found ${
              suggestion.data?.results?.length || 0
            } matching records. Results are ready for review.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, searchMessage]);
          break;

        case "rule":
          // Could integrate with rule builder
          const ruleMessage: Message = {
            id: Date.now().toString(),
            type: "assistant",
            content: `🎯 **Rule Creation!** I've prepared rule suggestions. You can review and apply them in the Rule Builder.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, ruleMessage]);
          break;

        case "enhancement":
          // Handle data enhancement suggestions
          const enhancementMessage: Message = {
            id: Date.now().toString(),
            type: "assistant",
            content: `🚀 **Enhancement Suggestions!** I've identified opportunities to improve your data. Review the suggestions to enhance data quality.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, enhancementMessage]);
          break;

        default:
          console.log("Unknown suggestion type:", suggestion.type);
          break;
      }
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content:
          "Failed to apply the suggestion. Please try again or contact support if the issue persists.",
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
      case "quality":
        return <BarChart3 className="h-3 w-3 mr-1" />;
      case "patterns":
        return <Activity className="h-3 w-3 mr-1" />;
      case "enhancement":
        return <Sparkles className="h-3 w-3 mr-1" />;
      default:
        return <Check className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="relative">
      {/* AI Assistant Sidebar Button */}
      <div className="relative">
        {/* AI Assistant Sidebar Button */}
        <div
          className={`fixed right-4 top-24 transition-all duration-300 ease-in-out z-40 ${
            isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="h-12 px-4 rounded-full border border-[#313244] bg-[#181825] text-[#cdd6f4] hover:bg-[#313244] transition-all duration-300 ease-in-out shadow-lg"
          >
            <div className="flex flex-row items-center space-x-3">
              <Brain className="h-5 w-5 text-[#cba6f7]" />
              <span className="text-sm font-medium tracking-wider">
                AI ASSISTANT
              </span>
              <div className="w-px h-4 bg-[#45475a]" />
              <Sparkles className="h-4 w-4 text-[#f9e2af]" />
            </div>
          </Button>
        </div>
      </div>
      {/* AI Assistant Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-[#181825] border-l border-[#313244] z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#313244] bg-[#1e1e2e]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[#cba6f7] to-[#f38ba8] rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-[#1e1e2e]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#cdd6f4] text-lg">
                AI Assistant
              </h3>
              <p className="text-xs text-[#6c7086]">
                Enhanced data intelligence & validation
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Enhanced Session Status */}
        <div className="px-4 py-3 border-b border-[#313244] bg-[#1e1e2e]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#cdd6f4]">
                Session Status
              </span>
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
                  : "No data uploaded"}
              </Badge>
            </div>

            {/* Validation Summary */}
            {validationSummary && (
              <div className="p-3 bg-[#181825] rounded-lg border border-[#45475a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#cdd6f4]">
                    Data Quality
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      validationSummary.dataQualityScore >= 80
                        ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                        : validationSummary.dataQualityScore >= 60
                        ? "bg-[#f9e2af]/20 text-[#f9e2af] border-[#f9e2af]/30"
                        : "bg-[#f38ba8]/20 text-[#f38ba8] border-[#f38ba8]/30"
                    }
                  >
                    {validationSummary.dataQualityScore}% Score
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 bg-[#313244] rounded">
                    <div className="text-[#6c7086] mb-1">Total Issues</div>
                    <div className="text-[#cdd6f4] font-semibold">
                      {validationSummary.totalIssues}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-[#313244] rounded">
                    <div className="text-[#6c7086] mb-1">Critical</div>
                    <div className="text-[#f38ba8] font-semibold">
                      {validationSummary.criticalIssues}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-[#313244] rounded">
                    <div className="text-[#6c7086] mb-1">Auto-fixable</div>
                    <div className="text-[#a6e3a1] font-semibold">
                      {validationSummary.autoFixableIssues}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-4 shadow-sm ${
                    message.type === "user"
                      ? "bg-gradient-to-br from-[#cba6f7] to-[#b4a7ff] text-[#1e1e2e]"
                      : "bg-[#313244] text-[#cdd6f4] border border-[#45475a]"
                  }`}
                >
                  {/* Message Content */}
                  {message.type === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0 text-sm leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1 text-sm">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-[#f9e2af]">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-[#fab387]">
                              {children}
                            </em>
                          ),
                          code: ({ children }) => (
                            <code className="bg-[#45475a] px-1.5 py-0.5 rounded text-xs font-mono text-[#a6e3a1]">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-[#45475a] p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2 border border-[#585b70]">
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}

                  {/* Message Metadata */}
                  {message.metadata && message.type === "assistant" && (
                    <div className="mt-3 flex items-center space-x-2 flex-wrap">
                      {message.metadata.confidence && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-[#45475a]/50 border-[#585b70] text-[#a6e3a1]"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          {Math.round(message.metadata.confidence * 100)}%
                        </Badge>
                      )}
                      {message.metadata.priority && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            message.metadata.priority === "high"
                              ? "bg-[#f38ba8]/20 text-[#f38ba8] border-[#f38ba8]/30"
                              : message.metadata.priority === "medium"
                              ? "bg-[#f9e2af]/20 text-[#f9e2af] border-[#f9e2af]/30"
                              : "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {message.metadata.priority}
                        </Badge>
                      )}
                      {message.metadata.aiGenerated && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Suggestion Actions */}
                  {message.suggestion && (
                    <div className="mt-4 p-4 bg-[#45475a]/50 rounded-lg border border-[#585b70]">
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant="outline"
                          className="bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30 text-xs font-medium"
                        >
                          {getSuggestionIcon(message.suggestion.type)}
                          {message.suggestion.type || "suggestion"}
                        </Badge>
                        {message.metadata?.confidence && (
                          <span className="text-xs text-[#6c7086] font-medium">
                            {Math.round(message.metadata.confidence * 100)}%
                            confidence
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm text-[#cdd6f4] font-semibold mb-1">
                        {message.suggestion.action}
                      </h4>
                      <p className="text-xs text-[#6c7086] mb-4 leading-relaxed">
                        {message.suggestion.preview}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(message.id)}
                          disabled={isLoading}
                          className="h-8 px-3 text-xs bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90 font-medium transition-colors duration-200"
                        >
                          {getSuggestionIcon(message.suggestion.type)}
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectSuggestion(message.id)}
                          className="h-8 px-3 text-xs bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244] transition-colors duration-200"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-[#6c7086] font-medium">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#313244] text-[#cdd6f4] rounded-xl p-4 border border-[#45475a] max-w-[85%]">
                  <div className="flex items-center space-x-3">
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
                    <span className="text-sm text-[#6c7086] font-medium">
                      AI is analyzing your request...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="border-t border-[#313244] bg-[#1e1e2e] p-4">
          <h4 className="text-sm font-medium text-[#cdd6f4] mb-3 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-[#f9e2af]" />
            Quick Actions
          </h4>
          <div className="space-y-2">
            {quickSuggestions.slice(0, 4).map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => setInputValue(suggestion)}
                className="w-full justify-start text-xs text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] h-8 px-3 rounded-lg transition-colors duration-200"
              >
                <Zap className="h-3 w-3 mr-2 text-[#cba6f7]" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[#313244] bg-[#1e1e2e] p-4">
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your data..."
                className="flex-1 bg-[#181825] border-[#45475a] text-[#cdd6f4] text-sm placeholder-[#6c7086] focus:border-[#cba6f7] transition-colors duration-200"
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
                className="bg-gradient-to-r from-[#cba6f7] to-[#b4a7ff] text-[#1e1e2e] hover:from-[#b4a7ff] hover:to-[#cba6f7] disabled:bg-[#6c7086] disabled:text-[#45475a] transition-all duration-200 px-4"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#1e1e2e] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[#6c7086] text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #313244;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #45475a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #585b70;
        }
      `}</style>
    </div>
  );
}
