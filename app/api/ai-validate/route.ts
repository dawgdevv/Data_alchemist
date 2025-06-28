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

    console.log("AI Validate - Starting validation for session:", sessionId);

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

    // Run AI-enhanced validation
    const aiValidation = await aiService.validateDataWithAI(sessionData);

    // Generate correction suggestions for existing errors
    const existingErrors = []; // You can get from your existing validation if needed
    const corrections = await aiService.generateDataCorrections(
      sessionData,
      existingErrors
    );

    console.log("AI Validate - Completed:", {
      aiErrors: aiValidation.errors.length,
      corrections: corrections.length,
    });

    return NextResponse.json({
      success: true,
      aiValidation,
      corrections,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Validation Error:", error);
    return NextResponse.json(
      {
        error: "AI validation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
