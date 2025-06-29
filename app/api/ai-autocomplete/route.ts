import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, fileType, column, currentValue, context } =
      await request.json();

    if (!sessionId || !fileType || !column || !currentValue) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const sessionData = await getSession(sessionId);
    if (!sessionData || !sessionData[fileType]) {
      return NextResponse.json(
        { error: "Session data not found" },
        { status: 404 }
      );
    }

    const suggestions = await aiService.generateAutocompleteSuggestions(
      fileType,
      column,
      currentValue,
      context,
      sessionData
    );

    return NextResponse.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Autocomplete Error:", error);
    return NextResponse.json(
      {
        error: "Autocomplete failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
