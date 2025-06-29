interface AIValidationResult {
  errors: ValidationError[];
  suggestions: DataSuggestion[];
  confidence: number;
  dataQuality: {
    overallScore: number;
    fileScores: { [key: string]: number };
    completeness: number;
    consistency: number;
    accuracy: number;
  };
  patterns: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    affectedRows: number[];
    recommendation: string;
  }>;
}

interface DataSuggestion {
  id: string;
  type: "fix" | "enhancement" | "warning" | "critical";
  field: string;
  rowIndex: number;
  originalValue: any;
  suggestedValue: any;
  reasoning: string;
  confidence: number;
  file?: string;
  priority: number; // 1-10 scale
  autoFixable: boolean;
}

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
  aiGenerated?: boolean;
  confidence?: number;
}

interface SessionData {
  [key: string]: {
    headers: string[];
    data: Record<string, any>[];
    fileName: string;
    fileType: string;
  };
}

class AIService {
  private mistralApiKey: string;
  private baseUrl = "https://api.mistral.ai/v1/chat/completions";

  constructor() {
    this.mistralApiKey = process.env.MISTRAL_API_KEY!;
    if (!this.mistralApiKey) {
      console.warn("MISTRAL_API_KEY not set - AI features will be limited");
    }
  }

  async queryMistral(prompt: string, temperature = 0.1): Promise<string> {
    if (!this.mistralApiKey) {
      throw new Error("Mistral API key not configured");
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.mistralApiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      console.error("Mistral AI Error:", error);
      throw new Error("AI service unavailable");
    }
  }

  // ✅ ENHANCED: Comprehensive AI-Enhanced Validation
  async validateDataWithAI(
    sessionData: SessionData
  ): Promise<AIValidationResult> {
    try {
      console.log("Starting comprehensive AI validation...");

      // 1. Run basic pattern analysis
      const patterns = await this.detectAdvancedPatterns(sessionData);

      // 2. Run data quality assessment
      const dataQuality = await this.calculateDataQuality(sessionData);

      // 3. Run AI-powered error detection
      const aiErrors = await this.detectAIErrors(sessionData);

      // 4. Generate intelligent suggestions
      const suggestions = await this.generateIntelligentSuggestions(
        sessionData,
        aiErrors
      );

      // 5. Calculate overall confidence
      const confidence = this.calculateValidationConfidence(
        aiErrors,
        patterns,
        dataQuality
      );

      return {
        errors: aiErrors,
        suggestions,
        confidence,
        dataQuality,
        patterns,
      };
    } catch (error) {
      console.error("AI validation failed:", error);

      // Fallback to rule-based validation
      return this.fallbackValidation(sessionData);
    }
  }

  // ✅ NEW: Advanced Pattern Detection
  private async detectAdvancedPatterns(sessionData: SessionData): Promise<
    Array<{
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
      affectedRows: number[];
      recommendation: string;
    }>
  > {
    const patterns = [];

    // Pattern 1: Inconsistent naming conventions
    patterns.push(...this.detectNamingInconsistencies(sessionData));

    // Pattern 2: Unusual data distributions
    patterns.push(...this.detectDataDistributionAnomalies(sessionData));

    // Pattern 3: Suspicious value patterns
    patterns.push(...this.detectSuspiciousValues(sessionData));

    // Pattern 4: Missing data patterns
    patterns.push(...this.detectMissingDataPatterns(sessionData));

    // Pattern 5: Cross-file relationship issues
    patterns.push(...this.detectRelationshipAnomalies(sessionData));

    return patterns;
  }

