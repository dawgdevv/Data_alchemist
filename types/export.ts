// Export API Types
export interface ExportFormat {
  format: "csv" | "json" | "xlsx";
  files?: string[]; // specific files to export, if not provided exports all
}

export interface ExportResponse {
  success: boolean;
  error?: string;
  details?: string;
}

export interface ExportStatsResponse {
  success: boolean;
  ready: boolean;
  availableFiles: string[];
  fileStats: FileStats[];
  sessionId: string;
  error?: string;
}

export interface FileStats {
  name: string;
  rowCount: number;
  columnCount: number;
  fileName: string;
  fileType: string;
}

export interface ExportMetadata {
  sessionId: string;
  exportFormat: string;
  filesExported: string[];
  exportedAt: string;
}

export interface JSONExportData {
  headers: string[];
  data: Record<string, any>[];
  metadata: {
    fileName: string;
    fileType: string;
    rowCount: number;
    exportedAt: string;
  };
}

export interface JSONExportResponse {
  success: true;
  data: { [fileName: string]: JSONExportData };
  metadata: ExportMetadata;
}
