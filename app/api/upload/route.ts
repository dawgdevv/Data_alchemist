import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

// In-memory session storage (you can replace with Redis or database)
const sessions = new Map<string, SessionData>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !fileType || !sessionId) {
      return NextResponse.json(
        { error: "File, fileType, and sessionId are required" },
        { status: 400 }
      );
    }

    // Parse file based on extension
    const buffer = await file.arrayBuffer();
    let parsedData: ParsedFileData;

    if (file.name.endsWith(".csv")) {
      parsedData = await parseCSV(buffer, file.name);
    } else if (file.name.endsWith(".xlsx")) {
      parsedData = await parseXLSX(buffer, file.name);
    } else {
      return NextResponse.json(
        { error: "Unsupported file format" },
        { status: 400 }
      );
    }

    // Store in session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {});
    }
    const sessionData = sessions.get(sessionId)!;
    sessionData[fileType] = parsedData;

    return NextResponse.json({
      success: true,
      data: parsedData,
      sessionData: sessionData,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}

async function parseCSV(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedFileData> {
  const text = new TextDecoder().decode(buffer);

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          data: results.data as Record<string, any>[],
          fileName,
          fileType: "csv",
        });
      },
      error: (error) => reject(error),
    });
  });
}

async function parseXLSX(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedFileData> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = jsonData[0] as string[];
  const data = jsonData.slice(1).map((row: any[]) => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });

  return {
    headers,
    data,
    fileName,
    fileType: "xlsx",
  };
}

// Get session data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "SessionId required" }, { status: 400 });
  }

  const sessionData = sessions.get(sessionId) || {};
  return NextResponse.json({ sessionData });
}
