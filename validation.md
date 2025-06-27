# ✅ Data Alchemist – Validation Rules

This document outlines all the required and optional validation checks for the Data Alchemist application. These validations ensure the integrity, consistency, and usability of the uploaded datasets: `clients.csv`, `workers.csv`, and `tasks.csv`.

---

## 📁 File-wise Required Columns

### `clients.csv`

- `ClientID`
- `ClientName`
- `PriorityLevel` (1–5)
- `RequestedTaskIDs` (comma-separated TaskIDs)
- `GroupTag`
- `AttributesJSON` (must be valid JSON)

### `workers.csv`

- `WorkerID`
- `WorkerName`
- `Skills` (comma-separated)
- `AvailableSlots` (array of phase numbers)
- `MaxLoadPerPhase` (integer)
- `WorkerGroup`
- `QualificationLevel`

### `tasks.csv`

- `TaskID`
- `TaskName`
- `Category`
- `Duration` (≥ 1)
- `RequiredSkills` (comma-separated)
- `PreferredPhases` (list or range)
- `MaxConcurrent` (integer)

---

## 🔍 Core Validation Rules

| ID  | Validation Description                                                              |
| --- | ----------------------------------------------------------------------------------- |
| V1  | **Missing required column(s)** in any uploaded file                                 |
| V2  | **Duplicate IDs** (`ClientID`, `WorkerID`, `TaskID`)                                |
| V3  | **Malformed lists** (e.g., `AvailableSlots` not array of valid numbers)             |
| V4  | **Out-of-range values** – `PriorityLevel` not in 1–5, `Duration` < 1                |
| V5  | **Broken JSON** in `AttributesJSON`                                                 |
| V6  | **Unknown references** – `RequestedTaskIDs` point to missing TaskIDs                |
| V7  | **Circular co-run groups** (e.g., A → B → C → A)                                    |
| V8  | **Conflicting rules vs. phase-window constraints**                                  |
| V9  | **Overloaded workers** – `AvailableSlots.length` < `MaxLoadPerPhase`                |
| V10 | **Phase-slot saturation** – sum of task durations in a phase > worker slots         |
| V11 | **Skill-coverage matrix** – each `RequiredSkill` must map to ≥1 worker              |
| V12 | **Max-concurrency feasibility** – `MaxConcurrent` exceeds available skilled workers |

---

## 🤖 Optional AI-Powered Validations

| ID  | Feature                                                                             |
| --- | ----------------------------------------------------------------------------------- |
| A1  | **AI-assisted validation** – catch data that "looks wrong" using heuristics         |
| A2  | **Natural language data retrieval** (e.g., "Tasks in phase 3 longer than 2 phases") |
| A3  | **Natural language rule creation** (e.g., "T1 and T2 must run together")            |
| A4  | **Rule recommendations** based on patterns in uploaded data                         |
| A5  | **Data correction suggestions** for broken JSON, malformed formats, etc.            |

---

## 🔁 Data Relationship Validations

| Source    | Target  | Rule                                                                       |
| --------- | ------- | -------------------------------------------------------------------------- |
| Clients   | Tasks   | All `RequestedTaskIDs` must exist in `tasks.csv`                           |
| Tasks     | Workers | All `RequiredSkills` must be covered by at least one worker                |
| Workers   | Phases  | `AvailableSlots` must be valid and mapped                                  |
| GroupTags | Groups  | `GroupTag` (clients) and `WorkerGroup` must be consistent if used in rules |

---

## 📌 Note

- You must validate on **initial upload** and **inline edits**.
- Highlight errors **in the grid** and show a **validation summary panel**.
- You can extend these validations to make the app smarter using AI and natural language support.

---
