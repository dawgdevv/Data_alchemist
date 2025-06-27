"use client"

import { Download, FileText, Settings, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExportPanelProps {
  hasErrors: boolean
  errorCount: number
  uploadedFiles: { [key: string]: File | null }
  rules: any[]
}

export default function ExportPanel({ hasErrors, errorCount, uploadedFiles, rules }: ExportPanelProps) {
  const uploadedCount = Object.values(uploadedFiles).filter((file) => file !== null).length
  const hasRules = rules.length > 0

  const downloadCleanCSVs = () => {
    // Mock download functionality
    console.log("Downloading clean CSVs...")
  }

  const downloadRulesJson = () => {
    const rulesJson = JSON.stringify(rules, null, 2)
    const blob = new Blob([rulesJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "rules.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {hasErrors && (
        <Alert className="bg-[#f38ba8]/10 border-[#f38ba8]/30">
          <AlertTriangle className="h-4 w-4 text-[#f38ba8]" />
          <AlertDescription className="text-[#cdd6f4]">
            <span className="font-medium text-[#f38ba8]">{errorCount} errors remaining</span> - Export is disabled until
            all validation errors are resolved.
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
            <CardDescription className="text-[#6c7086]">Download your validated and cleaned CSV files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#cdd6f4]">Files uploaded:</span>
                <Badge
                  variant="outline"
                  className={`${
                    uploadedCount === 3
                      ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                      : "bg-[#f9e2af]/20 text-[#f9e2af] border-[#f9e2af]/30"
                  }`}
                >
                  {uploadedCount}/3
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
            </div>

            <Button
              onClick={downloadCleanCSVs}
              disabled={hasErrors || uploadedCount === 0}
              className="w-full bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90 disabled:bg-[#6c7086] disabled:text-[#45475a]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Clean CSVs
            </Button>

            {hasErrors && <p className="text-xs text-[#6c7086] text-center">Fix validation errors to enable export</p>}
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
                <Badge variant="outline" className="bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30">
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
              <p className="text-xs text-[#6c7086] text-center">Create rules in the Rule Builder to enable export</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#313244] border-[#45475a]">
        <CardHeader>
          <CardTitle className="text-[#cdd6f4]">Export Summary</CardTitle>
          <CardDescription className="text-[#6c7086]">Overview of your data processing pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-[#45475a] rounded-lg">
              <div className="text-2xl font-bold text-[#a6e3a1]">{uploadedCount}</div>
              <div className="text-sm text-[#6c7086]">Files Processed</div>
            </div>
            <div className="p-4 bg-[#45475a] rounded-lg">
              <div className="text-2xl font-bold text-[#fab387]">{rules.length}</div>
              <div className="text-sm text-[#6c7086]">Rules Configured</div>
            </div>
            <div className="p-4 bg-[#45475a] rounded-lg">
              <div className={`text-2xl font-bold ${hasErrors ? "text-[#f38ba8]" : "text-[#a6e3a1]"}`}>
                {hasErrors ? errorCount : "✓"}
              </div>
              <div className="text-sm text-[#6c7086]">{hasErrors ? "Errors Found" : "All Clean"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
