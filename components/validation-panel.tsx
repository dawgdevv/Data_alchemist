"use client"

import { AlertTriangle, FileX, Users, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ValidationPanelProps {
  validationErrors: { [key: string]: number }
  onErrorClick: (file: string, error: string) => void
}

export default function ValidationPanel({ validationErrors, onErrorClick }: ValidationPanelProps) {
  const errorDetails = {
    clients: ["Invalid email format in row 2", "Missing phone number in row 3"],
    workers: ["Invalid rate format in row 2"],
    tasks: [],
  }

  const fileIcons = {
    clients: Users,
    workers: Briefcase,
    tasks: FileX,
  }

  const totalErrors = Object.values(validationErrors).reduce((sum, count) => sum + count, 0)

  if (totalErrors === 0) return null

  return (
    <Card className="bg-[#f9e2af]/10 border-[#f9e2af]/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#f9e2af] flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-[#cdd6f4]">
            <span className="font-medium text-[#f9e2af]">{totalErrors}</span> validation errors found across your data
            files.
          </div>

          {Object.entries(validationErrors).map(([file, count]) => {
            if (count === 0) return null
            const Icon = fileIcons[file as keyof typeof fileIcons]

            return (
              <div key={file} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-[#f9e2af]" />
                  <span className="font-medium text-[#cdd6f4] capitalize">{file}.csv</span>
                  <span className="text-sm text-[#f9e2af]">({count} errors)</span>
                </div>
                <ul className="ml-6 space-y-1">
                  {errorDetails[file as keyof typeof errorDetails].map((error, index) => (
                    <li key={index} className="text-sm text-[#6c7086]">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-[#6c7086] hover:text-[#cdd6f4] text-left"
                        onClick={() => onErrorClick(file, error)}
                      >
                        • {error}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
