"use client";

import {
  AlertTriangle,
  FileX,
  Users,
  Briefcase,
  Info,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface ValidationPanelProps {
  validationErrors: { [key: string]: number };
  validationDetails: ValidationError[];
  onErrorClick: (file: string, error: string) => void;
}

export default function ValidationPanel({
  validationErrors,
  validationDetails,
  onErrorClick,
}: ValidationPanelProps) {
  const fileIcons = {
    clients: Users,
    workers: Briefcase,
    tasks: FileX,
  };

  const severityIcons = {
    error: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  };

  const severityColors = {
    error: "text-[#f38ba8]",
    warning: "text-[#f9e2af]",
    info: "text-[#89b4fa]",
  };

  const totalErrors = Object.values(validationErrors).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalErrors === 0) return null;

  // Group validation details by file
  const errorsByFile = validationDetails.reduce((acc, error) => {
    if (!acc[error.file]) acc[error.file] = [];
    acc[error.file].push(error);
    return acc;
  }, {} as { [file: string]: ValidationError[] });

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
            <span className="font-medium text-[#f9e2af]">{totalErrors}</span>{" "}
            validation issues found across your data files.
          </div>

          {Object.entries(validationErrors).map(([file, count]) => {
            if (count === 0) return null;
            const Icon = fileIcons[file as keyof typeof fileIcons];
            const fileErrors = errorsByFile[file] || [];

            return (
              <div key={file} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-[#f9e2af]" />
                  <span className="font-medium text-[#cdd6f4] capitalize">
                    {file}.csv
                  </span>
                  <span className="text-sm text-[#f9e2af]">
                    ({count} issues)
                  </span>
                </div>

                <div className="ml-6 space-y-2">
                  {fileErrors.slice(0, 5).map((error, index) => {
                    const SeverityIcon = severityIcons[error.severity];
                    const severityColor = severityColors[error.severity];

                    return (
                      <div
                        key={error.id}
                        className="flex items-start space-x-2 p-2 bg-[#313244] rounded"
                      >
                        <SeverityIcon
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${severityColor}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge
                              variant="outline"
                              className="text-xs bg-[#45475a] text-[#cdd6f4] border-[#585b70]"
                            >
                              {error.rule}
                            </Badge>
                            <span className="text-xs text-[#6c7086] capitalize">
                              {error.severity}
                            </span>
                            {error.row !== undefined && (
                              <span className="text-xs text-[#6c7086]">
                                Row {error.row + 1}
                              </span>
                            )}
                            {error.column && (
                              <span className="text-xs text-[#6c7086]">
                                {error.column}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-[#cdd6f4] hover:text-[#f38ba8] text-left text-sm font-normal"
                            onClick={() => onErrorClick(file, error.message)}
                          >
                            {error.message}
                          </Button>
                          {error.suggestion && (
                            <div className="text-xs text-[#a6e3a1] mt-1">
                              💡 {error.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {fileErrors.length > 5 && (
                    <div className="text-xs text-[#6c7086] ml-6">
                      ... and {fileErrors.length - 5} more issues
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
