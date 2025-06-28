import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  getSession,
  setSession,
  updateSessionFile,
  hasSession,
} from "@/lib/session-store-redis";

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

interface ValidationResult {
  errors: ValidationError[];
  errorsByFile: { [file: string]: ValidationError[] };
  errorCounts: { [file: string]: number };
  isValid: boolean;
}

interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

// Required columns for each file type
const REQUIRED_COLUMNS = {
  clients: [
    "ClientID",
    "ClientName",
    "PriorityLevel",
    "RequestedTaskIDs",
    "GroupTag",
    "AttributesJSON",
  ],
  workers: [
    "WorkerID",
    "WorkerName",
    "Skills",
    "AvailableSlots",
    "MaxLoadPerPhase",
    "WorkerGroup",
    "QualificationLevel",
  ],
  tasks: [
    "TaskID",
    "TaskName",
    "Category",
    "Duration",
    "RequiredSkills",
    "PreferredPhases",
    "MaxConcurrent",
  ],
};

// Validation Engine Class
class ValidationEngine {
  private errors: ValidationError[] = [];
  private sessionData: SessionData;

  constructor(sessionData: SessionData) {
    this.sessionData = sessionData;
    this.errors = [];
  }

  public validate(): ValidationResult {
    this.errors = [];

    // Run all validation rules
    this.validateRequiredColumns(); // V1
    this.validateDuplicateIds(); // V2
    this.validateMalformedLists(); // V3
    this.validateOutOfRangeValues(); // V4
    this.validateBrokenJSON(); // V5
    this.validateUnknownReferences(); // V6
    this.validateOverloadedWorkers(); // V9
    this.validateSkillCoverage(); // V11
    this.validateMaxConcurrencyFeasibility(); // V12

    // Group errors by file
    const errorsByFile: { [file: string]: ValidationError[] } = {};
    const errorCounts: { [file: string]: number } = {};

    ["clients", "workers", "tasks"].forEach((file) => {
      errorsByFile[file] = this.errors.filter((error) => error.file === file);
      errorCounts[file] = errorsByFile[file].length;
    });

    return {
      errors: this.errors,
      errorsByFile,
      errorCounts,
      isValid: this.errors.length === 0,
    };
  }

  // V1: Missing required columns
  private validateRequiredColumns() {
    Object.entries(REQUIRED_COLUMNS).forEach(([fileType, requiredCols]) => {
      const fileData = this.sessionData[fileType];
      if (!fileData) return;

      const missingColumns = requiredCols.filter(
        (col) => !fileData.headers.includes(col)
      );

      missingColumns.forEach((col) => {
        this.addError({
          id: `V1-${fileType}-${col}`,
          rule: "V1",
          severity: "error",
          message: `Missing required column: ${col}`,
          file: fileType,
          suggestion: `Add column '${col}' to your ${fileType}.csv file`,
        });
      });
    });
  }

  // V2: Duplicate IDs
  private validateDuplicateIds() {
    const idColumns = {
      clients: "ClientID",
      workers: "WorkerID",
      tasks: "TaskID",
    };

    Object.entries(idColumns).forEach(([fileType, idColumn]) => {
      const fileData = this.sessionData[fileType];
      if (!fileData || !fileData.headers.includes(idColumn)) return;

      const ids = new Set();
      const duplicates = new Set();

      fileData.data.forEach((row, index) => {
        const id = row[idColumn];
        if (id && ids.has(id)) {
          duplicates.add(id);
        }
        ids.add(id);
      });

      duplicates.forEach((duplicateId) => {
        fileData.data.forEach((row, index) => {
          if (row[idColumn] === duplicateId) {
            this.addError({
              id: `V2-${fileType}-${index}-${idColumn}`,
              rule: "V2",
              severity: "error",
              message: `Duplicate ID found: ${duplicateId}`,
              file: fileType,
              row: index,
              column: idColumn,
              value: duplicateId,
              suggestion: `Make sure each ${idColumn} is unique`,
            });
          }
        });
      });
    });
  }

  // V3: Malformed lists
  private validateMalformedLists() {
    const listColumns = {
      workers: ["AvailableSlots"],
      tasks: ["PreferredPhases"],
    };

    Object.entries(listColumns).forEach(([fileType, columns]) => {
      const fileData = this.sessionData[fileType];
      if (!fileData) return;

      columns.forEach((column) => {
        if (!fileData.headers.includes(column)) return;

        fileData.data.forEach((row, index) => {
          const value = row[column];
          if (!value) return;

          try {
            // Try to parse as JSON array
            if (typeof value === "string") {
              const parsed = JSON.parse(value);
              if (!Array.isArray(parsed)) {
                throw new Error("Not an array");
              }
              // Validate array elements are numbers for these columns
              if (
                !parsed.every(
                  (item) => typeof item === "number" && !isNaN(item)
                )
              ) {
                throw new Error("Array contains non-numeric values");
              }
            }
          } catch (error) {
            this.addError({
              id: `V3-${fileType}-${index}-${column}`,
              rule: "V3",
              severity: "error",
              message: `Malformed list in ${column}: ${value}`,
              file: fileType,
              row: index,
              column: column,
              value: value,
              suggestion: `Format as JSON array: [1, 2, 3]`,
            });
          }
        });
      });
    });
  }

