import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, options } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "SessionId required" },
        { status: 400 }
      );
    }

    console.log(
      "AI Validate - Starting enhanced validation for session:",
      sessionId
    );

    const sessionData = await getSession(sessionId);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return NextResponse.json(
        { error: "No session data found" },
        { status: 404 }
      );
    }

    console.log(
      "AI Validate - Session data loaded, files:",
      Object.keys(sessionData)
    );

    // ✅ ENHANCED: Run comprehensive AI-enhanced validation
    const aiValidationResult = await aiService.validateDataWithAI(sessionData);

    console.log("AI Validate - Comprehensive validation completed:", {
      aiErrors: aiValidationResult.errors.length,
      suggestions: aiValidationResult.suggestions.length,
      overallScore: aiValidationResult.dataQuality.overallScore,
      patterns: aiValidationResult.patterns.length,
      confidence: aiValidationResult.confidence,
    });

    // ✅ NEW: Categorize results by severity and type
    const errorsByCategory = {
      critical: aiValidationResult.errors.filter((e) => e.severity === "error"),
      warnings: aiValidationResult.errors.filter(
        (e) => e.severity === "warning"
      ),
      info: aiValidationResult.errors.filter((e) => e.severity === "info"),
      aiGenerated: aiValidationResult.errors.filter((e) => e.aiGenerated),
    };

    const suggestionsByType = {
      critical: aiValidationResult.suggestions.filter(
        (s) => s.type === "critical"
      ),
      fixes: aiValidationResult.suggestions.filter((s) => s.type === "fix"),
      enhancements: aiValidationResult.suggestions.filter(
        (s) => s.type === "enhancement"
      ),
      autoFixable: aiValidationResult.suggestions.filter((s) => s.autoFixable),
    };

    // ✅ NEW: Generate summary insights
    const insights = {
      dataQualityGrade: getQualityGrade(
        aiValidationResult.dataQuality.overallScore
      ),
      topIssues: aiValidationResult.patterns
        .filter((p) => p.severity === "high")
        .slice(0, 3)
        .map((p) => p.description),
      recommendedActions: generateRecommendedActions(aiValidationResult),
      readinessScore: calculateReadinessScore(aiValidationResult),
      estimatedFixTime: estimateFixTime(aiValidationResult.suggestions),
    };

    return NextResponse.json({
      success: true,
      aiValidation: aiValidationResult,
      categorizedResults: {
        errors: errorsByCategory,
        suggestions: suggestionsByType,
      },
      insights,
      summary: {
        totalIssues: aiValidationResult.errors.length,
        criticalIssues: errorsByCategory.critical.length,
        autoFixableIssues: suggestionsByType.autoFixable.length,
        dataQualityScore: Math.round(
          aiValidationResult.dataQuality.overallScore * 100
        ),
        confidence: Math.round(aiValidationResult.confidence * 100),
        recommendation: getOverallRecommendation(aiValidationResult),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Validation Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "AI validation failed",
        details: error instanceof Error ? error.message : String(error),
        fallbackSuggestion:
          "Try running basic validation or check your data format",
      },
      { status: 500 }
    );
  }
}

// ✅ Helper Functions
function getQualityGrade(score: number): string {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

function generateRecommendedActions(aiResult: any): string[] {
  const actions: string[] = [];

  // Based on data quality
  if (aiResult.dataQuality.completeness < 0.8) {
    actions.push("Fill missing data fields to improve completeness");
  }

  if (aiResult.dataQuality.consistency < 0.7) {
    actions.push("Standardize data formats across columns");
  }

  if (aiResult.dataQuality.accuracy < 0.8) {
    actions.push("Review and correct data accuracy issues");
  }

  // Based on patterns
  const highSeverityPatterns = aiResult.patterns.filter(
    (p: any) => p.severity === "high"
  );
  if (highSeverityPatterns.length > 0) {
    actions.push("Address high-severity data patterns immediately");
  }

  // Based on suggestions
  const criticalSuggestions = aiResult.suggestions.filter(
    (s: any) => s.type === "critical"
  );
  if (criticalSuggestions.length > 0) {
    actions.push("Fix critical data issues before proceeding");
  }

  const autoFixable = aiResult.suggestions.filter((s: any) => s.autoFixable);
  if (autoFixable.length > 0) {
    actions.push(`Apply ${autoFixable.length} automatic fixes available`);
  }

  return actions.slice(0, 5); // Limit to top 5 actions
}

function calculateReadinessScore(aiResult: any): number {
  let score = 100;

  // Deduct for errors
  score -=
    aiResult.errors.filter((e: any) => e.severity === "error").length * 10;
  score -=
    aiResult.errors.filter((e: any) => e.severity === "warning").length * 5;

  // Deduct for low data quality
  if (aiResult.dataQuality.overallScore < 0.8) {
    score -= (0.8 - aiResult.dataQuality.overallScore) * 100;
  }

  // Deduct for high-severity patterns
  score -=
    aiResult.patterns.filter((p: any) => p.severity === "high").length * 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function estimateFixTime(suggestions: any[]): string {
  const autoFixable = suggestions.filter((s) => s.autoFixable).length;
  const manualFix = suggestions.length - autoFixable;

  let minutes = autoFixable * 0.1 + manualFix * 2; // 0.1 min per auto-fix, 2 min per manual fix

  if (minutes < 1) return "< 1 minute";
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  return `${Math.round(minutes / 60)} hours`;
}

function getOverallRecommendation(aiResult: any): string {
  const criticalErrors = aiResult.errors.filter(
    (e: any) => e.severity === "error"
  ).length;
  const dataScore = aiResult.dataQuality.overallScore;
  const autoFixable = aiResult.suggestions.filter(
    (s: any) => s.autoFixable
  ).length;

  if (criticalErrors > 5) {
    return "Data requires significant cleanup before use";
  }

  if (dataScore < 0.6) {
    return "Poor data quality - review data collection process";
  }

  if (autoFixable > 10) {
    return "Good candidate for auto-fixing - apply suggested corrections";
  }

  if (dataScore > 0.8 && criticalErrors === 0) {
    return "High-quality data - ready for processing";
  }

  return "Data quality is acceptable - minor improvements recommended";
}
