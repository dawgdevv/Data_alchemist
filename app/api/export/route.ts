import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store-redis";
import archiver from "archiver";
import { Readable } from "stream";
import type {
  ExportFormat,
  ExportStatsResponse,
  JSONExportResponse,
} from "@/types/export";

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      format = "csv",
      files,
    }: { sessionId: string } & ExportFormat = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const sessionData = await getSession(sessionId);

    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Get the available data files
    const availableFiles = Object.keys(sessionData).filter(
      (key) =>
        sessionData[key] && sessionData[key].data && sessionData[key].headers
    );

    const filesToExport =
      files && files.length > 0
        ? files.filter((f) => availableFiles.includes(f))
        : availableFiles;

    if (filesToExport.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid data files found to export" },
        { status: 400 }
      );
    }

    if (format === "csv") {
      // If single file, return CSV directly, otherwise return ZIP
      if (filesToExport.length === 1) {
        const fileName = filesToExport[0];
        const fileData = sessionData[fileName];
        const csvContent = generateCSV(fileData.headers, fileData.data);

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${fileName}_clean.csv"`,
          },
        });
      } else {
        // Create ZIP archive with multiple CSV files
        const zipBuffer = await createZipArchive(
          sessionData,
          filesToExport,
          "csv"
        );

        return new NextResponse(zipBuffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition":
              'attachment; filename="clean_data_export.zip"',
          },
        });
      }
    } else if (format === "json") {
      // Export as JSON
      const jsonData = filesToExport.reduce((acc, fileName) => {
        acc[fileName] = {
          headers: sessionData[fileName].headers,
          data: sessionData[fileName].data,
          metadata: {
            fileName: sessionData[fileName].fileName,
            fileType: sessionData[fileName].fileType,
            rowCount: sessionData[fileName].data.length,
            exportedAt: new Date().toISOString(),
          },
        };
        return acc;
      }, {} as any);

      return NextResponse.json({
        success: true,
        data: jsonData,
        metadata: {
          sessionId,
          exportFormat: format,
          filesExported: filesToExport,
          exportedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported export format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Export failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function generateCSV(headers: string[], data: Record<string, any>[]): string {
  // Escape CSV values that contain commas, quotes, or newlines
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Create CSV header
  const csvHeaders = headers.map(escapeCSVValue).join(",");

  // Create CSV rows
  const csvRows = data.map((row) =>
    headers.map((header) => escapeCSVValue(row[header])).join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

async function createZipArchive(
  sessionData: any,
  filesToExport: string[],
  format: "csv" | "json"
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    filesToExport.forEach((fileName) => {
      const fileData = sessionData[fileName];

      if (format === "csv") {
        const csvContent = generateCSV(fileData.headers, fileData.data);
        archive.append(csvContent, { name: `${fileName}_clean.csv` });
      } else if (format === "json") {
        const jsonContent = JSON.stringify(
          {
            headers: fileData.headers,
            data: fileData.data,
            metadata: {
              fileName: fileData.fileName,
              fileType: fileData.fileType,
              rowCount: fileData.data.length,
              exportedAt: new Date().toISOString(),
            },
          },
          null,
          2
        );
        archive.append(jsonContent, { name: `${fileName}_clean.json` });
      }
    });

    archive.finalize();
  });
}

// GET endpoint to check export readiness
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const sessionData = await getSession(sessionId);

    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const availableFiles = Object.keys(sessionData).filter(
      (key) =>
        sessionData[key] && sessionData[key].data && sessionData[key].headers
    );

    const fileStats = availableFiles.map((fileName) => ({
      name: fileName,
      rowCount: sessionData[fileName].data.length,
      columnCount: sessionData[fileName].headers.length,
      fileName: sessionData[fileName].fileName,
      fileType: sessionData[fileName].fileType,
    }));

    return NextResponse.json({
      success: true,
      ready: availableFiles.length > 0,
      availableFiles,
      fileStats,
      sessionId,
    });
  } catch (error) {
    console.error("Export readiness check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check export readiness" },
      { status: 500 }
    );
  }
}