  // V4: Out-of-range values
  private validateOutOfRangeValues() {
    // Priority Level validation (1-5)
    const clientsData = this.sessionData.clients;
    if (clientsData && clientsData.headers.includes("PriorityLevel")) {
      clientsData.data.forEach((row, index) => {
        const priority = parseInt(row.PriorityLevel);
        if (isNaN(priority) || priority < 1 || priority > 5) {
          this.addError({
            id: `V4-clients-${index}-PriorityLevel`,
            rule: "V4",
            severity: "error",
            message: `PriorityLevel must be between 1-5, got: ${row.PriorityLevel}`,
            file: "clients",
            row: index,
            column: "PriorityLevel",
            value: row.PriorityLevel,
            suggestion: "Set PriorityLevel to a number between 1 and 5",
          });
        }
      });
    }

    // Duration validation (≥ 1)
    const tasksData = this.sessionData.tasks;
    if (tasksData && tasksData.headers.includes("Duration")) {
      tasksData.data.forEach((row, index) => {
        const duration = parseFloat(row.Duration);
        if (isNaN(duration) || duration < 1) {
          this.addError({
            id: `V4-tasks-${index}-Duration`,
            rule: "V4",
            severity: "error",
            message: `Duration must be ≥ 1, got: ${row.Duration}`,
            file: "tasks",
            row: index,
            column: "Duration",
            value: row.Duration,
            suggestion: "Set Duration to a number greater than or equal to 1",
          });
        }
      });
    }
  }

  // V5: Broken JSON
  private validateBrokenJSON() {
    const clientsData = this.sessionData.clients;
    if (clientsData && clientsData.headers.includes("AttributesJSON")) {
      clientsData.data.forEach((row, index) => {
        const jsonValue = row.AttributesJSON;
        if (!jsonValue) return;

        try {
          JSON.parse(jsonValue);
        } catch (error) {
          this.addError({
            id: `V5-clients-${index}-AttributesJSON`,
            rule: "V5",
            severity: "error",
            message: `Invalid JSON in AttributesJSON`,
            file: "clients",
            row: index,
            column: "AttributesJSON",
            value: jsonValue,
            suggestion: "Fix JSON syntax or use {} for empty object",
          });
        }
      });
    }
  }

  // V6: Unknown references
  private validateUnknownReferences() {
    const clientsData = this.sessionData.clients;
    const tasksData = this.sessionData.tasks;

    if (!clientsData || !tasksData) return;

    // Get all available TaskIDs
    const availableTaskIds = new Set(
      tasksData.data.map((row) => row.TaskID).filter((id) => id)
    );

    if (clientsData.headers.includes("RequestedTaskIDs")) {
      clientsData.data.forEach((row, index) => {
        const requestedIds = row.RequestedTaskIDs;
        if (!requestedIds) return;

        // Parse comma-separated TaskIDs
        const taskIds = requestedIds
          .split(",")
          .map((id: string) => id.trim())
          .filter((id: string) => id);

        taskIds.forEach((taskId: string) => {
          if (!availableTaskIds.has(taskId)) {
            this.addError({
              id: `V6-clients-${index}-${taskId}`,
              rule: "V6",
              severity: "error",
              message: `Unknown TaskID reference: ${taskId}`,
              file: "clients",
              row: index,
              column: "RequestedTaskIDs",
              value: taskId,
              suggestion: `Make sure TaskID '${taskId}' exists in tasks.csv`,
            });
          }
        });
      });
    }
  }

  // V9: Overloaded workers
  private validateOverloadedWorkers() {
    const workersData = this.sessionData.workers;
    if (!workersData) return;

    workersData.data.forEach((row, index) => {
      const availableSlots = row.AvailableSlots;
      const maxLoad = parseInt(row.MaxLoadPerPhase);

      if (!availableSlots || isNaN(maxLoad)) return;

      try {
        const slots =
          typeof availableSlots === "string"
            ? JSON.parse(availableSlots)
            : availableSlots;
        if (Array.isArray(slots) && slots.length < maxLoad) {
          this.addError({
            id: `V9-workers-${index}-overload`,
            rule: "V9",
            severity: "warning",
            message: `Worker has MaxLoadPerPhase (${maxLoad}) > AvailableSlots count (${slots.length})`,
            file: "workers",
            row: index,
            column: "MaxLoadPerPhase",
            value: maxLoad,
            suggestion: `Reduce MaxLoadPerPhase to ${slots.length} or add more available slots`,
          });
        }
      } catch (error) {
        // Handled in V3 validation
      }
    });
  }

