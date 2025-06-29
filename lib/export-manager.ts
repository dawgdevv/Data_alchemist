// Example usage of export functionality
// This demonstrates how to use the export API programmatically

import { useState, useCallback } from "react";
import {
  ExportStatsResponse,
  JSONExportResponse,
  FileStats,
} from "@/types/export";

class ExportManager {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Check if export is ready and get file statistics
   */
  async checkExportReadiness(): Promise<ExportStatsResponse> {
    const response = await fetch(`/api/export?sessionId=${this.sessionId}`);

    if (!response.ok) {
      throw new Error(`Export readiness check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Export data as CSV files
   * @param files - Optional array of specific files to export
   */
  async exportCSV(files?: string[]): Promise<void> {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        format: "csv",
        files,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Export failed");
    }

    // Handle file download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Get filename from response headers
    const contentDisposition = response.headers.get("content-disposition");
    let filename = "clean_data_export.csv";
    if (contentDisposition) {
      const matches = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export data as JSON
   * @param files - Optional array of specific files to export
   */
  async exportJSON(files?: string[]): Promise<JSONExportResponse> {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        format: "json",
        files,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Export failed");
    }

    return await response.json();
  }

  /**
   * Download JSON export as file
   * @param files - Optional array of specific files to export
   */
  async downloadJSON(files?: string[]): Promise<void> {
    const jsonData = await this.exportJSON(files);

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clean_data_export_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get export summary statistics
   */
  async getExportSummary(): Promise<{
    totalFiles: number;
    totalRows: number;
    totalColumns: number;
    fileBreakdown: FileStats[];
  }> {
    const stats = await this.checkExportReadiness();

    if (!stats.success || !stats.ready) {
      throw new Error("Export not ready or failed to get stats");
    }

    const totalRows = stats.fileStats.reduce(
      (sum, file) => sum + file.rowCount,
      0
    );
    const totalColumns = stats.fileStats.reduce(
      (sum, file) => sum + file.columnCount,
      0
    );

    return {
      totalFiles: stats.fileStats.length,
      totalRows,
      totalColumns,
      fileBreakdown: stats.fileStats,
    };
  }
}

// Example React hook for using export functionality
export function useExport(sessionId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState<ExportStatsResponse | null>(
    null
  );
  const [exportManager] = useState(() => new ExportManager(sessionId));

  // Load export stats
  const loadStats = useCallback(async () => {
    try {
      const stats = await exportManager.checkExportReadiness();
      setExportStats(stats);
      return stats;
    } catch (error) {
      console.error("Failed to load export stats:", error);
      return null;
    }
  }, [exportManager]);

  // Export CSV
  const exportCSV = useCallback(
    async (files?: string[]) => {
      setIsExporting(true);
      try {
        await exportManager.exportCSV(files);
        return true;
      } catch (error) {
        console.error("CSV export failed:", error);
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [exportManager]
  );

  // Export JSON
  const exportJSON = useCallback(
    async (files?: string[]) => {
      setIsExporting(true);
      try {
        const result = await exportManager.exportJSON(files);
        return result;
      } catch (error) {
        console.error("JSON export failed:", error);
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [exportManager]
  );

  // Download JSON file
  const downloadJSON = useCallback(
    async (files?: string[]) => {
      setIsExporting(true);
      try {
        await exportManager.downloadJSON(files);
        return true;
      } catch (error) {
        console.error("JSON download failed:", error);
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [exportManager]
  );

  return {
    isExporting,
    exportStats,
    loadStats,
    exportCSV,
    exportJSON,
    downloadJSON,
  };
}

export default ExportManager;