  // ✅ NEW: Data Quality Calculation
  private async calculateDataQuality(sessionData: SessionData): Promise<{
    overallScore: number;
    fileScores: { [key: string]: number };
    completeness: number;
    consistency: number;
    accuracy: number;
  }> {
    const fileScores: { [key: string]: number } = {};
    let totalCompleteness = 0;
    let totalConsistency = 0;
    let totalAccuracy = 0;
    let fileCount = 0;

    for (const [fileType, fileData] of Object.entries(sessionData)) {
      const completeness = this.calculateCompleteness(fileData);
      const consistency = this.calculateConsistency(fileData);
      const accuracy = this.calculateAccuracy(fileData, fileType);

      const fileScore = (completeness + consistency + accuracy) / 3;
      fileScores[fileType] = Math.round(fileScore * 100) / 100;

      totalCompleteness += completeness;
      totalConsistency += consistency;
      totalAccuracy += accuracy;
      fileCount++;
    }

    const avgCompleteness = totalCompleteness / fileCount;
    const avgConsistency = totalConsistency / fileCount;
    const avgAccuracy = totalAccuracy / fileCount;
    const overallScore = (avgCompleteness + avgConsistency + avgAccuracy) / 3;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      fileScores,
      completeness: Math.round(avgCompleteness * 100) / 100,
      consistency: Math.round(avgConsistency * 100) / 100,
      accuracy: Math.round(avgAccuracy * 100) / 100,
    };
  }

  // ✅ NEW: AI Error Detection
  private async detectAIErrors(
    sessionData: SessionData
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // 1. Semantic validation using AI
    if (this.mistralApiKey) {
      try {
        const aiErrors = await this.runSemanticValidation(sessionData);
        errors.push(...aiErrors);
      } catch (error) {
        console.warn("AI semantic validation failed, skipping...");
      }
    }

    // 2. Advanced rule-based validation
    errors.push(...this.runAdvancedRuleValidation(sessionData));

    // 3. Cross-reference validation
    errors.push(...this.runCrossReferenceValidation(sessionData));

    // 4. Data integrity validation
    errors.push(...this.runDataIntegrityValidation(sessionData));

    return errors;
  }

  // ✅ NEW: Semantic Validation using AI
  private async runSemanticValidation(
    sessionData: SessionData
  ): Promise<ValidationError[]> {
    const prompt = this.buildSemanticValidationPrompt(sessionData);
    const response = await this.queryMistral(prompt, 0.1);

    try {
      const result = JSON.parse(this.cleanJsonResponse(response));
      return this.parseSemanticValidationResponse(result);
    } catch (error) {
      console.error("Failed to parse semantic validation response:", error);
      return [];
    }
  }

  // ✅ NEW: Advanced Rule-based Validation
  private runAdvancedRuleValidation(
    sessionData: SessionData
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for logical inconsistencies
    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      fileData.data.forEach((row, index) => {
        // Priority vs Task complexity mismatch
        if (
          fileType === "clients" &&
          row.PriorityLevel &&
          row.RequestedTaskIDs
        ) {
          const priority = parseInt(row.PriorityLevel);
          const taskCount = row.RequestedTaskIDs.split(",").length;

          if (priority >= 4 && taskCount > 8) {
            errors.push({
              id: `AI-L1-${fileType}-${index}`,
              rule: "AI-L1",
              severity: "warning",
              message:
                "High priority client with excessive task requests may cause scheduling conflicts",
              file: fileType,
              row: index,
              column: "RequestedTaskIDs",
              value: row.RequestedTaskIDs,
              suggestion:
                "Consider breaking down task requests or adjusting priority level",
              aiGenerated: true,
              confidence: 0.8,
            });
          }
        }

        // Worker overqualification detection
        if (
          fileType === "workers" &&
          row.QualificationLevel === "Expert" &&
          row.MaxLoadPerPhase
        ) {
          const maxLoad = parseInt(row.MaxLoadPerPhase);
          if (maxLoad > 5) {
            errors.push({
              id: `AI-L2-${fileType}-${index}`,
              rule: "AI-L2",
              severity: "info",
              message:
                "Expert-level worker with high load capacity - consider optimizing task distribution",
              file: fileType,
              row: index,
              column: "MaxLoadPerPhase",
              value: maxLoad,
              suggestion:
                "Expert workers are best utilized for complex tasks rather than high volume",
              aiGenerated: true,
              confidence: 0.7,
            });
          }
        }

        // Task duration vs complexity analysis
        if (fileType === "tasks" && row.Duration && row.RequiredSkills) {
          const duration = parseFloat(row.Duration);
          const skillCount = row.RequiredSkills.split(",").length;

          if (
            (duration < 2 && skillCount > 3) ||
            (duration > 8 && skillCount < 2)
          ) {
            errors.push({
              id: `AI-L3-${fileType}-${index}`,
              rule: "AI-L3",
              severity: "warning",
              message:
                "Task duration doesn't match complexity (skill requirements)",
              file: fileType,
              row: index,
              column: "Duration",
              value: duration,
              suggestion:
                skillCount > 3
                  ? "Consider increasing duration for complex task"
                  : "Consider adding more required skills or reducing duration",
              aiGenerated: true,
              confidence: 0.75,
            });
          }
        }
      });
    });

    return errors;
  }

  // ✅ NEW: Cross-reference Validation
  private runCrossReferenceValidation(
    sessionData: SessionData
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Advanced skill-task matching
    if (sessionData.workers && sessionData.tasks) {
      const workerSkills = new Map<string, string[]>();
      sessionData.workers.data.forEach((worker, index) => {
        if (worker.Skills) {
          workerSkills.set(
            worker.WorkerID,
            worker.Skills.split(",").map((s) => s.trim())
          );
        }
      });

      sessionData.tasks.data.forEach((task, index) => {
        if (task.RequiredSkills) {
          const requiredSkills = task.RequiredSkills.split(",").map((s) =>
            s.trim()
          );
          const qualifiedWorkers = Array.from(workerSkills.entries()).filter(
            ([_, skills]) => requiredSkills.every((req) => skills.includes(req))
          );

          if (qualifiedWorkers.length === 0) {
            errors.push({
              id: `AI-CR1-tasks-${index}`,
              rule: "AI-CR1",
              severity: "error",
              message: `No workers qualified for task ${
                task.TaskID
              } - requires skills: ${requiredSkills.join(", ")}`,
              file: "tasks",
              row: index,
              column: "RequiredSkills",
              value: task.RequiredSkills,
              suggestion:
                "Add workers with required skills or modify task requirements",
              aiGenerated: true,
              confidence: 0.95,
            });
          } else if (
            qualifiedWorkers.length < parseInt(task.MaxConcurrent || "1")
          ) {
            errors.push({
              id: `AI-CR2-tasks-${index}`,
              rule: "AI-CR2",
              severity: "warning",
              message: `Insufficient qualified workers (${qualifiedWorkers.length}) for MaxConcurrent requirement (${task.MaxConcurrent})`,
              file: "tasks",
              row: index,
              column: "MaxConcurrent",
              value: task.MaxConcurrent,
              suggestion: `Reduce MaxConcurrent to ${qualifiedWorkers.length} or add more qualified workers`,
              aiGenerated: true,
              confidence: 0.9,
            });
          }
        }
      });
    }

    return errors;
  }

  // ✅ NEW: Data Integrity Validation
  private runDataIntegrityValidation(
    sessionData: SessionData
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      fileData.data.forEach((row, index) => {
        // Check for suspicious null/empty patterns
        const emptyFields = Object.entries(row).filter(
          ([_, value]) => value === null || value === undefined || value === ""
        );

        if (emptyFields.length > Object.keys(row).length * 0.3) {
          errors.push({
            id: `AI-DI1-${fileType}-${index}`,
            rule: "AI-DI1",
            severity: "warning",
            message: "Row has excessive empty fields (>30%)",
            file: fileType,
            row: index,
            suggestion:
              "Review row completeness - consider if this record is valid",
            aiGenerated: true,
            confidence: 0.8,
          });
        }

        // Check for data type inconsistencies
        if (fileType === "tasks" && row.Duration) {
          const duration = row.Duration;
          if (typeof duration === "string" && !isNaN(parseFloat(duration))) {
            // Numeric string is fine
          } else if (
            typeof duration !== "number" &&
            isNaN(parseFloat(duration))
          ) {
            errors.push({
              id: `AI-DI2-${fileType}-${index}`,
              rule: "AI-DI2",
              severity: "error",
              message: "Duration field contains non-numeric value",
              file: fileType,
              row: index,
              column: "Duration",
              value: duration,
              suggestion: "Duration must be a numeric value representing hours",
              aiGenerated: true,
              confidence: 0.95,
            });
          }
        }
      });
    });

    return errors;
  }

  // ✅ NEW: Intelligent Suggestions Generation
  private async generateIntelligentSuggestions(
    sessionData: SessionData,
    errors: ValidationError[]
  ): Promise<DataSuggestion[]> {
    const suggestions: DataSuggestion[] = [];

    // Generate suggestions based on errors
    errors.forEach((error) => {
      if (error.aiGenerated && error.row !== undefined) {
        const suggestion = this.createSuggestionFromError(error, sessionData);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    });

    // Generate proactive enhancement suggestions
    suggestions.push(...this.generateEnhancementSuggestions(sessionData));

    // Generate optimization suggestions
    suggestions.push(...this.generateOptimizationSuggestions(sessionData));

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  // ✅ Helper Methods for Pattern Detection
  private detectNamingInconsistencies(sessionData: SessionData): Array<any> {
    const patterns = [];

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      if (fileType === "workers") {
        const namePatterns = fileData.data.map((row) => ({
          hasFirstLast: /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(row.WorkerName || ""),
          hasInitials: /[A-Z]\.[A-Z]\./.test(row.WorkerName || ""),
          index: fileData.data.indexOf(row),
        }));

        const inconsistentRows = namePatterns
          .filter((p) => !p.hasFirstLast && !p.hasInitials)
          .map((p) => p.index);

        if (inconsistentRows.length > 0) {
          patterns.push({
            type: "naming_inconsistency",
            description: "Inconsistent worker name formats detected",
            severity: "low" as const,
            affectedRows: inconsistentRows,
            recommendation: "Standardize name format to 'FirstName LastName'",
          });
        }
      }
    });

    return patterns;
  }

  private detectDataDistributionAnomalies(
    sessionData: SessionData
  ): Array<any> {
    const patterns = [];

    if (sessionData.clients) {
      const priorities = sessionData.clients.data
        .map((row) => parseInt(row.PriorityLevel))
        .filter((p) => !isNaN(p));

      const priorityDistribution = priorities.reduce((acc, p) => {
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Check if there's an unusual concentration of high priority clients
      const highPriorityCount =
        (priorityDistribution[4] || 0) + (priorityDistribution[5] || 0);
      const totalClients = priorities.length;

      if (highPriorityCount / totalClients > 0.5) {
        patterns.push({
          type: "priority_distribution",
          description: "Unusually high concentration of high-priority clients",
          severity: "medium" as const,
          affectedRows: [],
          recommendation:
            "Review priority assignments - too many high-priority clients may cause scheduling conflicts",
        });
      }
    }

    return patterns;
  }

  private detectSuspiciousValues(sessionData: SessionData): Array<any> {
    const patterns = [];

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      const suspiciousRows: number[] = [];

      fileData.data.forEach((row, index) => {
        // Check for placeholder values
        const placeholderPattern =
          /^(test|dummy|placeholder|example|sample|temp|xxx|tbd|todo)$/i;

        Object.values(row).forEach((value) => {
          if (typeof value === "string" && placeholderPattern.test(value)) {
            suspiciousRows.push(index);
          }
        });
      });

      if (suspiciousRows.length > 0) {
        patterns.push({
          type: "placeholder_values",
          description: `Placeholder or test values detected in ${fileType}`,
          severity: "high" as const,
          affectedRows: suspiciousRows,
          recommendation: "Replace placeholder values with actual data",
        });
      }
    });

    return patterns;
  }

  private detectMissingDataPatterns(sessionData: SessionData): Array<any> {
    const patterns = [];

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      const fieldsWithMissingData: Record<string, number> = {};

      fileData.data.forEach((row) => {
        Object.entries(row).forEach(([field, value]) => {
          if (!value || value === "" || value === null || value === undefined) {
            fieldsWithMissingData[field] =
              (fieldsWithMissingData[field] || 0) + 1;
          }
        });
      });

      Object.entries(fieldsWithMissingData).forEach(([field, count]) => {
        const missingPercentage = count / fileData.data.length;
        if (missingPercentage > 0.2) {
          // More than 20% missing
          patterns.push({
            type: "missing_data_pattern",
            description: `Field '${field}' has ${Math.round(
              missingPercentage * 100
            )}% missing values`,
            severity:
              missingPercentage > 0.5 ? ("high" as const) : ("medium" as const),
            affectedRows: [],
            recommendation: `Review data collection for field '${field}' - high missing value rate`,
          });
        }
      });
    });

    return patterns;
  }

  private detectRelationshipAnomalies(sessionData: SessionData): Array<any> {
    const patterns = [];

    // Check for orphaned references
    if (sessionData.clients && sessionData.tasks) {
      const existingTaskIds = new Set(
        sessionData.tasks.data.map((t) => t.TaskID)
      );
      let orphanedReferences = 0;

      sessionData.clients.data.forEach((client) => {
        if (client.RequestedTaskIDs) {
          const requestedIds = client.RequestedTaskIDs.split(",").map(
            (id: string) => id.trim()
          );
          requestedIds.forEach((id) => {
            if (id && !existingTaskIds.has(id)) {
              orphanedReferences++;
            }
          });
        }
      });

      if (orphanedReferences > 0) {
        patterns.push({
          type: "orphaned_references",
          description: `${orphanedReferences} orphaned task references found`,
          severity: "high" as const,
          affectedRows: [],
          recommendation:
            "Remove or update invalid task references in client data",
        });
      }
    }

    return patterns;
  }

  // ✅ Helper Methods for Quality Calculation
  private calculateCompleteness(fileData: any): number {
    let totalCells = 0;
    let filledCells = 0;

    fileData.data.forEach((row: any) => {
      Object.values(row).forEach((value) => {
        totalCells++;
        if (value !== null && value !== undefined && value !== "") {
          filledCells++;
        }
      });
    });

    return totalCells > 0 ? filledCells / totalCells : 1;
  }

  private calculateConsistency(fileData: any): number {
    let consistencyScore = 1;

    // Check data type consistency within columns
    fileData.headers.forEach((header: string) => {
      const values = fileData.data
        .map((row: any) => row[header])
        .filter((v) => v !== null && v !== undefined && v !== "");
      if (values.length === 0) return;

      // Determine expected type from first non-empty value
      const firstValue = values[0];
      const expectedType =
        typeof firstValue === "string" && !isNaN(parseFloat(firstValue))
          ? "number"
          : typeof firstValue;

      let consistentValues = 0;
      values.forEach((value) => {
        const actualType =
          typeof value === "string" && !isNaN(parseFloat(value))
            ? "number"
            : typeof value;
        if (actualType === expectedType) {
          consistentValues++;
        }
      });

      const columnConsistency = consistentValues / values.length;
      if (columnConsistency < consistencyScore) {
        consistencyScore = columnConsistency;
      }
    });

    return consistencyScore;
  }

  private calculateAccuracy(fileData: any, fileType: string): number {
    let accuracyScore = 1;
    let totalChecks = 0;
    let passedChecks = 0;

    fileData.data.forEach((row: any) => {
      // File-type specific accuracy checks
      if (fileType === "clients" && row.PriorityLevel) {
        totalChecks++;
        const priority = parseInt(row.PriorityLevel);
        if (!isNaN(priority) && priority >= 1 && priority <= 5) {
          passedChecks++;
        }
      }

      if (fileType === "tasks" && row.Duration) {
        totalChecks++;
        const duration = parseFloat(row.Duration);
        if (!isNaN(duration) && duration > 0) {
          passedChecks++;
        }
      }

      if (fileType === "workers" && row.MaxLoadPerPhase) {
        totalChecks++;
        const maxLoad = parseInt(row.MaxLoadPerPhase);
        if (!isNaN(maxLoad) && maxLoad > 0) {
          passedChecks++;
        }
      }

      // Check for valid JSON in AttributesJSON
      if (row.AttributesJSON) {
        totalChecks++;
        try {
          JSON.parse(row.AttributesJSON);
          passedChecks++;
        } catch {
          // Invalid JSON
        }
      }
    });

    return totalChecks > 0 ? passedChecks / totalChecks : 1;
  }

  // ✅ Helper Methods
  private calculateValidationConfidence(
    errors: ValidationError[],
    patterns: any[],
    dataQuality: any
  ): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for many errors
    if (errors.length > 10) confidence -= 0.2;
    else if (errors.length > 5) confidence -= 0.1;

    // Reduce confidence for severe patterns
    const severePatterns = patterns.filter((p) => p.severity === "high").length;
    if (severePatterns > 0) confidence -= severePatterns * 0.05;

    // Adjust based on data quality
    if (dataQuality.overallScore < 0.7) confidence -= 0.1;
    else if (dataQuality.overallScore > 0.9) confidence += 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private createSuggestionFromError(
    error: ValidationError,
    sessionData: SessionData
  ): DataSuggestion | null {
    if (error.row === undefined || !error.column) return null;

    const fileData = sessionData[error.file];
    if (!fileData || !fileData.data[error.row]) return null;

    const originalValue = fileData.data[error.row][error.column];
    let suggestedValue = originalValue;
    let reasoning = error.message;
    let autoFixable = false;

    // Generate specific suggestions based on error type
    switch (error.rule) {
      case "AI-DI2": // Duration field non-numeric
        if (typeof originalValue === "string") {
          const extracted = originalValue.match(/\d+\.?\d*/);
          if (extracted) {
            suggestedValue = parseFloat(extracted[0]);
            autoFixable = true;
            reasoning = "Extracted numeric value from string";
          }
        }
        break;

      case "AI-L1": // High priority with many tasks
        if (error.column === "RequestedTaskIDs") {
          const taskIds = originalValue.split(",");
          suggestedValue = taskIds.slice(0, 5).join(","); // Limit to 5 tasks
          reasoning = "Reduced task count for high priority client";
        }
        break;
    }

    return {
      id: `suggestion-${error.id}`,
      type: error.severity === "error" ? "critical" : "fix",
      field: error.column,
      rowIndex: error.row,
      originalValue,
      suggestedValue,
      reasoning,
      confidence: error.confidence || 0.8,
      file: error.file,
      priority:
        error.severity === "error" ? 9 : error.severity === "warning" ? 6 : 3,
      autoFixable,
    };
  }

  private generateEnhancementSuggestions(
    sessionData: SessionData
  ): DataSuggestion[] {
    const suggestions: DataSuggestion[] = [];

    // Add missing fields suggestions
    if (sessionData.clients) {
      sessionData.clients.data.forEach((row, index) => {
        if (!row.AttributesJSON || row.AttributesJSON === "") {
          suggestions.push({
            id: `enhancement-clients-${index}-attributes`,
            type: "enhancement",
            field: "AttributesJSON",
            rowIndex: index,
            originalValue: "",
            suggestedValue: "{}",
            reasoning: "Add empty JSON object for future attribute storage",
            confidence: 0.9,
            file: "clients",
            priority: 4,
            autoFixable: true,
          });
        }
      });
    }

    return suggestions;
  }

  private generateOptimizationSuggestions(
    sessionData: SessionData
  ): DataSuggestion[] {
    const suggestions: DataSuggestion[] = [];

    // Suggest skill consolidation
    if (sessionData.workers) {
      const skillFrequency: Record<string, number> = {};

      sessionData.workers.data.forEach((worker) => {
        if (worker.Skills) {
          worker.Skills.split(",").forEach((skill: string) => {
            const trimmedSkill = skill.trim();
            skillFrequency[trimmedSkill] =
              (skillFrequency[trimmedSkill] || 0) + 1;
          });
        }
      });

      // Find rare skills that might be typos
      const rareSkills = Object.entries(skillFrequency)
        .filter(([_, count]) => count === 1)
        .map(([skill]) => skill);

      if (rareSkills.length > 0) {
        suggestions.push({
          id: "optimization-rare-skills",
          type: "enhancement",
          field: "Skills",
          rowIndex: -1, // Global suggestion
          originalValue: rareSkills,
          suggestedValue: "Review and consolidate",
          reasoning: `Found ${rareSkills.length} rare skills that appear only once - may be typos or could be consolidated`,
          confidence: 0.7,
          priority: 5,
          autoFixable: false,
        });
      }
    }

    return suggestions;
  }

  private fallbackValidation(sessionData: SessionData): AIValidationResult {
    return {
      errors: [],
      suggestions: [],
      confidence: 0.5,
      dataQuality: {
        overallScore: 0.7,
        fileScores: {},
        completeness: 0.8,
        consistency: 0.7,
        accuracy: 0.6,
      },
      patterns: [],
    };
  }

  private buildSemanticValidationPrompt(sessionData: SessionData): string {
    const sampleData = this.getSampleData(sessionData, 5);

    return `You are an expert data analyst specializing in workforce management and task allocation systems. Analyze this dataset for semantic and logical issues beyond basic validation.

DATASET SAMPLE:
${JSON.stringify(sampleData, null, 2)}

ANALYSIS REQUIREMENTS:
1. **Semantic Consistency**: Check if data values make sense in context
2. **Business Logic**: Validate against workforce management best practices
3. **Relationship Integrity**: Ensure cross-file relationships are logical
4. **Data Quality**: Identify incomplete, inconsistent, or suspicious patterns

SPECIFIC CHECKS:
- Are skill requirements realistic for task durations?
- Do worker qualifications match their assigned responsibilities?
- Are client priority levels consistent with their task complexity?
- Are there logical conflicts between concurrent task limits and available workforce?
- Do worker availability patterns align with business needs?

Return ONLY a JSON object with this structure:
{
  "semantic_errors": [
    {
      "type": "semantic_mismatch",
      "severity": "warning",
      "message": "Task duration too short for complexity",
      "file": "tasks",
      "row": 2,
      "column": "Duration",
      "confidence": 0.85,
      "reasoning": "3-skill task with 1-hour duration is unrealistic"
    }
  ],
  "business_logic_issues": [
    {
      "type": "business_rule_violation",
      "severity": "error", 
      "message": "Expert worker overallocated",
      "file": "workers",
      "row": 1,
      "confidence": 0.9
    }
  ],
  "quality_concerns": [
    {
      "type": "data_quality",
      "severity": "info",
      "message": "Naming convention inconsistency",
      "pattern": "mixed_case_names",
      "affected_rows": [1, 3, 5]
    }
  ]
}`;
  }

  private parseSemanticValidationResponse(result: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Parse semantic errors
    if (result.semantic_errors) {
      result.semantic_errors.forEach((error: any, index: number) => {
        errors.push({
          id: `AI-SEM-${index}`,
          rule: "AI-SEM",
          severity: error.severity || "warning",
          message: error.message,
          file: error.file,
          row: error.row,
          column: error.column,
          suggestion: error.reasoning,
          aiGenerated: true,
          confidence: error.confidence || 0.8,
        });
      });
    }

    // Parse business logic issues
    if (result.business_logic_issues) {
      result.business_logic_issues.forEach((issue: any, index: number) => {
        errors.push({
          id: `AI-BIZ-${index}`,
          rule: "AI-BIZ",
          severity: issue.severity || "warning",
          message: issue.message,
          file: issue.file,
          row: issue.row,
          column: issue.column,
          aiGenerated: true,
          confidence: issue.confidence || 0.8,
        });
      });
    }

    return errors;
  }

  private cleanJsonResponse(response: string): string {
    // Log the original response for debugging
    console.log("Original response length:", response.length);

    // Remove markdown code blocks
    let cleaned = response
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Attempt to find the first JSON structure in the response
    const jsonStart = cleaned.search(/[\{\[]/);
    if (jsonStart !== -1) {
      // Find the matching closing brace or bracket
      const jsonSubstring = cleaned.substring(jsonStart);
      const stack: string[] = [];
      let endIndex = -1;

      for (let i = 0; i < jsonSubstring.length; i++) {
        const char = jsonSubstring[i];
        if (char === "{" || char === "[") {
          stack.push(char);
        } else if (char === "}" && stack[stack.length - 1] === "{") {
          stack.pop();
          if (stack.length === 0) {
            endIndex = i;
            break;
          }
        } else if (char === "]" && stack[stack.length - 1] === "[") {
          stack.pop();
          if (stack.length === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex !== -1) {
        cleaned = jsonSubstring.substring(0, endIndex + 1);
      }
    }

    // Final cleanup - ensure the cleaned response is valid JSON
    if (cleaned.startsWith("[") || cleaned.startsWith("{")) {
      try {
        // Attempt to parse the cleaned JSON to ensure it's valid
        JSON.parse(cleaned);
        return cleaned;
      } catch (e) {
        console.error("Failed to parse cleaned JSON:", e);
      }
    }

    // If parsing fails, return an empty JSON object or array as a fallback
    return cleaned.startsWith("[") ? "[]" : "{}";
  }

  private getSampleData(sessionData: SessionData, maxRows: number = 5): any {
    const sampleData: any = {};

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      sampleData[fileType] = {
        headers: fileData.headers,
        data: fileData.data.slice(0, maxRows),
        total_rows: fileData.data.length,
      };
    });

    return sampleData;
  }

  // ✅ Keep existing methods with enhancements
  async processNaturalLanguageQuery(
    query: string,
    sessionData: SessionData
  ): Promise<{
    targetTable: string;
    results: any[];
    explanation: string;
  }> {
    try {
      const prompt = this.buildSearchPrompt(query, sessionData);
      const response = await this.queryMistral(prompt, 0.2);
      const filterConfig = this.parseSearchResponse(response);

      const results = this.executeGeneratedFilter(filterConfig, sessionData);

      return {
        targetTable: filterConfig.targetTable,
        results,
        explanation: filterConfig.explanation,
      };
    } catch (error) {
      console.error("NL Query processing failed:", error);
      throw error;
    }
  }

  async generateDataCorrections(
    sessionData: SessionData,
    validationErrors: ValidationError[]
  ): Promise<DataSuggestion[]> {
    try {
      console.log(
        "Generating data corrections for",
        validationErrors.length,
        "errors"
      );

      // Limit the number of errors to prevent prompt overload
      const limitedErrors = validationErrors.slice(0, 10);

      const prompt = this.buildCorrectionPrompt(sessionData, limitedErrors);
      console.log("Correction prompt length:", prompt.length);

      const response = await this.queryMistral(prompt, 0.1);
      console.log("Received response length:", response?.length || 0);

      if (!response) {
        console.warn("No response from Mistral API");
        return [];
      }

      const suggestions = this.parseCorrectionSuggestions(response);
      console.log(
        "Successfully parsed",
        suggestions.length,
        "correction suggestions"
      );

      return suggestions;
    } catch (error) {
      console.error("Data correction generation failed:", error);

      // Return fallback suggestions based on validation errors
      return this.generateFallbackCorrections(validationErrors);
    }
  }

  private generateFallbackCorrections(
    validationErrors: ValidationError[]
  ): DataSuggestion[] {
    console.log(
      "Generating fallback corrections for",
      validationErrors.length,
      "errors"
    );

    return validationErrors
      .filter((error) => error.row !== undefined && error.column)
      .slice(0, 5) // Limit fallback corrections
      .map((error, index) => ({
        id: `fallback-${index}`,
        type: "fix" as const,
        field: error.column!,
        rowIndex: error.row!,
        originalValue: error.value,
        suggestedValue: this.generateFallbackValue(error),
        reasoning: `Fallback correction for: ${error.message}`,
        confidence: 0.6,
        file: error.file,
        priority: error.severity === "error" ? 8 : 5,
        autoFixable: false,
      }));
  }

  private generateFallbackValue(error: ValidationError): any {
    // Generate simple fallback values based on error context
    if (error.column?.toLowerCase().includes("json")) {
      return "{}";
    }
    if (
      error.column?.toLowerCase().includes("array") ||
      error.column?.toLowerCase().includes("slots")
    ) {
      return "[]";
    }
    if (error.column === "Duration" && error.file === "tasks") {
      return 1;
    }
    if (error.column === "PriorityLevel" && error.file === "clients") {
      return 3;
    }

    return error.value || "";
  }

  private buildCorrectionPrompt(
    sessionData: SessionData,
    validationErrors: ValidationError[]
  ): string {
    const sampleData = this.getSampleData(sessionData, 3); // Reduce sample size

    return `You are a data correction specialist. Generate specific JSON corrections for this dataset.

DATASET SAMPLE:
${JSON.stringify(sampleData, null, 1)}

VALIDATION ERRORS (Top 5):
${JSON.stringify(validationErrors.slice(0, 5), null, 1)}

TASK: Generate corrections for the most critical issues.

RULES:
1. Return ONLY a valid JSON array
2. No explanatory text before or after
3. Focus on auto-fixable issues
4. Maximum 10 corrections

REQUIRED JSON FORMAT:
[
  {
    "id": "fix-1",
    "type": "fix",
    "field": "AttributesJSON",
    "rowIndex": 0,
    "file": "clients",
    "originalValue": "invalid json",
    "suggestedValue": "{}",
    "reasoning": "Convert invalid JSON to empty object",
    "confidence": 0.95,
    "priority": 8,
    "autoFixable": true
  }
]

Generate corrections now:`;
  }

  private parseCorrectionSuggestions(response: string): DataSuggestion[] {
    try {
      // Log the raw response for debugging
      console.log("Raw response type:", typeof response);
      console.log("Raw response preview:", response.substring(0, 200) + "...");

      // Check if response is empty or null
      if (!response || response.trim().length === 0) {
        console.warn("Empty response received");
        return [];
      }

      // Clean the response to ensure valid JSON
      const cleaned = this.cleanJsonResponse(response);
      console.log(
        "Cleaned response preview:",
        cleaned.substring(0, 200) + "..."
      );

      // Check if cleaned response is valid before parsing
      if (!cleaned || cleaned.trim().length === 0) {
        console.warn("Cleaned response is empty");
        return [];
      }

      // Validate JSON structure before parsing
      if (!cleaned.startsWith("[") && !cleaned.startsWith("{")) {
        console.warn(
          "Cleaned response doesn't start with [ or {:",
          cleaned.substring(0, 50)
        );
        return [];
      }

      // Parse the cleaned JSON
      const parsed = JSON.parse(cleaned);

      // Handle both array and object responses
      let corrections = [];
      if (Array.isArray(parsed)) {
        corrections = parsed;
      } else if (parsed.corrections && Array.isArray(parsed.corrections)) {
        corrections = parsed.corrections;
      } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        corrections = parsed.suggestions;
      } else {
        console.warn("Unexpected response structure:", typeof parsed);
        return [];
      }

      // Map and validate each correction
      return corrections
        .filter((item: any) => item && typeof item === "object")
        .map((item: any, index: number) => ({
          id: item.id || `correction-${Date.now()}-${index}`,
          type: item.type || "fix",
          field: item.field || "unknown",
          rowIndex: typeof item.rowIndex === "number" ? item.rowIndex : -1,
          originalValue: item.originalValue,
          suggestedValue: item.suggestedValue,
          reasoning: item.reasoning || "AI suggested correction",
          confidence:
            typeof item.confidence === "number" ? item.confidence : 0.8,
          file: item.file,
          priority: typeof item.priority === "number" ? item.priority : 5,
          autoFixable: Boolean(item.autoFixable),
        }));
    } catch (error) {
      console.error("Failed to parse correction suggestions:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack:
          error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      });
      console.error("Response that caused error:", response.substring(0, 1000));

      // Try alternative parsing approaches
      try {
        // Attempt to extract JSON from a malformed response
        const jsonMatch = response.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
          const extractedJson = JSON.parse(jsonMatch[1]);
          console.log("Successfully parsed with regex extraction");
          return Array.isArray(extractedJson)
            ? extractedJson.map((item: any, index: number) => ({
                id: `fallback-${index}`,
                type: "fix",
                field: item.field || "unknown",
                rowIndex: -1,
                originalValue: item.originalValue,
                suggestedValue: item.suggestedValue,
                reasoning: item.reasoning || "Fallback correction",
                confidence: 0.6,
                file: item.file,
                priority: 5,
                autoFixable: false,
              }))
            : [];
        }
      } catch (fallbackError) {
        console.error("Fallback parsing also failed:", fallbackError);
      }
    }

    // Return an empty array if all parsing attempts fail
    return [];
  }
}

export const aiService = new AIService();
