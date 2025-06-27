"use client"

import { useState } from "react"
import { Upload, Database, Settings, Zap, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import UploadZone from "@/components/upload-zone"
import DataGrid from "@/components/data-grid"
import ValidationPanel from "@/components/validation-panel"
import RuleBuilder from "@/components/rule-builder"
import PrioritizationPanel from "@/components/prioritization-panel"
import ExportPanel from "@/components/export-panel"
import AIAssistant from "@/components/ai-assistant"

export default function DataAlchemist() {
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({
    clients: null,
    workers: null,
    tasks: null,
  })
  const [validationErrors, setValidationErrors] = useState({
    clients: 2,
    workers: 1,
    tasks: 0,
  })
  const [rules, setRules] = useState<any[]>([])

  const totalErrors = Object.values(validationErrors).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] font-mono">
      {/* Header */}
      <header className="border-b border-[#313244] bg-[#181825] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cba6f7] text-[#1e1e2e]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f38ba8]">Data Alchemist</h1>
              <p className="text-sm text-[#6c7086]">AI-Powered Data Cleaning & Validation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-[#f9e2af] text-[#1e1e2e] border-[#f9e2af]">
              {totalErrors} errors
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#1e1e2e] text-[#cdd6f4] border-[#313244] hover:bg-[#313244]"
            >
              Save Project
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === "upload" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">Upload Your Data Files</h2>
                    <p className="text-[#6c7086] mb-6">
                      Upload your CSV or XLSX files to begin data cleaning and validation.
                    </p>
                  </div>
                  <UploadZone uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
                  {totalErrors > 0 && (
                    <ValidationPanel
                      validationErrors={validationErrors}
                      onErrorClick={(file, error) => {
                        setActiveTab("data")
                        // Logic to highlight specific error in data grid
                      }}
                    />
                  )}
                </div>
              )}

              {activeTab === "data" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">Data Grid</h2>
                    <p className="text-[#6c7086] mb-6">Review and edit your data with inline validation.</p>
                  </div>
                  <DataGrid uploadedFiles={uploadedFiles} validationErrors={validationErrors} />
                </div>
              )}

              {activeTab === "rules" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">Rule Builder</h2>
                    <p className="text-[#6c7086] mb-6">Define custom rules and priorities for your data processing.</p>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <RuleBuilder rules={rules} setRules={setRules} />
                    <PrioritizationPanel />
                  </div>
                </div>
              )}

              {activeTab === "export" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#f38ba8] mb-2">Export Data</h2>
                    <p className="text-[#6c7086] mb-6">Download your cleaned data and configuration files.</p>
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
            <AIAssistant />
          </div>
        </main>
      </div>
    </div>
  )
}
