"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Edit3 } from "lucide-react";
import { useSession } from "@/hooks/use-session";

interface DataGridProps {
  validationErrors?: { [key: string]: number };
}

export default function DataGrid({ validationErrors = {} }: DataGridProps) {
  const { sessionData } = useSession();
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
    table: string;
  } | null>(null);

  const availableTables = Object.keys(sessionData).filter(
    (key) => sessionData[key]
  );

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
                className="border-b border-[#313244] hover:bg-[#45475a]/30"
              >
                {headers.map((header) => (
                  <td key={header} className="p-3 relative group">
                    <div className="flex items-center space-x-2">
                      {editingCell?.row === rowIndex &&
                      editingCell?.col === header &&
                      editingCell?.table === tableKey ? (
                        <Input
                          defaultValue={row[header] || ""}
                          className="h-8 bg-[#1e1e2e] border-[#cba6f7] text-[#cdd6f4]"
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="text-[#cdd6f4]">
                            {row[header] || "-"}
                          </span>
                          {/* Add validation indicators here */}
                          {isFieldInvalid(row[header], header) && (
                            <AlertTriangle className="h-4 w-4 text-[#f38ba8]" />
                          )}
                        </>
                      )}
                      <Edit3
                        className="h-3 w-3 text-[#6c7086] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                        onClick={() =>
                          setEditingCell({
                            row: rowIndex,
                            col: header,
                            table: tableKey,
                          })
                        }
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const isFieldInvalid = (value: any, fieldName: string): boolean => {
    // Basic validation logic - you can expand this
    if (fieldName.toLowerCase().includes("email")) {
      return !value || !value.includes("@");
    }
    if (fieldName.toLowerCase().includes("phone")) {
      return !value;
    }
    return false;
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
        <CardTitle className="text-[#cdd6f4]">Data Preview & Editing</CardTitle>
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
