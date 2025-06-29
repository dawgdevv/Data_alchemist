"use client";

import {
  Download,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/hooks/use-session";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ExportStatsResponse } from "@/types/export";

interface ExportPanelProps {
  hasErrors: boolean;
  errorCount: number;
  uploadedFiles: { [key: string]: File | null };
  rules: any[];
}

export default function ExportPanel({
  hasErrors,
  errorCount,
  uploadedFiles,
  rules,
}: ExportPanelProps) {
  const { sessionId, sessionData } = useSession();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState<ExportStatsResponse | null>(
    null
  );

  const uploadedCount = Object.values(uploadedFiles).filter(
    (file) => file !== null
  ).length;
  const hasRules = rules.length > 0;
  const availableDataFiles = Object.keys(sessionData).filter(
    (key) =>
      sessionData[key] && sessionData[key].data && sessionData[key].headers
  );

  // Load export statistics when component mounts or session changes
  useEffect(() => {
    const loadExportStats = async () => {
      if (sessionId && availableDataFiles.length > 0) {
        try {
          const response = await fetch(`/api/export?sessionId=${sessionId}`);
          if (response.ok) {
            const stats = await response.json();
            setExportStats(stats);
          }
        } catch (error) {
          console.error("Failed to load export stats:", error);
        }
      }
    };

    loadExportStats();
  }, [sessionId, availableDataFiles.length]);

  const downloadCleanCSVs = async (format: "csv" | "json" = "csv") => {
    if (!sessionId || availableDataFiles.length === 0) {
      toast({
        title: "Export Error",
        description: "No session data available for export",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          format,
          files: availableDataFiles, // Export all available files
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      if (format === "json") {
        // Handle JSON response
        const jsonData = await response.json();
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
      } else {
        // Handle CSV/ZIP blob response
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Determine filename from response headers or use default
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

      // Update export stats
      const statsResponse = await fetch(`/api/export?sessionId=${sessionId}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setExportStats(stats);
      }

      toast({
        title: "Export Successful",
        description: `Successfully exported ${availableDataFiles.length} clean data file(s)`,
        variant: "default",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadRulesJson = () => {
    const rulesJson = JSON.stringify(rules, null, 2);
    const blob = new Blob([rulesJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rules.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {hasErrors && (
        <Alert className="bg-[#f38ba8]/10 border-[#f38ba8]/30">
          <AlertTriangle className="h-4 w-4 text-[#f38ba8]" />
          <AlertDescription className="text-[#cdd6f4]">
            <span className="font-medium text-[#f38ba8]">
              {errorCount} errors remaining
            </span>{" "}
            - Export is disabled until all validation errors are resolved.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#313244] border-[#45475a]">
          <CardHeader>
            <CardTitle className="text-[#cdd6f4] flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Clean Data Export
            </CardTitle>
            <CardDescription className="text-[#6c7086]">
              Download your validated and cleaned CSV files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#cdd6f4]">Files uploaded:</span>
                <Badge
                  variant="outline"
                  className={`${
                    availableDataFiles.length === 3
                      ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                      : "bg-[#f9e2af]/20 text-[#f9e2af] border-[#f9e2af]/30"
                  }`}
                >
                  {availableDataFiles.length}/3
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#cdd6f4]">Validation status:</span>
                <Badge
                  variant="outline"
                  className={`${
                    !hasErrors
                      ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                      : "bg-[#f38ba8]/20 text-[#f38ba8] border-[#f38ba8]/30"
                  }`}
                >
                  {hasErrors ? `${errorCount} errors` : "Clean"}
                </Badge>
              </div>
              {exportStats && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#cdd6f4]">Total rows:</span>
                  <Badge
                    variant="outline"
                    className="bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30"
                  >
                    {exportStats.fileStats?.reduce(
                      (sum: number, file: any) => sum + file.rowCount,
                      0
                    ) || 0}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => downloadCleanCSVs("csv")}
                disabled={
                  hasErrors || availableDataFiles.length === 0 || isExporting
                }
                className="w-full bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90 disabled:bg-[#6c7086] disabled:text-[#45475a]"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Clean CSVs
                  </>
                )}
              </Button>

              <Button
                onClick={() => downloadCleanCSVs("json")}
                disabled={
                  hasErrors || availableDataFiles.length === 0 || isExporting
                }
                variant="outline"
                className="w-full border-[#fab387] text-[#fab387] hover:bg-[#fab387]/10 disabled:border-[#6c7086] disabled:text-[#6c7086]"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download as JSON
                  </>
                )}
              </Button>
            </div>

            {(hasErrors || availableDataFiles.length === 0) && (
              <p className="text-xs text-[#6c7086] text-center">
                {availableDataFiles.length === 0
                  ? "Upload data files to enable export"
                  : "Fix validation errors to enable export"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#313244] border-[#45475a]">
          <CardHeader>
            <CardTitle className="text-[#cdd6f4] flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Rules Configuration
            </CardTitle>
            <CardDescription className="text-[#6c7086]">
              Export your custom rules and prioritization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#cdd6f4]">Rules defined:</span>
                <Badge
                  variant="outline"
                  className={`${
                    hasRules
                      ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                      : "bg-[#6c7086]/20 text-[#6c7086] border-[#6c7086]/30"
                  }`}
                >
                  {rules.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#cdd6f4]">Configuration:</span>
                <Badge
                  variant="outline"
                  className="bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
            </div>

            <Button
              onClick={downloadRulesJson}
              disabled={!hasRules}
              className="w-full bg-[#fab387] text-[#1e1e2e] hover:bg-[#fab387]/90 disabled:bg-[#6c7086] disabled:text-[#45475a]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download rules.json
            </Button>

            {!hasRules && (
              <p className="text-xs text-[#6c7086] text-center">
                Create rules in the Rule Builder to enable export
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#313244] border-[#45475a]">
        <CardHeader>
          <CardTitle className="text-[#cdd6f4]">Export Summary</CardTitle>
          <CardDescription className="text-[#6c7086]">
            Overview of your data processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-[#45475a] rounded-lg">
              <div className="text-2xl font-bold text-[#a6e3a1]">
                {availableDataFiles.length}
              </div>
              <div className="text-sm text-[#6c7086]">Files Processed</div>
            </div>
            <div className="p-4 bg-[#45475a] rounded-lg">
              <div className="text-2xl font-bold text-[#fab387]">
                {rules.length}
              </div>
              <div className="text-sm text-[#6c7086]">Rules Configured</div>
            </div>
            <div className="p-4 bg-[#45475a] rounded-lg">
              <div
                className={`text-2xl font-bold ${
                  hasErrors ? "text-[#f38ba8]" : "text-[#a6e3a1]"
                }`}
              >
                {hasErrors ? errorCount : "✓"}
              </div>
              <div className="text-sm text-[#6c7086]">
                {hasErrors ? "Errors Found" : "All Clean"}
              </div>
            </div>
          </div>

          {exportStats && (
            <div className="mt-4 p-4 bg-[#45475a] rounded-lg">
              <h4 className="text-sm font-medium text-[#cdd6f4] mb-2">
                Export Details
              </h4>
              <div className="space-y-1 text-xs text-[#6c7086]">
                {exportStats.fileStats?.map((file: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{file.name}:</span>
                    <span>
                      {file.rowCount} rows, {file.columnCount} columns
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
