"use client"

import { useState } from "react"
import { Plus, Trash2, Edit3, Save, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface Rule {
  id: string
  type: "co-run" | "slot-limit" | "phase-window"
  name: string
  config: any
}

interface RuleBuilderProps {
  rules: Rule[]
  setRules: (rules: Rule[]) => void
}

export default function RuleBuilder({ rules, setRules }: RuleBuilderProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [newRule, setNewRule] = useState({
    type: "co-run" as const,
    name: "",
    config: {},
  })

  const addRule = () => {
    const rule: Rule = {
      id: Date.now().toString(),
      type: newRule.type,
      name: newRule.name,
      config: newRule.config,
    }
    setRules([...rules, rule])
    setNewRule({ type: "co-run", name: "", config: {} })
    setShowAddForm(false)
  }

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

  const exportRules = () => {
    const rulesJson = JSON.stringify(rules, null, 2)
    const blob = new Blob([rulesJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "rules.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderRuleForm = (rule: any, isEditing = false) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rule-name" className="text-[#cdd6f4]">
          Rule Name
        </Label>
        <Input
          id="rule-name"
          value={rule.name}
          onChange={(e) => (isEditing ? {} : setNewRule({ ...newRule, name: e.target.value }))}
          placeholder="Enter rule name"
          className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
        />
      </div>

      <div>
        <Label htmlFor="rule-type" className="text-[#cdd6f4]">
          Rule Type
        </Label>
        <Select
          value={rule.type}
          onValueChange={(value) => (isEditing ? {} : setNewRule({ ...newRule, type: value as any }))}
        >
          <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#313244] border-[#45475a]">
            <SelectItem value="co-run" className="text-[#cdd6f4]">
              Co-run Tasks
            </SelectItem>
            <SelectItem value="slot-limit" className="text-[#cdd6f4]">
              Worker Group Slot Limits
            </SelectItem>
            <SelectItem value="phase-window" className="text-[#cdd6f4]">
              Phase Windows
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rule.type === "co-run" && (
        <div>
          <Label className="text-[#cdd6f4]">Select Tasks</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {["T001", "T002", "T003", "T004"].map((task) => (
              <div key={task} className="flex items-center space-x-2">
                <Checkbox
                  id={task}
                  className="border-[#45475a] data-[state=checked]:bg-[#cba6f7] data-[state=checked]:border-[#cba6f7]"
                />
                <Label htmlFor={task} className="text-[#cdd6f4] text-sm">
                  {task}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {rule.type === "slot-limit" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="group" className="text-[#cdd6f4]">
              Worker Group
            </Label>
            <Select>
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                <SelectItem value="frontend" className="text-[#cdd6f4]">
                  Frontend
                </SelectItem>
                <SelectItem value="backend" className="text-[#cdd6f4]">
                  Backend
                </SelectItem>
                <SelectItem value="fullstack" className="text-[#cdd6f4]">
                  Full Stack
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="slots" className="text-[#cdd6f4]">
              Max Slots
            </Label>
            <Input
              id="slots"
              type="number"
              placeholder="5"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
        </div>
      )}

      {rule.type === "phase-window" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="phase" className="text-[#cdd6f4]">
              Phase
            </Label>
            <Select>
              <SelectTrigger className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent className="bg-[#313244] border-[#45475a]">
                <SelectItem value="1" className="text-[#cdd6f4]">
                  Phase 1
                </SelectItem>
                <SelectItem value="2" className="text-[#cdd6f4]">
                  Phase 2
                </SelectItem>
                <SelectItem value="3" className="text-[#cdd6f4]">
                  Phase 3
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start" className="text-[#cdd6f4]">
              Start Day
            </Label>
            <Input
              id="start"
              type="number"
              placeholder="1"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end" className="text-[#cdd6f4]">
              End Day
            </Label>
            <Input
              id="end"
              type="number"
              placeholder="30"
              className="bg-[#1e1e2e] border-[#45475a] text-[#cdd6f4] mt-1"
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className="bg-[#313244] border-[#45475a]">
        <CardHeader>
          <CardTitle className="text-[#cdd6f4] flex items-center justify-between">
            Rule Builder
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
              className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </CardTitle>
          <CardDescription className="text-[#6c7086]">
            Define custom rules for task assignment and worker allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="bg-[#45475a] border-[#585b70] mb-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#cdd6f4] text-lg">Add New Rule</CardTitle>
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

          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-[#6c7086]">
                No rules defined yet. Click "Add Rule" to get started.
              </div>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id} className="bg-[#45475a] border-[#585b70]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30">
                          {rule.type}
                        </Badge>
                        <span className="font-medium text-[#cdd6f4]">{rule.name}</span>
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
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {rules.length > 0 && (
            <div className="flex justify-end mt-6">
              <Button onClick={exportRules} className="bg-[#fab387] text-[#1e1e2e] hover:bg-[#fab387]/90">
                Generate rules.json
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
