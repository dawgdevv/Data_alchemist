"use client";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";

interface UploadZoneProps {
  onFileUploaded?: (fileType: string, data: any, validation: any) => void;
}

export default function UploadZone({ onFileUploaded }: UploadZoneProps) {
  const { uploadFile, isLoading } = useSession();
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: File | null;
  }>({
    clients: null,
    workers: null,
    tasks: null,
  });

  const fileTypes = [
    {
      key: "clients",
      label: "Clients CSV",
      description: "Client information and contact details",
    },
    {
      key: "workers",
      label: "Workers CSV",
      description: "Worker profiles and availability",
    },
    {
      key: "tasks",
      label: "Tasks CSV",
      description: "Task definitions and requirements",
    },
  ];

  const handleFileUpload = async (file: File, fileType: string) => {
    try {
      const result = await uploadFile(file, fileType);
      console.log("Upload result:", result); // Debug log

      setUploadedFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));

      // Pass both data and validation to parent
      onFileUploaded?.(fileType, result, result.validation);
    } catch (error) {
      console.error("Failed to upload file:", error);
      // You might want to show an error toast here
    }
  };

  const [clientsDropzone, workersDropzone, tasksDropzone] = [
    useDropzone({
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxFiles: 1,
      disabled: isLoading,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          handleFileUpload(acceptedFiles[0], "clients");
        }
      },
    }),
    useDropzone({
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxFiles: 1,
      disabled: isLoading,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          handleFileUpload(acceptedFiles[0], "workers");
        }
      },
    }),
    useDropzone({
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxFiles: 1,
      disabled: isLoading,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          handleFileUpload(acceptedFiles[0], "tasks");
        }
      },
    }),
  ];

  const removeFile = (fileKey: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fileKey]: null,
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {fileTypes.map((fileType) => {
        const dropzone =
          fileType.key === "clients"
            ? clientsDropzone
            : fileType.key === "workers"
            ? workersDropzone
            : tasksDropzone;
        const file = uploadedFiles[fileType.key];

        return (
          <Card
            key={fileType.key}
            className="bg-[#313244] border-[#45475a] hover:border-[#585b70] transition-colors"
          >
            <CardHeader className="pb-4">
              <CardTitle className="text-[#cdd6f4] flex items-center justify-between">
                {fileType.label}
                {file && (
                  <Badge
                    variant="outline"
                    className="bg-[#a6e3a1] text-[#1e1e2e] border-[#a6e3a1]"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-[#6c7086]">
                {fileType.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  {...dropzone.getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dropzone.isDragActive
                      ? "border-[#cba6f7] bg-[#cba6f7]/10"
                      : "border-[#585b70] hover:border-[#6c7086]"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input {...dropzone.getInputProps()} />
                  <Upload className="mx-auto h-8 w-8 text-[#6c7086] mb-2" />
                  <p className="text-sm text-[#cdd6f4] mb-1">
                    {isLoading
                      ? "Uploading..."
                      : dropzone.isDragActive
                      ? "Drop file here"
                      : "Drag & drop or click"}
                  </p>
                  <p className="text-xs text-[#6c7086]">
                    CSV or XLSX files only
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-[#45475a] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-[#a6e3a1]" />
                    <div>
                      <p className="text-sm font-medium text-[#cdd6f4] truncate max-w-[120px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#6c7086]">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileType.key)}
                    className="h-8 w-8 p-0 text-[#f38ba8] hover:bg-[#f38ba8]/10"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
