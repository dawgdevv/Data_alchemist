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
    const {
      sessionId,
      suggestions,
      autoApply = false,
      fixType,
    } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "SessionId is required" },
        { status: 400 }
      );
    }

    const sessionData = await getSession(sessionId);

    // Handle specific JSON fix type
    if (fixType === "json" && autoApply) {
      const result = await fixJSONFields(sessionData);

      // Update session with fixed data
      for (const [fileType, data] of Object.entries(result.correctedData)) {
        if (sessionData[fileType]) {
          await updateSessionFile(sessionId, fileType, data);
        }
      }

      return NextResponse.json({
        success: true,
        message: "JSON fields fixed successfully",
        fixedCount: result.fixedCount,
        correctedFiles: Object.keys(result.correctedData),
      });
    }

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

// ✅ JSON Fix Function
async function fixJSONFields(sessionData: SessionData): Promise<{
  correctedData: SessionData;
  fixedCount: number;
}> {
  const correctedData = { ...sessionData };
  let fixedCount = 0;

  Object.keys(sessionData).forEach((fileType) => {
    const fileData = sessionData[fileType];
    if (!fileData || !fileData.data) return;

    // Look for JSON fields (typically AttributesJSON in clients)
    const jsonColumns = fileData.headers.filter(
      (header) =>
        header.toLowerCase().includes("json") ||
        header.toLowerCase().includes("attributes")
    );

    if (jsonColumns.length > 0) {
      const correctedRows = fileData.data.map((row) => {
        const newRow = { ...row };

        jsonColumns.forEach((column) => {
          const value = row[column];
          if (value && typeof value === "string" && !isValidJSON(value)) {
            // Try to fix common JSON issues
            const fixed = fixJSONString(value);
            if (fixed !== value) {
              newRow[column] = fixed;
              fixedCount++;
            }
          }
        });

        return newRow;
      });

      correctedData[fileType] = {
        ...fileData,
        data: correctedRows,
      };
    }
  });

  return { correctedData, fixedCount };
}

// Helper function to check if string is valid JSON
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Helper function to fix common JSON issues
function fixJSONString(str: string): string {
  // Remove common prefixes that break JSON
  let fixed = str.trim();

  // Fix common issues
  if (!fixed.startsWith("{") && !fixed.startsWith("[")) {
    // If it doesn't start with { or [, try to wrap it
    if (fixed.includes(":")) {
      fixed = `{${fixed}}`;
    } else {
      fixed = `"${fixed}"`;
    }
  }

  // Fix unquoted keys
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');

  // Fix trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

  // Validate the fix
  if (isValidJSON(fixed)) {
    return fixed;
  }

  return str; // Return original if we can't fix it
}
