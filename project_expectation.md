# 📘 Project Expectations – Data Alchemist

This document defines the **vision**, **core goals**, **functional requirements**, and **deliverables** for the AI-enabled web application: **Data Alchemist**.

---

## 🧠 Project Vision

Build a smart, user-friendly, AI-powered web app that helps users **clean**, **validate**, and **configure** messy spreadsheets related to resource planning — involving **clients**, **workers**, and **tasks**.

---

## 🎯 Core Goals

- Help users **upload and clean spreadsheet data** (CSV/XLSX)
- Run **validations and highlight errors**
- Enable users to **edit data easily inside tables**
- Provide a way to **define rules** via UI and optionally AI
- Allow **natural language interaction** (search, rule creation, suggestions)
- Export **cleaned data + rules.json** for downstream tools

---

## 🏗️ Functional Requirements

### 1. 📥 File Upload & Ingestion

- Accept 3 file types: `clients.csv`, `workers.csv`, `tasks.csv`
- Support CSV and XLSX formats
- Parse and normalize columns, even if headers are misnamed
- Show each file in an **editable grid view**

### 2. ✅ Validation Engine

- Run validations:
  - On file upload
  - On in-app edits
- Highlight invalid cells
- Display a **validation summary panel**
- Include at least **8 validation rules**, with bonus for implementing all

### 3. 🧩 In-App Rule Builder

- No rule-related columns in uploaded files
- UI should allow defining rules like:
  - Co-run tasks
  - Slot-restriction for clients or workers
  - Load-limit
  - Phase-window constraints
  - Pattern-matching via regex
  - Precedence override
- Output: `rules.json` file upon export

### 4. 🎛️ Prioritization UI

- Let user assign **importance/weight** to:
  - Client Priority
  - Task fulfillment
  - Workload fairness, etc.
- UI options (any of these):
  - Sliders or numeric inputs
  - Drag-and-drop ranking
  - Pairwise comparisons (AHP)
  - Preset profiles
- Weights go into the exported config

### 5. 📤 Export Functionality

- Final output must include:
  - Cleaned CSVs for each file
  - `rules.json` capturing all rule and weight configurations

---

## 🤖 AI-Enabled Expectations (Bonus Features)

Optional but highly valued:

| Feature                        | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| Natural Language Search        | Search data with plain English queries                                 |
| Natural Language Rule Creation | Create rules by typing “Workers with skill X should only do Task Y”    |
| AI Validation & Correction     | Auto-suggest fixes for invalid data                                    |
| Rule Recommendations           | Suggest useful rules based on data patterns                            |
| AI Error Detection             | Detect issues beyond hard-coded rules (anomalies, suspicious patterns) |

---

## 🧪 Sample Data Expectations

- Include 3 files under `/samples/`:
  - `clients.csv`
  - `workers.csv`
  - `tasks.csv`
- You are **encouraged** to create **your own edge case files** for testing

---

## 📦 Deliverables

| Item                       | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| ✅ GitHub Repo             | Public repo with all source code (Next.js + TypeScript)  |
| ✅ Live Demo               | Deployed version of the app (e.g., Vercel)               |
| ✅ Sample Data             | In `/samples` folder                                     |
| ✅ Export Function         | Outputs cleaned CSVs + `rules.json`                      |
| 🎁 Optional X-Factor Video | A short (≤120s) demo showing your best unique feature(s) |

---

## 💡 Design Guidelines

- Target persona: **Non-technical users**
- UX should be:
  - Clean and intuitive
  - Error-proof and guided
  - Helpful through feedback and smart defaults

---

## ⏳ Timeline

- Estimated time: **3 days** for MVP
- Stretch goals optional but appreciated

---

## 🌟 Final Reminder

This project is meant to evaluate your:

- Product thinking
- Problem-solving with AI
- UX sense for real-world messy data
- Clean coding and modular architecture

---
