"use client";

import { useState, useEffect } from "react";
import { Upload, Database, Settings, Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadZone from "@/components/upload-zone";
import DataGrid from "@/components/data-grid";
import ValidationPanel from "@/components/validation-panel";
import RuleBuilder from "@/components/rule-builder";
import PrioritizationPanel from "@/components/prioritization-panel";
import ExportPanel from "@/components/export-panel";
import AIAssistant from "@/components/ai-assistant";
import { useSession } from "@/hooks/use-session";

import SessionManager from "@/components/session-manager";

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

export default function DataAlchemist() {
  // ALWAYS declare all hooks in the same order - no conditional hooks
  const {
    sessionData,
    clearSession,
    lastValidationResult,
    validateCurrentSession,
  } = useSession();
  const [activeTab, setActiveTab] = useState("upload");
  const [validationErrors, setValidationErrors] = useState({
    clients: 0,
    workers: 0,
    tasks: 0,
  });
  const [validationDetails, setValidationDetails] = useState<ValidationError[]>(
    []
  );
  const [rules, setRules] = useState<any[]>([]);
  const [prioritizationData, setPrioritizationData] = useState({
    weights: {
      priorityLevel: 8,
      taskFulfillment: 7,
      fairnessConstraints: 6,
      workerUtilization: 5,
      phaseBalance: 4,
      skillOptimization: 6,
    },
    profile: "custom",
  });
  const [aiReloadKey, setAiReloadKey] = useState(0);

  // All useEffect hooks should also be declared unconditionally
  useEffect(() => {
    if (lastValidationResult) {
      console.log(
        "Updating validation state from lastValidationResult:",
        lastValidationResult
      );

      setValidationErrors(
        lastValidationResult.errorCounts || {
          clients: 0,
          workers: 0,
          tasks: 0,
        }
      );
      setValidationDetails(lastValidationResult.errors || []);
    }
  }, [lastValidationResult]);

  // ✅ Fixed useEffect with proper dependencies
  useEffect(() => {
    const runValidationIfNeeded = async () => {
      // Only run validation if we have session data but no validation result
      if (
        Object.keys(sessionData).length > 0 &&
        (!lastValidationResult || lastValidationResult.errors.length === 0)
      ) {
        console.log(
          "Session data loaded but no validation result, running validation..."
        );
        if (validateCurrentSession) {
          await validateCurrentSession();
        }
      }
    };

    // Small delay to ensure session is fully loaded
    const timeoutId = setTimeout(runValidationIfNeeded, 100);
    return () => clearTimeout(timeoutId);
  }, [sessionData, lastValidationResult, validateCurrentSession]);

  const totalErrors = Object.values(validationErrors).reduce(
    (sum, count) => sum + count,
    0
  );
  const uploadedCount = Object.keys(sessionData).length;

  const handleFileUploaded = async (
    fileType: string,
    data: any,
    validation: any
  ) => {
    // Switch to data tab after successful upload
    setActiveTab("data");

    // Update validation state
    if (validation) {
      console.log("File uploaded, updating validation state:", validation);
      setValidationErrors(
        validation.errorCounts || {
          clients: 0,
          workers: 0,
          tasks: 0,
        }
      );
      setValidationDetails(validation.errors || []);
    }
    setAiReloadKey((prev) => prev + 1);
  };

  const handleDataChange = async (
    file: string,
    data: any[],
    validation: any
  ) => {
    console.log("Data change detected:", { file, validation });

    // Update validation state from the returned validation result
    if (validation) {
      console.log("Updating validation state from data change:", validation);
      setValidationErrors(
        validation.errorCounts || {
          clients: 0,
          workers: 0,
          tasks: 0,
        }
      );
      setValidationDetails(validation.errors || []);
    }
  };

  const handleErrorClick = (file: string, error: string) => {
    const errorDetail = validationDetails.find(
      (err) => err.file === file && err.message === error
    );

    if (errorDetail && errorDetail.row !== undefined) {
      setActiveTab("data");
    }
  };

  const uploadedFiles = {
    clients: sessionData.clients
      ? ({ name: sessionData.clients.fileName } as File)
      : null,
    workers: sessionData.workers
      ? ({ name: sessionData.workers.fileName } as File)
      : null,
    tasks: sessionData.tasks
      ? ({ name: sessionData.tasks.fileName } as File)
      : null,
  };

  // ✅ Get data insights for better prioritization context (non-intrusive)
  const getDataInsights = () => {
    if (!Object.keys(sessionData).length) return null;

    const insights = {
      totalClients: sessionData?.clients?.data?.length || 0,
      totalWorkers: sessionData?.workers?.data?.length || 0,
      totalTasks: sessionData?.tasks?.data?.length || 0,
      avgPriorityLevel: 0,
      totalTaskRequests: 0,
      uniqueSkills: 0,
    };

    if (sessionData?.clients?.data) {
      insights.avgPriorityLevel =
        Math.round(
          (sessionData.clients.data.reduce(
            (sum: number, c: any) => sum + (parseInt(c.PriorityLevel) || 0),
            0
          ) /
            sessionData.clients.data.length) *
            10
        ) / 10;

      insights.totalTaskRequests = sessionData.clients.data.reduce(
        (sum: number, c: any) =>
          sum + (c.RequestedTaskIDs?.split(",").length || 0),
        0
      );
    }

    if (sessionData?.tasks?.data && sessionData?.workers?.data) {
      const allSkills = new Set([
        ...sessionData.tasks.data.flatMap(
          (t: any) =>
            t.RequiredSkills?.split(",").map((s: string) => s.trim()) || []
        ),
        ...sessionData.workers.data.flatMap(
          (w: any) => w.Skills?.split(",").map((s: string) => s.trim()) || []
        ),
      ]);
      insights.uniqueSkills = allSkills.size;
    }

    return insights;
  };

  const dataInsights = getDataInsights();

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] font-mono">
      {/* Header */}
      <header className="border-b border-[#313244] bg-[#181825] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-br from-[#cba6f7] to-[#f38ba8] rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-[#1e1e2e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#cdd6f4]">
                Data Alchemist
              </h1>
              <p className="text-xs text-[#6c7086]">
                Transform your data with AI precision
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* ✅ Subtle Data Insights - Only show when data exists, non-intrusive */}
            {dataInsights && (
              <div className="hidden md:flex items-center space-x-4 text-xs text-[#6c7086] border-r border-[#313244] pr-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-[#a6e3a1] rounded-full mr-1"></span>
                  {dataInsights.totalClients} Clients
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-[#89b4fa] rounded-full mr-1"></span>
                  {dataInsights.totalWorkers} Workers
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-[#fab387] rounded-full mr-1"></span>
                  {dataInsights.totalTasks} Tasks
                </span>
                {dataInsights.avgPriorityLevel > 0 && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-[#f9e2af] rounded-full mr-1"></span>
                    ~{dataInsights.avgPriorityLevel} Average Priority
                  </span>
                )}
                {dataInsights.totalTaskRequests > 0 && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-[#f38ba8] rounded-full mr-1"></span>
                    {dataInsights.totalTaskRequests} Task Requests
                  </span>
                )}
                {dataInsights.uniqueSkills > 0 && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-[#cba6f7] rounded-full mr-1"></span>
                    {dataInsights.uniqueSkills} Unique Skills
                  </span>
                )}
              </div>
            )}

            {totalErrors > 0 && (
              <Badge
                variant="destructive"
                className="bg-[#f38ba8] text-[#1e1e2e]"
              >
                {totalErrors} errors
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearSession}
              className="bg-[#1e1e2e] text-[#cdd6f4] border-[#313244] hover:bg-[#313244]"
            >
              Clear Session
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#313244] bg-[#181825] p-4">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "upload" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "upload"
                  ? "bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90"
                  : "text-[#cdd6f4] hover:bg-[#313244]"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
            <Button
              variant={activeTab === "data" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "data"
                  ? "bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90"
                  : "text-[#cdd6f4] hover:bg-[#313244]"
              }`}
              onClick={() => setActiveTab("data")}
            >
              <Database className="mr-2 h-4 w-4" />
              Data Grid
              {uploadedCount > 0 && (
                <Badge
                  variant="outline"
                  className="ml-auto bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                >
                  {uploadedCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "rules" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "rules"
                  ? "bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90"
                  : "text-[#cdd6f4] hover:bg-[#313244]"
              }`}
              onClick={() => setActiveTab("rules")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Rule Builder
            </Button>
            <Button
              variant={activeTab === "export" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "export"
                  ? "bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90"
                  : "text-[#cdd6f4] hover:bg-[#313244]"
              }`}
              onClick={() => setActiveTab("export")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </nav>

          {/* ✅ Optional: Small insights in sidebar (even more subtle) */}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "upload" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">
                    Upload Your Data Files(Wait for 1-2 seconds to get data
                    replicted)
                  </h2>
                  <p className="text-[#6c7086] mb-6">
                    Upload your CSV or XLSX files to begin data cleaning and
                    validation.
                  </p>
                  <SessionManager />
                </div>
                <UploadZone onFileUploaded={handleFileUploaded} />
                {totalErrors > 0 && (
                  <ValidationPanel
                    validationErrors={validationErrors}
                    validationDetails={validationDetails}
                    onErrorClick={handleErrorClick}
                  />
                )}
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#a6e3a1] mb-2">
                    Data Grid
                  </h2>
                  <p className="text-[#6c7086] mb-6">
                    Review and edit your uploaded data. Click on any cell to
                    edit values.
                  </p>
                </div>
                <DataGrid
                  validationErrors={validationErrors}
                  validationDetails={validationDetails}
                  onDataChange={handleDataChange}
                />
                {totalErrors > 0 && (
                  <ValidationPanel
                    validationErrors={validationErrors}
                    validationDetails={validationDetails}
                    onErrorClick={handleErrorClick}
                  />
                )}
              </div>
            )}

            {activeTab === "rules" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">
                    Rule Builder
                  </h2>
                  <p className="text-[#6c7086] mb-6">
                    Define custom rules and priorities for your data processing.
                  </p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <RuleBuilder
                    rules={rules}
                    setRules={setRules}
                    sessionData={sessionData}
                    prioritizationData={prioritizationData}
                  />
                  <PrioritizationPanel
                    prioritizationData={prioritizationData}
                    setPrioritizationData={setPrioritizationData}
                    sessionData={sessionData}
                  />
                </div>
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">
                    Export Data
                  </h2>
                  <p className="text-[#6c7086] mb-6">
                    Download your cleaned data and configuration files.
                  </p>
                </div>
                <ExportPanel
                  hasErrors={totalErrors > 0}
                  errorCount={totalErrors}
                  uploadedFiles={uploadedFiles}
                  rules={rules}
                />
              </div>
            )}
          </div>

          {/* AI Assistant Panel */}
          <AIAssistant key={aiReloadKey} uploadedFiles={uploadedFiles} />
        </main>
      </div>
    </div>
  );
}
