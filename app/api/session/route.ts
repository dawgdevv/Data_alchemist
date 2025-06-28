import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  hasSession,
  deleteSession,
  getSessionStats,
  debugSession,
} from "@/lib/session-store-redis";

// GET - Check session existence or get session info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const action = searchParams.get("action");

  if (action === "stats") {
    try {
      const stats = await getSessionStats();
      return NextResponse.json({ success: true, stats });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to get session stats" },
        { status: 500 }
      );
    }
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: "SessionId is required" },
      { status: 400 }
    );
  }

  if (action === "exists") {
    try {
      const exists = await hasSession(sessionId);
      return NextResponse.json({ success: true, exists });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to check session" },
        { status: 500 }
      );
    }
  }

  if (action === "debug") {
    try {
      await debugSession(sessionId);
      return NextResponse.json({ success: true, message: "Debug info logged" });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to debug session" },
        { status: 500 }
      );
    }
  }

  // Default: get session data
  try {
    const sessionData = await getSession(sessionId);
    return NextResponse.json({ success: true, sessionData });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get session data" },
      { status: 500 }
    );
  }
}

// DELETE - Delete session
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "SessionId is required" },
      { status: 400 }
    );
  }

  try {
    await deleteSession(sessionId);
    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
