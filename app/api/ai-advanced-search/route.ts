import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, query, context } = await request.json();

    if (!sessionId || !query) {
      return NextResponse.json(
        { error: "SessionId and query required" },
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

    const response = await aiService.processAdvancedNLQuery(
      query,
      sessionData,
      context
    );

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Advanced Search Error:", error);
    return NextResponse.json(
      {
        error: "Advanced search failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
