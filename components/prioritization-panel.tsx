"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Download, RotateCcw, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PriorityWeights {
  priorityLevel: number;
  taskFulfillment: number;
  fairnessConstraints: number;
  workerUtilization: number;
  phaseBalance: number;
  skillOptimization: number;
}

interface PresetProfile {
  name: string;
  description: string;
  weights: PriorityWeights;
}

interface PrioritizationPanelProps {
  prioritizationData: {
    weights: PriorityWeights;
    profile: string;
  };
  setPrioritizationData: (data: {
    weights: PriorityWeights;
    profile: string;
  }) => void;
  sessionData?: any; // For showing impact examples
}

export default function PrioritizationPanel({
  prioritizationData,
  setPrioritizationData,
  sessionData,
}: PrioritizationPanelProps) {
  // Use props instead of local state
  const weights = prioritizationData?.weights || {
    priorityLevel: 8,
    taskFulfillment: 7,
    fairnessConstraints: 6,
    workerUtilization: 5,
    phaseBalance: 4,
    skillOptimization: 6,
  };

  const selectedPreset = prioritizationData?.profile || "custom";

  const presetProfiles: PresetProfile[] = [
    {
      name: "maximize-fulfillment",
      description: "Maximize Task Fulfillment",
      weights: {
        priorityLevel: 9,
        taskFulfillment: 10,
        fairnessConstraints: 3,
        workerUtilization: 7,
        phaseBalance: 5,
        skillOptimization: 8,
      },
    },
    {
      name: "fair-distribution",
      description: "Fair Distribution",
      weights: {
        priorityLevel: 6,
        taskFulfillment: 6,
        fairnessConstraints: 10,
        workerUtilization: 8,
        phaseBalance: 9,
        skillOptimization: 5,
      },
    },
    {
      name: "minimize-workload",
      description: "Minimize Workload",
      weights: {
        priorityLevel: 5,
        taskFulfillment: 6,
        fairnessConstraints: 8,
        workerUtilization: 10,
        phaseBalance: 7,
        skillOptimization: 4,
      },
    },
    {
      name: "skill-focused",
      description: "Skill Optimization",
      weights: {
        priorityLevel: 7,
        taskFulfillment: 8,
        fairnessConstraints: 5,
        workerUtilization: 6,
        phaseBalance: 4,
        skillOptimization: 10,
      },
    },
  ];

  const criteriaInfo = [
    {
      key: "priorityLevel" as keyof PriorityWeights,
      label: "Priority Level Weight",
      description:
        "How much client priority levels (1-5) influence assignments",
      dataSource: "clients.csv → PriorityLevel",
      impact: "Higher values favor premium clients over standard clients",
      example: sessionData?.clients
        ? `${
            sessionData.clients.data.filter(
              (c: any) => parseInt(c.PriorityLevel) >= 4
            ).length
          } premium clients in your data`
        : "Affects premium vs standard client preference",
    },
    {
      key: "taskFulfillment" as keyof PriorityWeights,
      label: "Task Fulfillment Weight",
      description: "Priority for completing requested tasks",
      dataSource: "clients.csv → RequestedTaskIDs, tasks.csv → TaskID",
      impact: "Higher values try to assign more requested tasks per client",
      example: sessionData?.clients
        ? `${sessionData.clients.data.reduce(
            (sum: number, c: any) =>
              sum + (c.RequestedTaskIDs?.split(",").length || 0),
            0
          )} total task requests to fulfill`
        : "Affects how many client requests get fulfilled",
    },
    {
      key: "fairnessConstraints" as keyof PriorityWeights,
      label: "Fairness Constraint Weight",
      description: "Equal workload distribution among workers",
      dataSource: "workers.csv → MaxLoadPerPhase, AvailableSlots",
      impact: "Higher values ensure no worker gets overloaded",
      example: sessionData?.workers
        ? `${sessionData.workers.data.length} workers to balance workload across`
        : "Prevents worker overload and burnout",
    },
    {
      key: "workerUtilization" as keyof PriorityWeights,
      label: "Worker Utilization Weight",
      description: "Efficient use of available worker capacity",
      dataSource: "workers.csv → AvailableSlots, MaxLoadPerPhase",
      impact: "Higher values maximize worker productivity",
      example: sessionData?.workers
        ? `Avg ${Math.round(
            sessionData.workers.data.reduce(
              (sum: number, w: any) => sum + (parseInt(w.MaxLoadPerPhase) || 0),
              0
            ) / sessionData.workers.data.length
          )} max load per worker`
        : "Maximizes team productivity",
    },
    {
      key: "phaseBalance" as keyof PriorityWeights,
      label: "Phase Balance Weight",
      description: "Even distribution of work across time phases",
      dataSource: "tasks.csv → PreferredPhases, workers.csv → AvailableSlots",
      impact: "Higher values spread work evenly across phases",
      example: sessionData?.tasks
        ? `${
            new Set(
              sessionData.tasks.data.flatMap(
                (t: any) => t.PreferredPhases?.match(/\d+/g) || []
              )
            ).size
          } different phases to balance`
        : "Prevents phase bottlenecks",
    },
    {
      key: "skillOptimization" as keyof PriorityWeights,
      label: "Skill Optimization Weight",
      description: "Matching tasks to best-skilled workers",
      dataSource: "tasks.csv → RequiredSkills, workers.csv → Skills",
      impact: "Higher values assign tasks to most qualified workers",
      example:
        sessionData?.tasks && sessionData?.workers
          ? `${
              new Set(
                sessionData.tasks.data.flatMap(
                  (t: any) =>
                    t.RequiredSkills?.split(",").map((s: string) => s.trim()) ||
                    []
                )
              ).size
            } unique skills to optimize`
          : "Improves task quality and efficiency",
    },
  ];

  // Update parent state when weights change
  const updateWeight = (key: keyof PriorityWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setPrioritizationData({
      weights: newWeights,
      profile: "custom",
    });
  };

  const applyPreset = (presetName: string) => {
    const preset = presetProfiles.find((p) => p.name === presetName);
    if (preset) {
      setPrioritizationData({
        weights: preset.weights,
        profile: presetName,
      });
    }
  };

  const resetToDefaults = () => {
    setPrioritizationData({
      weights: {
        priorityLevel: 8,
        taskFulfillment: 7,
        fairnessConstraints: 6,
        workerUtilization: 5,
        phaseBalance: 4,
        skillOptimization: 6,
      },
      profile: "custom",
    });
  };

  const exportPrioritization = () => {
    const config = {
      version: "1.0",
      generated: new Date().toISOString(),
      profile: selectedPreset,
      weights,
      normalized: {
        // Normalize weights to sum to 1 for algorithm use
        ...Object.fromEntries(
          Object.entries(weights).map(([key, value]) => [
            key,
            value / Object.values(weights).reduce((sum, w) => sum + w, 0),
          ])
        ),
      },
      metadata: {
        totalWeight: Object.values(weights).reduce((sum, w) => sum + w, 0),
        highestPriority: Object.entries(weights).reduce((a, b) =>
          weights[a[0] as keyof PriorityWeights] >
          weights[b[0] as keyof PriorityWeights]
            ? a
            : b
        )[0],
        dataAnalysis: sessionData
          ? {
              clientCount: sessionData.clients?.data?.length || 0,
              workerCount: sessionData.workers?.data?.length || 0,
              taskCount: sessionData.tasks?.data?.length || 0,
              avgPriorityLevel: sessionData.clients
                ? Math.round(
                    (sessionData.clients.data.reduce(
                      (sum: number, c: any) =>
                        sum + (parseInt(c.PriorityLevel) || 0),
                      0
                    ) /
                      sessionData.clients.data.length) *
                      10
                  ) / 10
                : 0,
            }
          : null,
      },
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prioritization-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  // Get the highest weighted criterion for insights
  const getTopPriority = () => {
    const topEntry = Object.entries(weights).reduce((a, b) =>
      weights[a[0] as keyof PriorityWeights] >
      weights[b[0] as keyof PriorityWeights]
        ? a
        : b
    );
    const criterium = criteriaInfo.find((c) => c.key === topEntry[0]);
    return criterium;
  };

  const topPriority = getTopPriority();

  return (
    <Card className="bg-[#313244] border-[#45475a]">
      <CardHeader>
        <CardTitle className="text-[#cdd6f4] flex items-center justify-between">
          Prioritization & Weights
          <div className="flex space-x-2">
            <Button
              onClick={resetToDefaults}
              size="sm"
              variant="outline"
              className="bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244]"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={exportPrioritization}
              size="sm"
              className="bg-[#fab387] text-[#1e1e2e] hover:bg-[#fab387]/90"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Strategy Insight */}
        {topPriority && (
          <Alert className="bg-[#89b4fa]/10 border-[#89b4fa]/30">
            <Info className="h-4 w-4 text-[#89b4fa]" />
            <AlertDescription className="text-[#cdd6f4]">
              <strong>Current Strategy:</strong> {topPriority.label} (
              {weights[topPriority.key]}/10) - {topPriority.impact}
              {sessionData && (
                <div className="text-sm text-[#6c7086] mt-1">
                  📊 {topPriority.example}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Preset Profiles */}
        <div>
          <Label className="text-[#cdd6f4] mb-3 block">Preset Profiles</Label>
          <Select value={selectedPreset} onValueChange={applyPreset}>
            <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#313244] border-[#45475a]">
              <SelectItem value="custom" className="text-[#cdd6f4]">
                Custom Configuration
              </SelectItem>
              {presetProfiles.map((preset) => (
                <SelectItem
                  key={preset.name}
                  value={preset.name}
                  className="text-[#cdd6f4]"
                >
                  {preset.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weight Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-[#cdd6f4]">Decision Criteria Weights</Label>
            <Badge
              variant="outline"
              className="bg-[#89b4fa]/20 text-[#89b4fa] border-[#89b4fa]/30"
            >
              Total: {totalWeight}
            </Badge>
          </div>

          {criteriaInfo.map(
            ({ key, label, description, dataSource, impact, example }) => (
              <div
                key={key}
                className="space-y-3 p-4 bg-[#45475a] rounded-lg border border-[#585b70]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label className="text-[#cdd6f4] text-sm font-medium">
                        {label}
                      </Label>
                      <Badge
                        variant="outline"
                        className="bg-[#45475a] text-[#cdd6f4] border-[#585b70] text-xs"
                      >
                        {weights[key]}/10
                      </Badge>
                    </div>
                    <p className="text-xs text-[#6c7086] mt-1">{description}</p>
                    <div className="text-xs text-[#a6e3a1] mt-1">
                      📋 Data Source: {dataSource}
                    </div>
                    <div className="text-xs text-[#f9e2af] mt-1">
                      🎯 Impact: {impact}
                    </div>
                    <div className="text-xs text-[#cba6f7] mt-1">
                      💡 {example}
                    </div>
                  </div>
                </div>
                <Slider
                  value={[weights[key]]}
                  onValueChange={(value) => updateWeight(key, value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#6c7086]">
                  <span>Low Impact (1)</span>
                  <span>High Impact (10)</span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Weight Distribution Visualization */}
        <div className="space-y-2">
          <Label className="text-[#cdd6f4] text-sm">
            Decision Weight Distribution
          </Label>
          <div className="space-y-1">
            {criteriaInfo.map(({ key, label }) => {
              const percentage = ((weights[key] / totalWeight) * 100).toFixed(
                1
              );
              return (
                <div key={key} className="flex items-center space-x-2 text-xs">
                  <div className="w-24 text-[#6c7086] truncate">
                    {label.replace(" Weight", "")}
                  </div>
                  <div className="flex-1 bg-[#45475a] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#cba6f7]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-[#cdd6f4] text-right">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Algorithm Impact Explanation */}
        <div className="bg-[#45475a] p-4 rounded-lg border border-[#585b70]">
          <div className="text-sm text-[#cdd6f4] mb-3 font-medium flex items-center">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            How These Weights Affect Resource Allocation:
          </div>
          <div className="space-y-2 text-xs text-[#6c7086]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2 bg-[#313244] rounded">
                <span className="text-[#f38ba8] font-medium">
                  High Priority Level:
                </span>{" "}
                Premium clients get first choice of tasks and workers
              </div>
              <div className="p-2 bg-[#313244] rounded">
                <span className="text-[#a6e3a1] font-medium">
                  High Task Fulfillment:
                </span>{" "}
                Algorithm tries to complete more requested tasks per client
              </div>
              <div className="p-2 bg-[#313244] rounded">
                <span className="text-[#89b4fa] font-medium">
                  High Fairness:
                </span>{" "}
                Work is distributed evenly, no worker gets overloaded
              </div>
              <div className="p-2 bg-[#fab387] font-medium">
                <span className="text-[#1e1e2e]">High Skill Match:</span> Tasks
                go to most qualified workers for better outcomes
              </div>
            </div>
            <div className="text-center pt-2 border-t border-[#585b70] text-[#6c7086]">
              💡 The algorithm uses these weights to make trade-off decisions
              when constraints conflict
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
