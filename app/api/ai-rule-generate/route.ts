import { NextRequest, NextResponse } from "next/server";

interface RuleGenerationRequest {
  naturalLanguage: string;
  sessionData?: any;
  existingRules?: any[];
}

interface GeneratedRule {
  type: string;
  name: string;
  config: any;
  priority: number;
}

// Mistral AI Integration
async function queryMistralAI(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
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

// Build comprehensive prompt for rule generation
function buildRuleGenerationPrompt(
  naturalLanguage: string,
  sessionData: any,
  existingRules: any[]
): string {
  const availableTaskIds =
    sessionData?.tasks?.data?.map((t: any) => t.TaskID) || [];
  const availableWorkerGroups =
    [...new Set(sessionData?.workers?.data?.map((w: any) => w.WorkerGroup))] ||
    [];
  const availableClientGroups =
    [...new Set(sessionData?.clients?.data?.map((c: any) => c.GroupTag))] || [];

  return `You are a rule generation expert for task scheduling systems. Convert this natural language request into a structured rule configuration.

USER REQUEST: "${naturalLanguage}"

AVAILABLE DATA:
- Task IDs: ${availableTaskIds.join(", ")}
- Worker Groups: ${availableWorkerGroups.join(", ")}
- Client Groups: ${availableClientGroups.join(", ")}
- Existing Rules: ${existingRules.length} rules already defined

RULE TYPES SUPPORTED:
1. co-run: Tasks that must run together
   - Config: { taskIds: string[], strictTiming: boolean }
   
2. slot-restriction: Minimum common slots for groups
   - Config: { groupType: "client-group"|"worker-group", targetGroup: string, minCommonSlots: number }
   
3. load-limit: Maximum slots per phase for worker groups
   - Config: { workerGroup: string, maxSlotsPerPhase: number, enforcement: "strict"|"flexible" }
   
4. phase-window: Restrict tasks to specific phases
   - Config: { taskId: string, allowedPhases: string, timeWindowDays: number }
   
5. pattern-match: Regex-based rules for matching
   - Config: { pattern: string, targetField: string, actionTemplate: string, caseSensitive: boolean }
   
6. precedence-override: Override existing rules
   - Config: { overrideType: "global"|"specific", targetRuleId: string, conditions: string[] }

EXAMPLES:
- "Tasks T1 and T2 must run together" → co-run rule
- "Frontend workers max 3 slots per phase" → load-limit rule
- "Priority clients need 2 common slots" → slot-restriction rule
- "Task T5 only in phases 1-3" → phase-window rule
- "Urgent tasks get priority" → pattern-match rule

Return ONLY a JSON object with this exact structure:
{
  "type": "co-run",
  "name": "Descriptive rule name",
  "config": { /* rule-specific configuration */ },
  "priority": 5
}

Priority scale: 1 (low) to 10 (critical). Use context clues from the request to determine priority.`;
}

// Parse AI response with better error handling
function parseAIResponse(response: string): GeneratedRule | null {
  try {
    // Clean the response
    let cleaned = response.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/gi, "");
    cleaned = cleaned.replace(/```\s*/g, "");

    // Find JSON content
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.type || !parsed.name || !parsed.config) {
      throw new Error("Missing required fields in AI response");
    }

    return {
      type: parsed.type,
      name: parsed.name,
      config: parsed.config,
      priority: parsed.priority || 5,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    console.error("Raw response:", response);
    return null;
  }
}

// Fallback rule parsing for simple cases
function fallbackRuleParsing(
  input: string,
  taskIds: string[],
  workerGroups: string[],
  clientGroups: string[]
): GeneratedRule | null {
  const lowerInput = input.toLowerCase();

  // Co-run pattern detection
  if (lowerInput.includes("together") || lowerInput.includes("co-run")) {
    const mentionedTasks = taskIds.filter((taskId) =>
      lowerInput.includes(taskId.toLowerCase())
    );

    if (mentionedTasks.length >= 2) {
      return {
        type: "co-run",
        name: `Co-run: ${mentionedTasks.join(", ")}`,
        config: {
          taskIds: mentionedTasks,
          strictTiming:
            lowerInput.includes("must") || lowerInput.includes("strict"),
        },
        priority: lowerInput.includes("critical") ? 8 : 5,
      };
    }
  }

  // Load limit detection
  if (lowerInput.includes("limit") || lowerInput.includes("max")) {
    const workerGroup = workerGroups.find((group) =>
      lowerInput.includes(group.toLowerCase())
    );
    const numberMatch = lowerInput.match(/(\d+)/);
    const maxSlots = numberMatch ? parseInt(numberMatch[1]) : 3;

    if (workerGroup) {
      return {
        type: "load-limit",
        name: `Load Limit: ${workerGroup} (${maxSlots} max)`,
        config: {
          workerGroup,
          maxSlotsPerPhase: maxSlots,
          enforcement: lowerInput.includes("strict") ? "strict" : "flexible",
        },
        priority: 6,
      };
    }
  }

  // Phase window detection
  if (lowerInput.includes("phase") || lowerInput.includes("only in")) {
    const taskId = taskIds.find((id) => lowerInput.includes(id.toLowerCase()));
    const phaseMatch = lowerInput.match(/phase[s]?\s*(\d+(?:[-,]\d+)*)/i);

    if (taskId) {
      return {
        type: "phase-window",
        name: `Phase Window: ${taskId}`,
        config: {
          taskId,
          allowedPhases: phaseMatch ? phaseMatch[1] : "1-3",
          timeWindowDays: 7,
        },
        priority: 6,
      };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const {
      naturalLanguage,
      sessionData,
      existingRules,
    }: RuleGenerationRequest = await request.json();

    if (!naturalLanguage?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Natural language input is required",
        },
        { status: 400 }
      );
    }

    console.log("Generating rule for:", naturalLanguage);

    let rule: GeneratedRule | null = null;

    // Try AI-powered generation first
    try {
      const prompt = buildRuleGenerationPrompt(
        naturalLanguage,
        sessionData,
        existingRules || []
      );

      const aiResponse = await queryMistralAI(prompt);
      rule = parseAIResponse(aiResponse);

      if (rule) {
        console.log("AI generated rule:", rule);
      }
    } catch (aiError) {
      console.warn("AI generation failed, trying fallback:", aiError);
    }

    // Fallback to pattern matching if AI fails
    if (!rule) {
      const availableTaskIds =
        sessionData?.tasks?.data?.map((t: any) => t.TaskID) || [];
      const availableWorkerGroups =
        [
          ...new Set(
            sessionData?.workers?.data?.map((w: any) => w.WorkerGroup)
          ),
        ] || [];
      const availableClientGroups =
        [...new Set(sessionData?.clients?.data?.map((c: any) => c.GroupTag))] ||
        [];

      rule = fallbackRuleParsing(
        naturalLanguage,
        availableTaskIds,
        availableWorkerGroups,
        availableClientGroups
      );
    }

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not parse the natural language input into a valid rule. Try being more specific about tasks, groups, or constraints.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error("Error generating rule:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while generating rule",
      },
      { status: 500 }
    );
  }
}
