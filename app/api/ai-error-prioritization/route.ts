import { NextRequest, NextResponse } from "next/server";

interface ValidationError {
  id: string;
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  file: string;
  row?: number;
  column?: string;
  value?: any;
  suggestion?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { errors, sessionData } = await request.json();

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: "Errors array required" },
        { status: 400 }
      );
    }

    // Simple AI prioritization logic
    const priorities: { [key: string]: number } = {};

    errors.forEach((error: ValidationError) => {
      let priority = 0.5; // Default priority

      // Prioritize based on severity
      if (error.severity === "error") priority += 0.3;
      else if (error.severity === "warning") priority += 0.1;

      // Prioritize based on rule type
      if (error.rule === "V1") priority += 0.4; // Missing columns are critical
      else if (error.rule === "V2") priority += 0.3; // Duplicate IDs
      else if (error.rule === "V6") priority += 0.3; // Unknown references
      else if (error.rule === "V11") priority += 0.2; // Skill coverage

      // Cap at 1.0
      priorities[error.id] = Math.min(priority, 1.0);
    });

    return NextResponse.json({
      success: true,
      priorities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Error Prioritization Error:", error);
    return NextResponse.json(
      {
        error: "Error prioritization failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
