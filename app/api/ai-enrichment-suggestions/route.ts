import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "SessionId required" },
        { status: 400 }
      );
    }

    const sessionData = await getSession(sessionId);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return NextResponse.json(
        { error: "No session data found" },
        { status: 404 }
      );
    }

    const suggestions = await aiService.generateEnrichmentSuggestions(
      sessionData
    );

    return NextResponse.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Enrichment Suggestions Error:", error);
    return NextResponse.json(
      {
        error: "Enrichment suggestions failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
