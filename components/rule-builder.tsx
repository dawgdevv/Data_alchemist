"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface Rule {
  id: string;
  type:
    | "co-run"
    | "slot-restriction"
    | "load-limit"
    | "phase-window"
    | "pattern-match"
    | "precedence-override";
  name: string;
  config: any;
  priority?: number;
  aiGenerated?: boolean;
}

interface RuleBuilderProps {
  rules: Rule[];
  setRules: (rules: Rule[]) => void;
  sessionData?: any;
  prioritizationData?: any; // Add this prop to receive prioritization weights
}

export default function RuleBuilder({
  rules,
  setRules,
  sessionData,
  prioritizationData, // Destructure the new prop
}: RuleBuilderProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showNLForm, setShowNLForm] = useState(false);
  const [nlInput, setNlInput] = useState("");
  const [isGeneratingRule, setIsGeneratingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    type: "co-run" as const,
    name: "",
    config: {},
    priority: 1,
  });

  // Get dynamic data from session
  const getTaskIds = () =>
    sessionData?.tasks?.data?.map((t: any) => t.TaskID) || [];
  const getWorkerGroups = () =>
    [
      ...new Set(sessionData?.workers?.data?.map((w: any) => w.WorkerGroup)),
    ] || ["Frontend", "Backend", "FullStack"];
  const getClientGroups = () =>
    [...new Set(sessionData?.clients?.data?.map((c: any) => c.GroupTag))] || [
      "Priority",
      "Standard",
      "Premium",
    ];

  const addRule = () => {
    const rule: Rule = {
      id: Date.now().toString(),
      type: newRule.type,
      name: newRule.name,
      config: newRule.config,
      priority: newRule.priority,
    };
    setRules([...rules, rule]);
    setNewRule({ type: "co-run", name: "", config: {}, priority: 1 });
    setShowAddForm(false);
  };

  const updateRule = (ruleId: string, updatedRule: Partial<Rule>) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updatedRule } : rule
      )
    );
    setEditingRule(null);
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const generateNLRule = async () => {
    if (!nlInput.trim()) return;

    setIsGeneratingRule(true);
    try {
      const response = await fetch("/api/ai-rule-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguage: nlInput,
          sessionData,
          existingRules: rules,
        }),
      });

      const result = await response.json();
      if (result.success && result.rule) {
        const aiRule: Rule = {
          ...result.rule,
          id: Date.now().toString(),
          aiGenerated: true,
        };
        setRules([...rules, aiRule]);
        setNlInput("");
        setShowNLForm(false);
      } else {
        console.error("Rule generation failed:", result.error);
      }
    } catch (error) {
      console.error("Failed to generate rule:", error);
    } finally {
      setIsGeneratingRule(false);
    }
  };

  const exportRules = () => {
    const finalConfig: any = {
      coRunRules: [],
      slotRestrictions: [],
      loadLimits: [],
      phaseWindows: [],
      patternMatchRules: [],
      precedenceOverrides: [],
      prioritization: {},
    };

    rules.forEach((rule) => {
      switch (rule.type) {
        case "co-run":
          finalConfig.coRunRules.push({
            type: "coRun",
            tasks: rule.config.taskIds || [],
            ...rule.config,
          });
          break;
        case "slot-restriction":
          finalConfig.slotRestrictions.push({
            type: "slotRestriction",
            group: rule.config.targetGroup,
            minCommonSlots: rule.config.minCommonSlots,
            ...rule.config,
          });
          break;
        case "load-limit":
          finalConfig.loadLimits.push({
            type: "loadLimit",
            workerGroup: rule.config.workerGroup,
            maxSlotsPerPhase: rule.config.maxSlotsPerPhase,
            ...rule.config,
          });
          break;
        case "phase-window":
          finalConfig.phaseWindows.push({
            type: "phaseWindow",
            taskId: rule.config.taskId,
            allowedPhases: rule.config.allowedPhases
              ?.split(/[, -]+/)
              .map((p: string) => parseInt(p.trim()))
              .filter(Number.isInteger),
            ...rule.config,
          });
          break;
        case "pattern-match":
          finalConfig.patternMatchRules.push({
            type: "patternMatch",
            regex: rule.config.pattern,
            template: rule.config.actionTemplate,
            params: {
              // This is an example, you may need more specific UI fields for this
              taskIds: rule.config.taskIds || [],
            },
            ...rule.config,
          });
          break;
        case "precedence-override":
          // This structure is complex and may need more specific UI fields
          finalConfig.precedenceOverrides.push({
            type: "precedenceOverride",
            globalRulePriority: rule.config.globalRulePriority || [],
            specificOverrides: rule.config.specificOverrides || [],
            ...rule.config,
          });
          break;
      }
    });

    // Integrate prioritization data if available
    if (prioritizationData) {
      finalConfig.prioritization = {
        priorityLevelWeight: prioritizationData.weights?.priorityLevel,
        requestedTaskFulfillmentWeight:
          prioritizationData.weights?.taskFulfillment,
        fairnessConstraintWeight:
          prioritizationData.weights?.fairnessConstraints,
        presetProfile: prioritizationData.profile,
      };
    }

    const blob = new Blob([JSON.stringify(finalConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rules.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateNewRuleConfig = (key: string, value: any) => {
    setNewRule({
      ...newRule,
      config: {
        ...newRule.config,
        [key]: value,
      },
    });
  };

  const updateRuleConfig = (ruleId: string, key: string, value: any) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      updateRule(ruleId, {
        config: {
          ...rule.config,
          [key]: value,
        },
      });
    }
  };

  const renderRuleForm = (rule: any, isEditing = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rule-name" className="text-[#cdd6f4]">
            Rule Name
          </Label>
          <Input
            id="rule-name"
            value={rule.name}
            onChange={(e) =>
              isEditing
                ? updateRule(editingRule!, { name: e.target.value })
                : setNewRule({ ...newRule, name: e.target.value })
            }
            placeholder="Enter descriptive rule name"
            className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
          />
        </div>
        <div>
          <Label htmlFor="rule-priority" className="text-[#cdd6f4]">
            Priority (1-10)
          </Label>
          <Slider
            value={[rule.priority || 1]}
            onValueChange={(value) =>
              isEditing
                ? updateRule(editingRule!, { priority: value[0] })
                : setNewRule({ ...newRule, priority: value[0] })
            }
            max={10}
            min={1}
            step={1}
            className="mt-2"
          />
          <div className="text-xs text-[#6c7086] mt-1">
            Current: {rule.priority || 1}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="rule-type" className="text-[#cdd6f4]">
          Rule Type
        </Label>
        <Select
          value={rule.type}
          onValueChange={(value) =>
            isEditing
              ? updateRule(editingRule!, { type: value as any })
              : setNewRule({ ...newRule, type: value as any, config: {} })
          }
        >
          <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#313244] border-[#45475a]">
            <SelectItem value="co-run" className="text-[#cdd6f4]">
              Co-run Tasks
            </SelectItem>
            <SelectItem value="slot-restriction" className="text-[#cdd6f4]">
              Slot Restriction
            </SelectItem>
            <SelectItem value="load-limit" className="text-[#cdd6f4]">
              Load Limit
            </SelectItem>
            <SelectItem value="phase-window" className="text-[#cdd6f4]">
              Phase Window
            </SelectItem>
            <SelectItem value="pattern-match" className="text-[#cdd6f4]">
              Pattern Match
            </SelectItem>
            <SelectItem value="precedence-override" className="text-[#cdd6f4]">
              Precedence Override
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Co-run Tasks */}
      {rule.type === "co-run" && (
        <div>
          <Label className="text-[#cdd6f4]">Select Tasks to Run Together</Label>
          <div className="grid grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
            {getTaskIds().map((taskId) => (
              <div key={taskId} className="flex items-center space-x-2">
                <Checkbox
                  id={taskId}
                  checked={rule.config?.taskIds?.includes(taskId) || false}
                  onCheckedChange={(checked) => {
                    const currentTasks = rule.config?.taskIds || [];
                    const newTasks = checked
                      ? [...currentTasks, taskId]
                      : currentTasks.filter((id: string) => id !== taskId);

                    if (isEditing) {
                      updateRuleConfig(editingRule!, "taskIds", newTasks);
                    } else {
                      updateNewRuleConfig("taskIds", newTasks);
                    }
                  }}
                  className="border-[#45475a] data-[state=checked]:bg-[#cba6f7] data-[state=checked]:border-[#cba6f7]"
                />
                <Label htmlFor={taskId} className="text-[#cdd6f4] text-sm">
                  {taskId}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Label className="text-[#cdd6f4] text-sm">Options</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox
                id="strict-timing"
                checked={rule.config?.strictTiming || false}
                onCheckedChange={(checked) => {
                  if (isEditing) {
                    updateRuleConfig(editingRule!, "strictTiming", checked);
                  } else {
                    updateNewRuleConfig("strictTiming", checked);
                  }
                }}
                className="border-[#45475a] data-[state=checked]:bg-[#cba6f7] data-[state=checked]:border-[#cba6f7]"
              />
              <Label htmlFor="strict-timing" className="text-[#cdd6f4] text-sm">
                Strict Timing Required
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Slot Restriction */}
      {rule.type === "slot-restriction" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-[#cdd6f4]">Target Group Type</Label>
            <Select
              value={rule.config?.groupType || ""}
              onValueChange={(value) => {
                if (isEditing) {
                  updateRuleConfig(editingRule!, "groupType", value);
                } else {
                  updateNewRuleConfig("groupType", value);
                }
              }}
            >
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue placeholder="Select group type" />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                <SelectItem value="client-group" className="text-[#cdd6f4]">
                  Client Group
                </SelectItem>
                <SelectItem value="worker-group" className="text-[#cdd6f4]">
                  Worker Group
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Specific Group</Label>
            <Select
              value={rule.config?.targetGroup || ""}
              onValueChange={(value) => {
                if (isEditing) {
                  updateRuleConfig(editingRule!, "targetGroup", value);
                } else {
                  updateNewRuleConfig("targetGroup", value);
                }
              }}
            >
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                {rule.config?.groupType === "worker-group"
                  ? getWorkerGroups().map((group) => (
                      <SelectItem
                        key={group}
                        value={group}
                        className="text-[#cdd6f4]"
                      >
                        {group}
                      </SelectItem>
                    ))
                  : getClientGroups().map((group) => (
                      <SelectItem
                        key={group}
                        value={group}
                        className="text-[#cdd6f4]"
                      >
                        {group}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Min Common Slots</Label>
            <Input
              type="number"
              value={rule.config?.minCommonSlots || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (isEditing) {
                  updateRuleConfig(editingRule!, "minCommonSlots", value);
                } else {
                  updateNewRuleConfig("minCommonSlots", value);
                }
              }}
              placeholder="3"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
        </div>
      )}

      {/* Load Limit */}
      {rule.type === "load-limit" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-[#cdd6f4]">Worker Group</Label>
            <Select
              value={rule.config?.workerGroup || ""}
              onValueChange={(value) => {
                if (isEditing) {
                  updateRuleConfig(editingRule!, "workerGroup", value);
                } else {
                  updateNewRuleConfig("workerGroup", value);
                }
              }}
            >
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue placeholder="Select worker group" />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                {getWorkerGroups().map((group) => (
                  <SelectItem
                    key={group}
                    value={group}
                    className="text-[#cdd6f4]"
                  >
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Max Slots Per Phase</Label>
            <Input
              type="number"
              value={rule.config?.maxSlotsPerPhase || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (isEditing) {
                  updateRuleConfig(editingRule!, "maxSlotsPerPhase", value);
                } else {
                  updateNewRuleConfig("maxSlotsPerPhase", value);
                }
              }}
              placeholder="5"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Enforcement</Label>
            <Select
              value={rule.config?.enforcement || "flexible"}
              onValueChange={(value) => {
                if (isEditing) {
                  updateRuleConfig(editingRule!, "enforcement", value);
                } else {
                  updateNewRuleConfig("enforcement", value);
                }
              }}
            >
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                <SelectItem value="flexible" className="text-[#cdd6f4]">
                  Flexible
                </SelectItem>
                <SelectItem value="strict" className="text-[#cdd6f4]">
                  Strict
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Phase Window */}
      {rule.type === "phase-window" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-[#cdd6f4]">Task ID</Label>
            <Select
              value={rule.config?.taskId || ""}
              onValueChange={(value) => {
                if (isEditing) {
                  updateRuleConfig(editingRule!, "taskId", value);
                } else {
                  updateNewRuleConfig("taskId", value);
                }
              }}
            >
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                {getTaskIds().map((taskId) => (
                  <SelectItem
                    key={taskId}
                    value={taskId}
                    className="text-[#cdd6f4]"
                  >
                    {taskId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Allowed Phases</Label>
            <Input
              value={rule.config?.allowedPhases || ""}
              onChange={(e) => {
                if (isEditing) {
                  updateRuleConfig(
                    editingRule!,
                    "allowedPhases",
                    e.target.value
                  );
                } else {
                  updateNewRuleConfig("allowedPhases", e.target.value);
                }
              }}
              placeholder="1,2,3 or 1-3"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Time Window (days)</Label>
            <Input
              type="number"
              value={rule.config?.timeWindowDays || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 7;
                if (isEditing) {
                  updateRuleConfig(editingRule!, "timeWindowDays", value);
                } else {
                  updateNewRuleConfig("timeWindowDays", value);
                }
              }}
              placeholder="7"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
        </div>
      )}

      {/* Pattern Match */}
      {rule.type === "pattern-match" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#cdd6f4]">Pattern (Regex)</Label>
              <Input
                value={rule.config?.pattern || ""}
                onChange={(e) => {
                  if (isEditing) {
                    updateRuleConfig(editingRule!, "pattern", e.target.value);
                  } else {
                    updateNewRuleConfig("pattern", e.target.value);
                  }
                }}
                placeholder="^URGENT_.*"
                className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
              />
            </div>
            <div>
              <Label className="text-[#cdd6f4]">Target Field</Label>
              <Select
                value={rule.config?.targetField || ""}
                onValueChange={(value) => {
                  if (isEditing) {
                    updateRuleConfig(editingRule!, "targetField", value);
                  } else {
                    updateNewRuleConfig("targetField", value);
                  }
                }}
              >
                <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                  <SelectValue placeholder="Select field to match" />
                </SelectTrigger>
                <SelectContent className="bg-[#313244] border-[#45475a]">
                  <SelectItem value="TaskName" className="text-[#cdd6f4]">
                    Task Name
                  </SelectItem>
                  <SelectItem value="ClientName" className="text-[#cdd6f4]">
                    Client Name
                  </SelectItem>
                  <SelectItem value="WorkerName" className="text-[#cdd6f4]">
                    Worker Name
                  </SelectItem>
                  <SelectItem value="Category" className="text-[#cdd6f4]">
                    Category
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Action Template</Label>
            <Textarea
              value={rule.config?.actionTemplate || ""}
              onChange={(e) => {
                if (isEditing) {
                  updateRuleConfig(
                    editingRule!,
                    "actionTemplate",
                    e.target.value
                  );
                } else {
                  updateNewRuleConfig("actionTemplate", e.target.value);
                }
              }}
              placeholder="Apply special handling for urgent tasks..."
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="case-sensitive"
              checked={rule.config?.caseSensitive || false}
              onCheckedChange={(checked) => {
                if (isEditing) {
                  updateRuleConfig(editingRule!, "caseSensitive", checked);
                } else {
                  updateNewRuleConfig("caseSensitive", checked);
                }
              }}
              className="border-[#45475a] data-[state=checked]:bg-[#cba6f7] data-[state=checked]:border-[#cba6f7]"
            />
            <Label htmlFor="case-sensitive" className="text-[#cdd6f4] text-sm">
              Case Sensitive
            </Label>
          </div>
        </div>
      )}

      {/* Precedence Override */}
      {rule.type === "precedence-override" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#cdd6f4]">Override Type</Label>
              <Select
                value={rule.config?.overrideType || ""}
                onValueChange={(value) => {
                  if (isEditing) {
                    updateRuleConfig(editingRule!, "overrideType", value);
                  } else {
                    updateNewRuleConfig("overrideType", value);
                  }
                }}
              >
                <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                  <SelectValue placeholder="Select override type" />
                </SelectTrigger>
                <SelectContent className="bg-[#313244] border-[#45475a]">
                  <SelectItem value="global" className="text-[#cdd6f4]">
                    Global Override
                  </SelectItem>
                  <SelectItem value="specific" className="text-[#cdd6f4]">
                    Specific Override
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#cdd6f4]">Target Rule ID</Label>
              <Select
                value={rule.config?.targetRuleId || ""}
                onValueChange={(value) => {
                  if (isEditing) {
                    updateRuleConfig(editingRule!, "targetRuleId", value);
                  } else {
                    updateNewRuleConfig("targetRuleId", value);
                  }
                }}
              >
                <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                  <SelectValue placeholder="Select rule to override" />
                </SelectTrigger>
                <SelectContent className="bg-[#313244] border-[#45475a]">
                  {rules.map((r) => (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      className="text-[#cdd6f4]"
                    >
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[#cdd6f4]">Conditions</Label>
            <Input
              value={rule.config?.conditions?.join(", ") || ""}
              onChange={(e) => {
                const conditions = e.target.value
                  .split(",")
                  .map((c) => c.trim())
                  .filter((c) => c);
                if (isEditing) {
                  updateRuleConfig(editingRule!, "conditions", conditions);
                } else {
                  updateNewRuleConfig("conditions", conditions);
                }
              }}
              placeholder="emergency, critical, high-priority"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
            <div className="text-xs text-[#6c7086] mt-1">
              Comma-separated conditions when this override applies
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-[#313244] border-[#45475a]">
        <CardHeader>
          <CardTitle className="text-[#cdd6f4] flex items-center justify-between">
            Rule Builder
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowNLForm(true)}
                size="sm"
                className="bg-[#f9e2af] text-[#1e1e2e] hover:bg-[#f9e2af]/90"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Rule
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-[#6c7086]">
            Define custom rules for task assignment and worker allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Natural Language Rule Form */}
          {showNLForm && (
            <Card className="bg-[#45475a] border-[#585b70] mb-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#cdd6f4] text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Natural Language Rule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#cdd6f4]">
                      Describe your rule in plain English
                    </Label>
                    <Textarea
                      value={nlInput}
                      onChange={(e) => setNlInput(e.target.value)}
                      placeholder="e.g., 'Tasks T1 and T2 must run together' or 'Frontend workers should not exceed 3 tasks per phase'"
                      className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNLForm(false)}
                      className="bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244]"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      onClick={generateNLRule}
                      disabled={!nlInput.trim() || isGeneratingRule}
                      className="bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      {isGeneratingRule ? "Generating..." : "Generate Rule"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standard Rule Form */}
          {showAddForm && (
            <Card className="bg-[#45475a] border-[#585b70] mb-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#cdd6f4] text-lg">
                  Add New Rule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRuleForm(newRule)}
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244]"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={addRule}
                    disabled={!newRule.name}
                    className="bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Add Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules List */}
          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-[#6c7086]">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rules defined yet.</p>
                <p className="text-sm">
                  Click "Add Rule" or "AI Rule" to get started.
                </p>
              </div>
            ) : (
              rules
                .sort((a, b) => (b.priority || 1) - (a.priority || 1))
                .map((rule) => (
                  <Card key={rule.id} className="bg-[#45475a] border-[#585b70]">
                    <CardContent className="p-4">
                      {editingRule === rule.id ? (
                        <div className="space-y-4">
                          {renderRuleForm(rule, true)}
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingRule(null)}
                              className="bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244]"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              onClick={() => setEditingRule(null)}
                              className="bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#a6e3a1]/90"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className="bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30"
                            >
                              {rule.type}
                            </Badge>
                            {rule.aiGenerated && (
                              <Badge
                                variant="outline"
                                className="bg-[#f9e2af]/20 text-[#f9e2af] border-[#f9e2af]/30"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            <span className="font-medium text-[#cdd6f4]">
                              {rule.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-[#89b4fa]/20 text-[#89b4fa] border-[#89b4fa]/30"
                            >
                              P{rule.priority || 1}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRule(rule.id)}
                              className="h-8 w-8 p-0 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#585b70]"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRule(rule.id)}
                              className="h-8 w-8 p-0 text-[#f38ba8] hover:text-[#f38ba8] hover:bg-[#f38ba8]/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
            )}
          </div>

          {rules.length > 0 && (
            <div className="flex justify-end mt-6">
              <Button
                onClick={exportRules}
                className="bg-[#fab387] text-[#1e1e2e] hover:bg-[#fab387]/90"
              >
                Generate rules.json
                <Badge className="ml-2 bg-[#1e1e2e]/20 text-[#1e1e2e]">
                  {rules.length}
                </Badge>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
