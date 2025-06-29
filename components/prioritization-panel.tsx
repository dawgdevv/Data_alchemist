"use client";

import { useState } from "react";
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
import { ArrowUpDown, Download, RotateCcw } from "lucide-react";

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

export default function PrioritizationPanel() {
  const [weights, setWeights] = useState<PriorityWeights>({
    priorityLevel: 8,
    taskFulfillment: 7,
    fairnessConstraints: 6,
    workerUtilization: 5,
    phaseBalance: 4,
    skillOptimization: 6,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>("custom");

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
      label: "Priority Level",
      description: "Client priority levels (1-5) influence",
    },
    {
      key: "taskFulfillment" as keyof PriorityWeights,
      label: "Task Fulfillment",
      description: "Completing requested tasks importance",
    },
    {
      key: "fairnessConstraints" as keyof PriorityWeights,
      label: "Fairness Constraints",
      description: "Equal treatment across clients/workers",
    },
    {
      key: "workerUtilization" as keyof PriorityWeights,
      label: "Worker Utilization",
      description: "Efficient use of worker capacity",
    },
    {
      key: "phaseBalance" as keyof PriorityWeights,
      label: "Phase Balance",
      description: "Even distribution across phases",
    },
    {
      key: "skillOptimization" as keyof PriorityWeights,
      label: "Skill Optimization",
      description: "Matching tasks to best-skilled workers",
    },
  ];

  const updateWeight = (key: keyof PriorityWeights, value: number) => {
    setWeights({ ...weights, [key]: value });
    setSelectedPreset("custom");
  };

  const applyPreset = (presetName: string) => {
    const preset = presetProfiles.find((p) => p.name === presetName);
    if (preset) {
      setWeights(preset.weights);
      setSelectedPreset(presetName);
    }
  };

  const resetToDefaults = () => {
    setWeights({
      priorityLevel: 8,
      taskFulfillment: 7,
      fairnessConstraints: 6,
      workerUtilization: 5,
      phaseBalance: 4,
      skillOptimization: 6,
    });
    setSelectedPreset("custom");
  };

  const exportPrioritization = () => {
    const config = {
      version: "1.0",
      generated: new Date().toISOString(),
      profile: selectedPreset,
      weights,
      normalized: {
        // Normalize weights to sum to 1
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
            <Label className="text-[#cdd6f4]">Criteria Weights</Label>
            <Badge
              variant="outline"
              className="bg-[#89b4fa]/20 text-[#89b4fa] border-[#89b4fa]/30"
            >
              Total: {totalWeight}
            </Badge>
          </div>

          {criteriaInfo.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#cdd6f4] text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-[#6c7086]">{description}</p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-[#45475a] text-[#cdd6f4] border-[#585b70]"
                >
                  {weights[key]}
                </Badge>
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
                <span>Low (1)</span>
                <span>High (10)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Weight Distribution Visualization */}
        <div className="space-y-2">
          <Label className="text-[#cdd6f4] text-sm">Weight Distribution</Label>
          <div className="space-y-1">
            {criteriaInfo.map(({ key, label }) => {
              const percentage = ((weights[key] / totalWeight) * 100).toFixed(
                1
              );
              return (
                <div key={key} className="flex items-center space-x-2 text-xs">
                  <div className="w-20 text-[#6c7086] truncate">{label}</div>
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

        {/* Usage Instructions */}
        <div className="bg-[#45475a] p-3 rounded-lg border border-[#585b70]">
          <div className="text-xs text-[#cdd6f4] mb-2 font-medium">
            How Prioritization Works:
          </div>
          <ul className="text-xs text-[#6c7086] space-y-1">
            <li>
              • Higher weights mean more importance in allocation decisions
            </li>
            <li>• Use presets for common scenarios or customize manually</li>
            <li>• Export configuration for use with allocation algorithms</li>
            <li>
              • Weights are automatically normalized in the exported config
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
