"use client";

import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Edit3, Check, X } from "lucide-react";
import { useSession } from "@/hooks/use-session";

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

interface DataGridProps {
  validationErrors?: { [key: string]: number };
  validationDetails?: ValidationError[];
  onDataChange?: (file: string, data: any[], validation: any) => void;
}

export default function DataGrid({
  validationErrors = {},
  validationDetails = [],
  onDataChange,
}: DataGridProps) {
  const { sessionData, updateSessionCell, lastValidationResult } = useSession();
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
    table: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hoveredError, setHoveredError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const availableTables = Object.keys(sessionData).filter(
    (key) => sessionData[key]
  );

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  // Use validation data from props or fallback to last result
  const currentValidationDetails =
    validationDetails.length > 0
      ? validationDetails
      : lastValidationResult?.errors || [];

  const getCellValidationError = (
    tableKey: string,
    rowIndex: number,
    column: string
  ): ValidationError | undefined => {
    return currentValidationDetails.find(
      (error) =>
        error.file === tableKey &&
        error.row === rowIndex &&
        error.column === column
    );
  };

  const handleCellEdit = (
    tableKey: string,
    rowIndex: number,
    column: string,
    currentValue: any
  ) => {
    setEditingCell({ row: rowIndex, col: column, table: tableKey });
    setEditValue(currentValue || "");
  };

  const handleSaveEdit = async () => {
    if (!editingCell || isSaving) return;

    const { row, col, table } = editingCell;

    try {
      setIsSaving(true);

      console.log(`Saving edit: ${table}.${col}[${row}] = "${editValue}"`);

      // Use the cell update method - validation is handled automatically
      const result = await updateSessionCell(table, row, col, editValue);

      console.log("Cell update result:", result);

      // Notify parent component with validation result
      if (onDataChange) {
        const tableData = sessionData[table];
        if (tableData && result?.validation) {
          console.log(
            "Notifying parent of data change with validation:",
            result.validation
          );
          onDataChange(table, tableData.data, result.validation);
        }
      }

      setEditingCell(null);
      setEditValue("");

      console.log("Cell save completed successfully");
    } catch (error) {
      console.error("Failed to save cell edit:", error);
      // You might want to show an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const renderTable = (tableKey: string) => {
    const tableData = sessionData[tableKey];
    if (!tableData || !tableData.data.length) {
      return (
        <div className="text-center py-8 text-[#6c7086]">
          <p>No data available. Please upload a {tableKey} file first.</p>
        </div>
      );
    }

    const { headers, data } = tableData;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#45475a]">
              {headers.map((header) => (
                <th
                  key={header}
                  className="text-left p-3 text-[#cdd6f4] font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[#313244] hover:bg-[#45475a]/20"
              >
                {headers.map((header) => {
                  const cellError = getCellValidationError(
                    tableKey,
                    rowIndex,
                    header
                  );
                  const hasError = !!cellError;
                  const isEditing =
                    editingCell?.row === rowIndex &&
                    editingCell?.col === header &&
                    editingCell?.table === tableKey;
                  const cellId = `${tableKey}-${rowIndex}-${header}`;

                  return (
                    <td
                      key={header}
                      className={`p-3 relative ${
                        hasError ? "bg-[#f38ba8]/10" : ""
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-8 bg-[#1e1e2e] border-[#cba6f7] text-[#cdd6f4] text-sm"
                            placeholder="Enter value..."
                            disabled={isSaving}
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="h-8 w-8 p-0 bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                          >
                            {isSaving ? (
                              <div className="w-3 h-3 border border-[#1e1e2e] border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="h-8 w-8 p-0 bg-[#f38ba8] text-[#1e1e2e] hover:bg-[#f38ba8]/90 border-[#f38ba8]"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="group flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <span
                              className={`text-[#cdd6f4] ${
                                hasError ? "text-[#f38ba8]" : ""
                              } ${!row[header] ? "text-[#6c7086] italic" : ""}`}
                            >
                              {row[header] || "—"}
                            </span>
                            {hasError && (
                              <div className="relative">
                                <AlertTriangle
                                  className="h-4 w-4 text-[#f38ba8] cursor-help"
                                  onMouseEnter={() => setHoveredError(cellId)}
                                  onMouseLeave={() => setHoveredError(null)}
                                />
                                {hoveredError === cellId && (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-[#1e1e2e] border border-[#f38ba8] rounded-lg text-xs text-[#cdd6f4] z-50 shadow-lg">
                                    <div className="font-medium text-[#f38ba8] mb-2">
                                      {cellError.rule}:{" "}
                                      {cellError.severity.toUpperCase()}
                                    </div>
                                    <div className="mb-2 text-[#cdd6f4]">
                                      {cellError.message}
                                    </div>
                                    {cellError.suggestion && (
                                      <div className="text-[#a6e3a1] border-t border-[#45475a] pt-2">
                                        💡 {cellError.suggestion}
                                      </div>
                                    )}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#f38ba8]"></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCellEdit(
                                tableKey,
                                rowIndex,
                                header,
                                row[header]
                              )
                            }
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#45475a] transition-all duration-200"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (availableTables.length === 0) {
    return (
      <Card className="bg-[#313244] border-[#45475a]">
        <CardContent className="p-8 text-center">
          <p className="text-[#6c7086]">
            No data files uploaded yet. Please upload your CSV/XLSX files first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#313244] border-[#45475a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#cdd6f4] flex items-center">
            Data Preview & Editing
            <Badge
              variant="outline"
              className="ml-3 bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30"
            >
              Click any cell to edit
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {editingCell && (
              <div className="flex items-center space-x-2 text-sm text-[#6c7086]">
                <span>
                  Editing: {editingCell.table}.{editingCell.col}
                </span>
                <Badge
                  variant="outline"
                  className="bg-[#f9e2af]/20 text-[#f9e2af] border-[#f9e2af]/30"
                >
                  Press Enter to save, Esc to cancel
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableTables[0]} className="w-full">
          <TabsList
            className="grid w-full bg-[#45475a]"
            style={{
              gridTemplateColumns: `repeat(${availableTables.length}, 1fr)`,
            }}
          >
            {availableTables.map((tableKey) => (
              <TabsTrigger
                key={tableKey}
                value={tableKey}
                className="data-[state=active]:bg-[#cba6f7] data-[state=active]:text-[#1e1e2e] text-[#cdd6f4] capitalize"
              >
                {tableKey}
                {validationErrors[tableKey] > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 text-xs bg-[#f38ba8] text-[#1e1e2e]"
                  >
                    {validationErrors[tableKey]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableTables.map((tableKey) => (
            <TabsContent key={tableKey} value={tableKey} className="mt-4">
              {renderTable(tableKey)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
