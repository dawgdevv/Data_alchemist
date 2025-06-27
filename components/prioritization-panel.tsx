"use client"

import { useState } from "react"
import { GripVertical, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function PrioritizationPanel() {
  const [weights, setWeights] = useState({
    fairness: [70],
    cost: [50],
    completion: [80],
  })

  const [priorities, setPriorities] = useState([
    { id: "1", label: "Task Completion Rate", active: true },
    { id: "2", label: "Worker Satisfaction", active: true },
    { id: "3", label: "Cost Efficiency", active: false },
    { id: "4", label: "Timeline Adherence", active: true },
  ])

  const presets = [
    { name: "Maximize Fulfillment", weights: { fairness: [60], cost: [30], completion: [90] } },
    { name: "Fair Distribution", weights: { fairness: [90], cost: [40], completion: [60] } },
    { name: "Minimize Workload", weights: { fairness: [80], cost: [70], completion: [50] } },
  ]

  const applyPreset = (preset: (typeof presets)[0]) => {
    setWeights(preset.weights)
  }

  const resetWeights = () => {
    setWeights({ fairness: [50], cost: [50], completion: [50] })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#313244] border-[#45475a]">
        <CardHeader>
          <CardTitle className="text-[#cdd6f4] flex items-center justify-between">
            Priority Weights
            <Button
              variant="outline"
              size="sm"
              onClick={resetWeights}
              className="bg-[#1e1e2e] text-[#cdd6f4] border-[#45475a] hover:bg-[#313244]"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </CardTitle>
          <CardDescription className="text-[#6c7086]">
            Adjust the importance of different optimization factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-[#cdd6f4]">Fairness</Label>
                <Badge variant="outline" className="bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30">
                  {weights.fairness[0]}%
                </Badge>
              </div>
              <Slider
                value={weights.fairness}
                onValueChange={(value) => setWeights({ ...weights, fairness: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-[#cdd6f4]">Cost Efficiency</Label>
                <Badge variant="outline" className="bg-[#fab387]/20 text-[#fab387] border-[#fab387]/30">
                  {weights.cost[0]}%
                </Badge>
              </div>
              <Slider
                value={weights.cost}
                onValueChange={(value) => setWeights({ ...weights, cost: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-[#cdd6f4]">Task Completion</Label>
                <Badge variant="outline" className="bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30">
                  {weights.completion[0]}%
                </Badge>
              </div>
              <Slider
                value={weights.completion}
                onValueChange={(value) => setWeights({ ...weights, completion: value })}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#cdd6f4] mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  onClick={() => applyPreset(preset)}
                  className="justify-start bg-[#45475a] text-[#cdd6f4] border-[#585b70] hover:bg-[#585b70]"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#313244] border-[#45475a]">
        <CardHeader>
          <CardTitle className="text-[#cdd6f4]">Priority Order</CardTitle>
          <CardDescription className="text-[#6c7086]">
            Drag to reorder what matters most in your optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {priorities.map((priority, index) => (
              <div
                key={priority.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-move ${
                  priority.active ? "bg-[#45475a] border-[#585b70]" : "bg-[#313244] border-[#45475a] opacity-50"
                }`}
              >
                <GripVertical className="h-4 w-4 text-[#6c7086]" />
                <div className="flex-1">
                  <span className="text-[#cdd6f4] font-medium">{priority.label}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    priority.active
                      ? "bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30"
                      : "bg-[#6c7086]/20 text-[#6c7086] border-[#6c7086]/30"
                  }`}
                >
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
