"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Edit3 } from "lucide-react"

interface DataGridProps {
  uploadedFiles: { [key: string]: File | null }
  validationErrors: { [key: string]: number }
}

export default function DataGrid({ uploadedFiles, validationErrors }: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)

  // Mock data for demonstration
  const mockData = {
    clients: [
      { id: "C001", name: "Acme Corp", email: "contact@acme.com", phone: "555-0123", status: "active" },
      { id: "C002", name: "Beta LLC", email: "invalid-email", phone: "555-0124", status: "inactive" },
      { id: "C003", name: "Gamma Inc", email: "info@gamma.com", phone: "", status: "active" },
    ],
    workers: [
      { id: "W001", name: "John Doe", skills: "JavaScript,React", availability: "full-time", rate: "75" },
      { id: "W002", name: "Jane Smith", skills: "Python,Django", availability: "part-time", rate: "invalid" },
      { id: "W003", name: "Bob Johnson", skills: "Java,Spring", availability: "full-time", rate: "80" },
    ],
    tasks: [
      { id: "T001", title: "Frontend Development", duration: "40", phase: "1", priority: "high" },
      { id: "T002", title: "Backend API", duration: "60", phase: "2", priority: "medium" },
      { id: "T003", title: "Testing", duration: "20", phase: "3", priority: "low" },
    ],
  }

  const errorRows = {
    clients: [1, 2], // Rows with errors
    workers: [1],
    tasks: [],
  }

  const renderTable = (dataKey: string, data: any[], columns: string[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#45475a]">
              {columns.map((col) => (
                <th key={col} className="text-left p-3 text-[#cdd6f4] font-medium capitalize">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-[#313244] hover:bg-[#45475a]/30 ${
                  errorRows[dataKey as keyof typeof errorRows]?.includes(rowIndex)
                    ? "bg-[#f38ba8]/10 border-[#f38ba8]/30"
                    : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col} className="p-3 relative group">
                    <div className="flex items-center space-x-2">
                      {editingCell?.row === rowIndex && editingCell?.col === col ? (
                        <Input
                          defaultValue={row[col]}
                          className="h-8 bg-[#1e1e2e] border-[#cba6f7] text-[#cdd6f4]"
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null)
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <span
                            className={`${
                              (col === "email" && !row[col].includes("@")) ||
                              (col === "phone" && !row[col]) ||
                              (col === "rate" && isNaN(Number(row[col])))
                                ? "text-[#f38ba8]"
                                : "text-[#cdd6f4]"
                            }`}
                          >
                            {row[col] || "-"}
                          </span>
                          {((col === "email" && !row[col].includes("@")) ||
                            (col === "phone" && !row[col]) ||
                            (col === "rate" && isNaN(Number(row[col])))) && (
                            <AlertTriangle className="h-4 w-4 text-[#f38ba8]" />
                          )}
                        </>
                      )}
                      <Edit3
                        className="h-3 w-3 text-[#6c7086] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                        onClick={() => setEditingCell({ row: rowIndex, col })}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <Card className="bg-[#313244] border-[#45475a]">
      <CardHeader>
        <CardTitle className="text-[#cdd6f4]">Data Preview & Editing</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#45475a]">
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-[#cba6f7] data-[state=active]:text-[#1e1e2e] text-[#cdd6f4]"
            >
              Clients
              {validationErrors.clients > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 text-xs bg-[#f38ba8] text-[#1e1e2e]">
                  {validationErrors.clients}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="workers"
              className="data-[state=active]:bg-[#cba6f7] data-[state=active]:text-[#1e1e2e] text-[#cdd6f4]"
            >
              Workers
              {validationErrors.workers > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 text-xs bg-[#f38ba8] text-[#1e1e2e]">
                  {validationErrors.workers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-[#cba6f7] data-[state=active]:text-[#1e1e2e] text-[#cdd6f4]"
            >
              Tasks
              {validationErrors.tasks > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 text-xs bg-[#f38ba8] text-[#1e1e2e]">
                  {validationErrors.tasks}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4">
            {renderTable("clients", mockData.clients, ["id", "name", "email", "phone", "status"])}
          </TabsContent>

          <TabsContent value="workers" className="mt-4">
            {renderTable("workers", mockData.workers, ["id", "name", "skills", "availability", "rate"])}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            {renderTable("tasks", mockData.tasks, ["id", "title", "duration", "phase", "priority"])}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
