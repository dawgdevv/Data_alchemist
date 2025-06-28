import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, query } = await request.json();

    if (!sessionId || !query) {
      return NextResponse.json(
        { error: "SessionId and query required" },
        { status: 400 }
      );
    }

    console.log("NL Search - Processing query:", query);

    const sessionData = await getSession(sessionId);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return NextResponse.json(
        { error: "No session data found" },
        { status: 404 }
      );
    }

    const results = await aiService.processNaturalLanguageQuery(
      query,
      sessionData
    );

    console.log("NL Search - Results:", {
      targetTable: results.targetTable,
      resultCount: results.results.length,
    });

    return NextResponse.json({
      success: true,
      query,
      results,
      resultCount: results.results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("NL Search Error:", error);
    return NextResponse.json(
      {
        error: "Natural language search failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
