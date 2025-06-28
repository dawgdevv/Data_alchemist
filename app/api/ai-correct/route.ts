import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSessionFile } from "@/lib/session-store-redis";
import { aiService } from "@/lib/ai-service";

interface SessionData {
  [key: string]: {
    headers: string[];
    data: Record<string, any>[];
    fileName: string;
    fileType: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, suggestions, autoApply = false } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "SessionId is required" },
        { status: 400 }
      );
    }

    const sessionData = await getSession(sessionId);

    if (autoApply && suggestions && Array.isArray(suggestions)) {
      // Apply AI suggestions to data
      const correctedData = await applyCorrections(sessionData, suggestions);
      let appliedCount = 0;

      // Update session with corrected data
      for (const [fileType, data] of Object.entries(correctedData)) {
        if (sessionData[fileType]) {
          // Only update files that existed before
          await updateSessionFile(sessionId, fileType, data);
          appliedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: "Corrections applied successfully",
        appliedCount: suggestions.length,
        correctedFiles: Object.keys(correctedData),
      });
    } else {
      // Just return suggestions for user review
      const corrections = await aiService.generateDataCorrections(
        sessionData,
        [] // Pass empty array for now, or get actual validation errors
      );

      return NextResponse.json({
        success: true,
        suggestions: corrections,
        suggestionsCount: corrections.length,
      });
    }
  } catch (error) {
    console.error("AI Correction Error:", error);
    return NextResponse.json(
      {
        error: "AI correction failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ✅ FIXED: Corrected property names and structure
async function applyCorrections(sessionData: SessionData, suggestions: any[]) {
  const correctedData = { ...sessionData };

  console.log("Applying corrections:", suggestions);
  console.log("Available session data files:", Object.keys(sessionData));

  for (const suggestion of suggestions) {
    // ✅ Use the correct property names from DataSuggestion interface
    const { field, rowIndex } = suggestion;
    let { suggestedValue } = suggestion;

    // Determine target file from the suggestion or field name
    let targetFile = suggestion.file;

    // If no file specified, try to infer from field name
    if (!targetFile) {
      if (
        field.includes("Client") ||
        field === "PriorityLevel" ||
        field === "AttributesJSON"
      ) {
        targetFile = "clients";
      } else if (
        field.includes("Worker") ||
        field === "Skills" ||
        field === "AvailableSlots"
      ) {
        targetFile = "workers";
      } else if (
        field.includes("Task") ||
        field === "Duration" ||
        field === "RequiredSkills"
      ) {
        targetFile = "tasks";
      } else {
        console.warn("Could not determine target file for field:", field);
        continue;
      }
    }

    // Check if the file and row exist
    if (!correctedData[targetFile]) {
      console.warn(`Target file ${targetFile} not found in session data`);
      continue;
    }

    if (!correctedData[targetFile].data[rowIndex]) {
      console.warn(`Row ${rowIndex} not found in ${targetFile}`);
      continue;
    }

    // Apply the correction
    console.log(
      `Applying correction: ${targetFile}[${rowIndex}].${field} = ${suggestedValue}`
    );
    correctedData[targetFile].data[rowIndex][field] = suggestedValue;
  }

  return correctedData;
}
