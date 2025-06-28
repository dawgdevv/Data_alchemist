import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  updateSessionFile,
  debugSession,
  setSession,
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

// Validation Engine (same as in upload route)
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
    this.validateRequiredColumns();
    this.validateDuplicateIds();
    this.validateMalformedLists();
    this.validateOutOfRangeValues();
    this.validateBrokenJSON();
    this.validateUnknownReferences();
    this.validateOverloadedWorkers();
    this.validateSkillCoverage();
    this.validateMaxConcurrencyFeasibility();

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

  // Copy all validation methods from upload route...
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
            if (typeof value === "string") {
              const parsed = JSON.parse(value);
              if (!Array.isArray(parsed)) {
                throw new Error("Not an array");
              }
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

  private validateOutOfRangeValues() {
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

  private validateUnknownReferences() {
    const clientsData = this.sessionData.clients;
    const tasksData = this.sessionData.tasks;

    if (!clientsData || !tasksData) return;

    const availableTaskIds = new Set(
      tasksData.data.map((row) => row.TaskID).filter((id) => id)
    );

    if (clientsData.headers.includes("RequestedTaskIDs")) {
      clientsData.data.forEach((row, index) => {
        const requestedIds = row.RequestedTaskIDs;
        if (!requestedIds) return;

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

  private validateSkillCoverage() {
    const workersData = this.sessionData.workers;
    const tasksData = this.sessionData.tasks;

    if (!workersData || !tasksData) return;

    const allWorkerSkills = new Set<string>();
    workersData.data.forEach((row) => {
      if (row.Skills) {
        const skills = row.Skills.split(",").map((skill: string) =>
          skill.trim()
        );
        skills.forEach((skill) => allWorkerSkills.add(skill));
      }
    });

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

export async function POST(request: NextRequest) {
  try {
    const { sessionId, fileType, data, allSessionData } = await request.json();

    if (!sessionId || !fileType || !data) {
      return NextResponse.json(
        { error: "SessionId, fileType, and data are required" },
        { status: 400 }
      );
    }

    console.log(`=== UPDATE SESSION START ===`);
    console.log(`Session: ${sessionId}, File: ${fileType}`);

    // Debug: Check session state before update
    await debugSession(sessionId);

    // Get current session state before update
    const beforeUpdate = await getSession(sessionId);
    console.log(
      `Before update - Backend session files:`,
      Object.keys(beforeUpdate)
    );

    // If frontend sent allSessionData as backup, use it to restore missing files
    if (
      allSessionData &&
      Object.keys(beforeUpdate).length < Object.keys(allSessionData).length
    ) {
      console.log(
        `Frontend has more files than backend, restoring from frontend data`
      );
      console.log(`Frontend files:`, Object.keys(allSessionData));
      console.log(`Backend files:`, Object.keys(beforeUpdate));

      // Restore missing files from frontend
      const missingFiles = Object.keys(allSessionData).filter(
        (file) => !beforeUpdate[file] && file !== fileType
      );

      if (missingFiles.length > 0) {
        console.log(`Restoring missing files:`, missingFiles);
        // Set the complete session data
        await setSession(sessionId, allSessionData);
      }
    }

    // Now update the specific file
    const sessionData = await updateSessionFile(sessionId, fileType, data);

    // Debug: Check session state after update
    console.log(
      `After update - Backend session files:`,
      Object.keys(sessionData)
    );
    await debugSession(sessionId);

    // Final verification - ensure we have all expected files
    const expectedFiles = ["clients", "workers", "tasks"];
    const presentFiles = Object.keys(sessionData);
    const missingFiles = expectedFiles.filter((file) => !sessionData[file]);

    if (missingFiles.length > 0 && allSessionData) {
      console.warn(
        `Some expected files missing, attempting recovery:`,
        missingFiles
      );
      // Try to recover from allSessionData
      const recoveredData = { ...sessionData };
      missingFiles.forEach((file) => {
        if (allSessionData[file]) {
          recoveredData[file] = allSessionData[file];
          console.log(`Recovered file: ${file}`);
        }
      });

      if (Object.keys(recoveredData).length > Object.keys(sessionData).length) {
        setSession(sessionId, recoveredData);
        console.log(
          `Recovery successful, final files:`,
          Object.keys(recoveredData)
        );
      }
    }

    // Get final session data
    const finalSessionData = await getSession(sessionId);
    console.log(`Final session data files:`, Object.keys(finalSessionData));

    // Run validation on updated data
    const validationEngine = new ValidationEngine(finalSessionData);
    const validationResult = validationEngine.validate();

    console.log(`=== UPDATE SESSION END ===`);

    return NextResponse.json({
      success: true,
      sessionData: finalSessionData,
      validation: validationResult,
      debug: {
        updatedFile: fileType,
        totalFiles: Object.keys(finalSessionData).length,
        files: Object.keys(finalSessionData),
        beforeUpdateFiles: Object.keys(beforeUpdate),
        afterUpdateFiles: Object.keys(finalSessionData),
        hadFrontendBackup: !!allSessionData,
      },
    });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      {
        error: "Failed to update session data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
