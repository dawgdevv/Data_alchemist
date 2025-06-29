import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, fileType, rowIndex, column, currentValue, context } =
      await request.json();

    if (!sessionId || !fileType || rowIndex === undefined || !column) {
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

    const suggestion = await aiService.generateCellSuggestion(
      fileType,
      rowIndex,
      column,
      currentValue,
      context,
      sessionData
    );

    return NextResponse.json({
      success: true,
      suggestion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Cell Suggestion Error:", error);
    return NextResponse.json(
      {
        error: "Cell suggestion failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