  // V11: Skill coverage matrix
  private validateSkillCoverage() {
    const workersData = this.sessionData.workers;
    const tasksData = this.sessionData.tasks;

    if (!workersData || !tasksData) return;

    // Get all worker skills
    const allWorkerSkills = new Set<string>();
    workersData.data.forEach((row) => {
      if (row.Skills) {
        const skills = row.Skills.split(",").map((skill: string) =>
          skill.trim()
        );
        skills.forEach((skill) => allWorkerSkills.add(skill));
      }
    });

    // Check each task's required skills
    tasksData.data.forEach((row, index) => {
      if (!row.RequiredSkills) return;

      const requiredSkills = row.RequiredSkills.split(",").map(
        (skill: string) => skill.trim()
      );

      requiredSkills.forEach((skill) => {
        if (!allWorkerSkills.has(skill)) {
          this.addError({
            id: `V11-tasks-${index}-${skill}`,
            rule: "V11",
            severity: "error",
            message: `No worker has required skill: ${skill}`,
            file: "tasks",
            row: index,
            column: "RequiredSkills",
            value: skill,
            suggestion: `Add a worker with skill '${skill}' or remove this skill requirement`,
          });
        }
      });
    });
  }

  // V12: Max concurrency feasibility
  private validateMaxConcurrencyFeasibility() {
    const workersData = this.sessionData.workers;
    const tasksData = this.sessionData.tasks;

    if (!workersData || !tasksData) return;

    tasksData.data.forEach((task, index) => {
      const maxConcurrent = parseInt(task.MaxConcurrent);
      if (isNaN(maxConcurrent)) return;

      const requiredSkills = task.RequiredSkills
        ? task.RequiredSkills.split(",").map((skill: string) => skill.trim())
        : [];

      // Count workers who have ALL required skills
      let qualifiedWorkerCount = 0;
      workersData.data.forEach((worker) => {
        if (!worker.Skills) return;

        const workerSkills = worker.Skills.split(",").map((skill: string) =>
          skill.trim()
        );
        const hasAllSkills = requiredSkills.every((skill) =>
          workerSkills.includes(skill)
        );

        if (hasAllSkills) {
          qualifiedWorkerCount++;
        }
      });

      if (maxConcurrent > qualifiedWorkerCount) {
        this.addError({
          id: `V12-tasks-${index}-concurrency`,
          rule: "V12",
          severity: "warning",
          message: `MaxConcurrent (${maxConcurrent}) exceeds qualified workers (${qualifiedWorkerCount})`,
          file: "tasks",
          row: index,
          column: "MaxConcurrent",
          value: maxConcurrent,
          suggestion: `Reduce MaxConcurrent to ${qualifiedWorkerCount} or add more qualified workers`,
        });
      }
    });
  }

  private addError(error: ValidationError) {
    this.errors.push(error);
  }
}

function validateSessionData(sessionData: SessionData): ValidationResult {
  const engine = new ValidationEngine(sessionData);
  return engine.validate();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string;
    const sessionId = formData.get("sessionId") as string;

    if (!file || !fileType || !sessionId) {
      return NextResponse.json(
        { error: "File, fileType, and sessionId are required" },
        { status: 400 }
      );
    }

    // Parse file based on extension
    const buffer = await file.arrayBuffer();
    let parsedData: ParsedFileData;

    if (file.name.endsWith(".csv")) {
      parsedData = await parseCSV(buffer, file.name);
    } else if (file.name.endsWith(".xlsx")) {
      parsedData = await parseXLSX(buffer, file.name);
    } else {
      return NextResponse.json(
        { error: "Unsupported file format" },
        { status: 400 }
      );
    }

    // Store in session using shared store
    const sessionData = await updateSessionFile(
      sessionId,
      fileType,
      parsedData
    );

    // Run validation
    const validationResult = validateSessionData(sessionData);

    return NextResponse.json({
      success: true,
      data: parsedData,
      sessionData: sessionData,
      validation: validationResult,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}

async function parseCSV(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedFileData> {
  const text = new TextDecoder().decode(buffer);

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          data: results.data as Record<string, any>[],
          fileName,
          fileType: "csv",
        });
      },
      error: (error) => reject(error),
    });
  });
}

async function parseXLSX(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedFileData> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = jsonData[0] as string[];
  const data = jsonData.slice(1).map((row: any[]) => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });

  return {
    headers,
    data,
    fileName,
    fileType: "xlsx",
  };
}

// Get session data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "SessionId required" }, { status: 400 });
  }

  const sessionData = await getSession(sessionId);
  return NextResponse.json({ sessionData });
}
