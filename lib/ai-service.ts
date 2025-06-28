interface AIValidationResult {
  errors: ValidationError[];
  suggestions: DataSuggestion[];
  confidence: number;
}

interface DataSuggestion {
  id: string;
  type: "fix" | "enhancement" | "warning";
  field: string;
  rowIndex: number;
  originalValue: any;
  suggestedValue: any;
  reasoning: string;
  confidence: number;
  file?: string; // ✅ ADD: Optional file field to specify target file
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
      console.warn("MISTRAL_API_KEY not found. AI features will be disabled.");
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
        throw new Error(`Mistral API error: ${response.status}`);
      }

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      console.error("Mistral AI Error:", error);
      throw new Error("AI service unavailable");
    }
  }

  // AI-Enhanced Validation
  async validateDataWithAI(
    sessionData: SessionData
  ): Promise<AIValidationResult> {
    try {
      // Check if we have valid session data
      if (!sessionData || Object.keys(sessionData).length === 0) {
        console.warn("No session data provided for AI validation");
        return { errors: [], suggestions: [], confidence: 0 };
      }

      const prompt = this.buildValidationPrompt(sessionData);
      const response = await this.queryMistral(prompt, 0.3);
      return this.parseValidationResponse(response);
    } catch (error) {
      console.error("AI validation failed:", error);
      return {
        errors: [],
        suggestions: [],
        confidence: 0,
      };
    }
  }

  // Natural Language Search
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
      const response = await this.queryMistral(prompt, 0.3);
      const filterConfig = this.parseSearchResponse(response);

      const results = this.executeGeneratedFilter(filterConfig, sessionData);

      return {
        targetTable: filterConfig.targetTable,
        results,
        explanation: filterConfig.explanation,
      };
    } catch (error) {
      console.error("Natural language search failed:", error);
      return {
        targetTable: "tasks",
        results: [],
        explanation: "Search failed. Please try a different query.",
      };
    }
  }

  // Data Correction Suggestions
  async generateDataCorrections(
    sessionData: SessionData,
    validationErrors: ValidationError[]
  ): Promise<DataSuggestion[]> {
    try {
      // Check if we have data to work with
      if (!sessionData || Object.keys(sessionData).length === 0) {
        console.warn("No session data provided for corrections");
        return [];
      }

      const prompt = this.buildCorrectionPrompt(sessionData, validationErrors);
      const response = await this.queryMistral(prompt, 0.3);
      return this.parseCorrectionSuggestions(response);
    } catch (error) {
      console.error("Data correction generation failed:", error);
      return [];
    }
  }

  // ✅ ADD MISSING METHOD: getSampleData
  private getSampleData(sessionData: SessionData, maxRows: number = 3): any {
    const sampleData: any = {};

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      if (fileData && fileData.data && Array.isArray(fileData.data)) {
        sampleData[fileType] = {
          headers: fileData.headers || [],
          data: fileData.data.slice(0, maxRows),
          totalRows: fileData.data.length,
        };
      }
    });

    return sampleData;
  }

  // ✅ ADD MISSING METHOD: executeGeneratedFilter
  private executeGeneratedFilter(
    filterConfig: {
      targetTable: string;
      filterFunction: string;
      explanation: string;
    },
    sessionData: SessionData
  ): any[] {
    try {
      const { targetTable, filterFunction } = filterConfig;

      if (!sessionData[targetTable] || !sessionData[targetTable].data) {
        console.warn(`Target table ${targetTable} not found in session data`);
        return [];
      }

      const data = sessionData[targetTable].data;

      // Create a safer evaluation context
      const saferEval = (code: string, data: any[]) => {
        try {
          // Create the filter function in a controlled way
          const filterFunc = new Function(
            "row",
            `return ${code.replace("row => ", "")}`
          );
          return data.filter(filterFunc);
        } catch (error) {
          console.error("Filter execution error:", error);
          return [];
        }
      };

      const results = saferEval(filterFunction, data);
      console.log(
        `Filter executed successfully, found ${results.length} results`
      );

      return results;
    } catch (error) {
      console.error("Failed to execute generated filter:", error);
      return [];
    }
  }

  private buildValidationPrompt(sessionData: SessionData): string {
    const sampleData = this.getSampleData(sessionData, 3);

    return `You are a data validation expert. Analyze this dataset for potential issues.

DATASET SAMPLE:
${JSON.stringify(sampleData, null, 2)}

Look for these specific issues:
1. Malformed JSON in AttributesJSON fields (should be valid JSON objects)
2. Invalid array formats in AvailableSlots (should be [1,2,3] format)
3. Out of range values (PriorityLevel should be 1-5, Duration should be ≥1)
4. Missing skills coverage (RequiredSkills not covered by any worker)
5. Data consistency issues

Return ONLY valid JSON in this EXACT format:
{
  "errors": [
    {
      "type": "warning",
      "message": "Malformed JSON in AttributesJSON field",
      "file": "clients",
      "row": 1,
      "confidence": 0.9
    }
  ],
  "suggestions": [
    {
      "field": "AttributesJSON",
      "issue": "Invalid JSON format",
      "suggestion": "Convert to valid JSON object"
    }
  ]
}`;
  }

  private buildCorrectionPrompt(
    sessionData: SessionData,
    validationErrors: ValidationError[]
  ): string {
    const sampleData = this.getSampleData(sessionData, 5);

    return `Generate specific data corrections based on this dataset and validation errors.

DATASET SAMPLE:
${JSON.stringify(sampleData, null, 2)}

VALIDATION ERRORS:
${JSON.stringify(validationErrors.slice(0, 5), null, 2)}

Look for these specific issues in the data:
1. Invalid JSON in AttributesJSON fields (should be valid JSON objects)
2. Malformed arrays in AvailableSlots (should be [1,2,3] format)
3. Out of range values (PriorityLevel should be 1-5, Duration should be ≥1)
4. Invalid references (TaskIDs that don't exist)

Return ONLY a JSON array with specific corrections (no explanatory text):
[
  {
    "id": "fix-1",
    "type": "fix",
    "field": "AttributesJSON",
    "rowIndex": 1,
    "file": "clients",
    "originalValue": "ensure deliverables align with project scope",
    "suggestedValue": "{}",
    "reasoning": "Convert non-JSON text to empty JSON object",
    "confidence": 0.95
  }
]`;
  }

  private buildSearchPrompt(query: string, sessionData: SessionData): string {
    const sampleData = this.getSampleData(sessionData, 2);

    return `Convert this natural language query to a precise JavaScript filter function.

QUERY: "${query}"

AVAILABLE DATA SAMPLE:
${JSON.stringify(sampleData, null, 2)}

Return ONLY a JSON object with this exact structure (no explanatory text):
{
  "targetTable": "tasks",
  "filterFunction": "parseFloat(row.Duration) > 2 && (row.PreferredPhases.includes('2') || row.PreferredPhases.includes('[2'))",
  "explanation": "Tasks with duration > 2 hours that prefer phase 2"
}

Field mapping examples:
- Duration: parseFloat(row.Duration) 
- PriorityLevel: parseInt(row.PriorityLevel)
- PreferredPhases: row.PreferredPhases (string containing phase numbers)
- RequiredSkills: row.RequiredSkills (comma-separated string)
- Skills: row.Skills (comma-separated string)

Query patterns:
- "tasks duration > 2" → { "targetTable": "tasks", "filterFunction": "parseFloat(row.Duration) > 2" }
- "workers with python" → { "targetTable": "workers", "filterFunction": "row.Skills.toLowerCase().includes('python')" }
- "clients priority 1" → { "targetTable": "clients", "filterFunction": "parseInt(row.PriorityLevel) === 1" }
- "phase 2" → { "targetTable": "tasks", "filterFunction": "row.PreferredPhases.includes('2')" }

If the query is ambiguous or doesn't match the data, return an empty filterFunction and an explanation.
Be precise with filter conditions. Do not invent fields. The targetTable must be one of: "clients", "workers", "tasks".`;
  }

  // ✅ FIXED: parseValidationResponse method
  private parseValidationResponse(response: string): AIValidationResult {
    try {
      if (!response || typeof response !== "string") {
        console.warn("Invalid validation response provided");
        return { errors: [], suggestions: [], confidence: 0 };
      }

      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);

      // Handle the validation response structure
      const errors = (parsed.errors || []).map((error: any, index: number) => ({
        id: `ai-${index}`,
        rule: "AI",
        severity: error.type === "error" ? "error" : "warning",
        message: error.message || "AI-detected issue",
        file: error.file || "unknown",
        row: error.row || 0,
        confidence: error.confidence || 0.8,
      }));

      const suggestions = (parsed.suggestions || []).map(
        (suggestion: any, index: number) => ({
          id: `suggestion-${index}`,
          field: suggestion.field || "unknown",
          issue: suggestion.issue || "AI-detected issue",
          suggestion: suggestion.suggestion || "Review manually",
        })
      );

      return {
        errors,
        suggestions,
        confidence: 0.8,
      };
    } catch (error) {
      console.error("Failed to parse validation response:", error);
      return { errors: [], suggestions: [], confidence: 0 };
    }
  }

  // ✅ FIXED: parseSearchResponse method
  private parseSearchResponse(response: string): {
    targetTable: string;
    filterFunction: string;
    explanation: string;
  } {
    try {
      if (!response || typeof response !== "string") {
        console.warn("Invalid search response provided");
        return {
          targetTable: "tasks",
          filterFunction: "row => true",
          explanation: "No valid search criteria found",
        };
      }

      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);

      return {
        targetTable: parsed.targetTable || "tasks",
        filterFunction: parsed.filterFunction || "row => true",
        explanation: parsed.explanation || "Search completed",
      };
    } catch (error) {
      console.error("Failed to parse search response:", error);
      return {
        targetTable: "tasks",
        filterFunction: "row => true",
        explanation: "Failed to parse search criteria",
      };
    }
  }

  // ✅ FIXED: parseCorrectionSuggestions method
  private parseCorrectionSuggestions(response: string): DataSuggestion[] {
    try {
      if (!response || typeof response !== "string") {
        console.warn("Invalid correction response provided");
        return [];
      }

      let cleaned = this.cleanJsonResponse(response);

      // Log the cleaned response for debugging
      console.log(
        "Cleaned correction response (first 300 chars):",
        cleaned.substring(0, 300)
      );

      // If we found an object instead of an array, wrap it
      if (cleaned.startsWith("{")) {
        cleaned = `[${cleaned}]`;
      }

      // Additional cleaning for correction responses specifically
      cleaned = cleaned.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

      // Try to extract just the JSON array part
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }

      const parsed = JSON.parse(cleaned);

      // Ensure we have an array
      const corrections = Array.isArray(parsed) ? parsed : [parsed];

      return corrections.map((correction: any) => ({
        id: correction.id || `fix-${Date.now()}-${Math.random()}`,
        type: correction.type || "fix",
        field: correction.field || "unknown",
        rowIndex: correction.rowIndex || 0,
        file: correction.file || "unknown",
        originalValue: correction.originalValue,
        suggestedValue: correction.suggestedValue,
        reasoning: correction.reasoning || "AI-suggested correction",
        confidence: correction.confidence || 0.8,
      }));
    } catch (error) {
      console.error("Failed to parse correction suggestions:", error);
      console.error("Raw response:", response.substring(0, 500));
      return [];
    }
  }

  // ✅ IMPROVED: cleanJsonResponse method
  private cleanJsonResponse(response: string): string {
    if (!response || typeof response !== "string") {
      console.warn("cleanJsonResponse received invalid input:", response);
      return "";
    }

    let cleaned = response.trim();

    // Log raw response for debugging
    console.log(
      "Raw AI response (first 200 chars):",
      cleaned.substring(0, 200)
    );

    // Remove markdown code blocks more aggressively
    cleaned = cleaned.replace(/```json\s*/gi, "");
    cleaned = cleaned.replace(/```\s*/g, "");
    cleaned = cleaned.replace(/^```/gm, "");
    cleaned = cleaned.replace(/```$/gm, "");

    // Find the first and last brace or bracket
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");

    let start = -1;
    if (firstBrace === -1) start = firstBracket;
    else if (firstBracket === -1) start = firstBrace;
    else start = Math.min(firstBrace, firstBracket);

    let end = -1;
    if (lastBrace === -1) end = lastBracket;
    else if (lastBracket === -1) end = lastBrace;
    else end = Math.max(lastBrace, lastBracket);

    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    } else {
      console.warn("Could not find valid JSON structure in response.");
    }

    // Remove common AI response prefixes and explanations
    cleaned = cleaned
      .replace(
        /^(Here's the JSON response:|Certainly, here is the JSON:|Sure, here's the JSON:)\s*/i,
        ""
      )
      .trim();

    console.log(
      "Cleaned AI response (first 200 chars):",
      cleaned.substring(0, 200)
    );

    return cleaned;
  }

  // ✅ IMPROVED: getSampleData method
  private getSampleData(sessionData: SessionData, maxRows: number = 3): any {
    const sampleData: any = {};

    Object.entries(sessionData).forEach(([fileType, fileData]) => {
      if (fileData && fileData.data && Array.isArray(fileData.data)) {
        sampleData[fileType] = {
          headers: fileData.headers || [],
          data: fileData.data.slice(0, maxRows),
          totalRows: fileData.data.length,
        };
      }
    });

    return sampleData;
  }

  // ✅ IMPROVED: Natural Language Search with better error handling
  async processNaturalLanguageQuery(
    query: string,
    sessionData: SessionData
  ): Promise<{
    targetTable: string;
    results: any[];
    explanation: string;
  }> {
    try {
      if (!query || typeof query !== "string") {
        throw new Error("Invalid query provided");
      }

      if (!sessionData || Object.keys(sessionData).length === 0) {
        throw new Error("No session data available for search");
      }

      const prompt = this.buildSearchPrompt(query, sessionData);
      const response = await this.queryMistral(prompt, 0.1);

      console.log("NL Search - AI Response:", response.substring(0, 300));

      const filterConfig = this.parseSearchResponse(response);
      const results = this.executeGeneratedFilter(filterConfig, sessionData);

      return {
        targetTable: filterConfig.targetTable,
        results,
        explanation: filterConfig.explanation,
      };
    } catch (error) {
      console.error("Natural language search failed:", error);
      return {
        targetTable: "tasks",
        results: [],
        explanation: `Search failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  // ✅ IMPROVED: buildSearchPrompt with better examples
  private buildSearchPrompt(query: string, sessionData: SessionData): string {
    const sampleData = this.getSampleData(sessionData, 2);

    return `Convert this natural language query to a precise JavaScript filter function.

QUERY: "${query}"

AVAILABLE DATA SAMPLE:
${JSON.stringify(sampleData, null, 2)}

Return ONLY a JSON object with this exact structure (no explanatory text):
{
  "targetTable": "tasks",
  "filterFunction": "parseFloat(row.Duration) > 2 && (row.PreferredPhases.includes('2') || row.PreferredPhases.includes('[2'))",
  "explanation": "Tasks with duration > 2 hours that prefer phase 2"
}

Field mapping examples:
- Duration: parseFloat(row.Duration) 
- PriorityLevel: parseInt(row.PriorityLevel)
- PreferredPhases: row.PreferredPhases (string containing phase numbers)
- RequiredSkills: row.RequiredSkills (comma-separated string)
- Skills: row.Skills (comma-separated string)

Query patterns:
- "tasks duration > 2" → { "targetTable": "tasks", "filterFunction": "parseFloat(row.Duration) > 2" }
- "workers with python" → { "targetTable": "workers", "filterFunction": "row.Skills.toLowerCase().includes('python')" }
- "clients priority 1" → { "targetTable": "clients", "filterFunction": "parseInt(row.PriorityLevel) === 1" }
- "phase 2" → { "targetTable": "tasks", "filterFunction": "row.PreferredPhases.includes('2')" }

If the query is ambiguous or doesn't match the data, return an empty filterFunction and an explanation.
Be precise with filter conditions. Do not invent fields. The targetTable must be one of: "clients", "workers", "tasks".`;
  }

  // ✅ IMPROVED: buildCorrectionPrompt with actual data analysis
  private buildCorrectionPrompt(
    sessionData: SessionData,
    validationErrors: ValidationError[]
  ): string {
    const sampleData = this.getSampleData(sessionData, 5);

    return `Generate specific data corrections based on this dataset and validation errors.

DATASET SAMPLE:
${JSON.stringify(sampleData, null, 2)}

VALIDATION ERRORS:
${JSON.stringify(validationErrors.slice(0, 5), null, 2)}

Look for these specific issues in the data:
1. Invalid JSON in AttributesJSON fields (should be valid JSON objects)
2. Malformed arrays in AvailableSlots (should be [1,2,3] format)
3. Out of range values (PriorityLevel should be 1-5, Duration should be ≥1)
4. Invalid references (TaskIDs that don't exist)

Return ONLY a JSON array with specific corrections (no explanatory text):
[
  {
    "id": "fix-1",
    "type": "fix",
    "field": "AttributesJSON",
    "rowIndex": 1,
    "file": "clients",
    "originalValue": "ensure deliverables align with project scope",
    "suggestedValue": "{}",
    "reasoning": "Convert non-JSON text to empty JSON object",
    "confidence": 0.95
  }
]`;
  }
}

export const aiService = new AIService();
