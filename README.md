# 🧪 Data Alchemist - AI-Powered Data Cleaning & Validation Tool

[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Redis](https://img.shields.io/badge/Redis-5.5.6-red?logo=redis)](https://redis.io/)

**Data Alchemist** is an intelligent web application that transforms messy spreadsheet data into clean, validated, and well-structured datasets. Built for resource planning scenarios involving clients, workers, and tasks, it combines powerful validation rules with AI-assisted data cleaning and natural language interactions.

## Test files are in /samples directory or use your own 3 data files

1. **Upload the sample files** from the `/samples` directory
2. **Review validation results** in the Validation Panel
3. **Test AI features** using natural language queries
4. **Create custom rules** using the Rule Builder
5. **Export cleaned data** and verify the output format

## 🎯 Key Features

### 📊 Core Functionality

- **Multi-Format File Support**: Upload and process CSV, XLSX files
- **Real-time Data Validation**: 8+ comprehensive validation rules with live error detection
- **Interactive Data Grid**: Edit data directly in the browser with instant feedback
- **Rule Builder**: Create custom business rules through an intuitive UI
- **Priority Management**: Configure and weight different aspects of resource allocation
- **Smart Export**: Generate cleaned datasets with accompanying rules configuration

### 🤖 AI-Powered Features

- **Natural Language Search**: Query your data using plain English
- **AI Rule Generation**: Create validation rules by describing them in natural language
- **Intelligent Error Correction**: Get AI-suggested fixes for data issues
- **Pattern Detection**: Automatically identify anomalies and data inconsistencies
- **Contextual Suggestions**: Smart recommendations based on your data patterns

### 🛠️ Technical Highlights

- **Session Management**: Redis-backed persistent sessions
- **Real-time Processing**: Background task handling with live updates
- **Modern UI**: Responsive design with dark/light theme support
- **Type Safety**: Full TypeScript implementation
- **API Integration**: Mistral AI for advanced language processing

## 📁 Sample Data Files

The project includes comprehensive sample datasets in the `/samples` directory:

### 📋 Available Sample Files

| File                 | Description                         | Records       | Key Features                                                        |
| -------------------- | ----------------------------------- | ------------- | ------------------------------------------------------------------- |
| **`Clients.csv`**    | Client information and requirements | 50 records    | Priority levels, task assignments, grouping, JSON attributes        |
| **`workers.csv`**    | Worker profiles and capabilities    | 46 records    | Skills, availability slots, capacity limits, team assignments       |
| **`tasks.csv`**      | Task definitions and requirements   | 65 records    | Duration, skill requirements, phase preferences, concurrency limits |
| **`test-cases.csv`** | Validation test scenarios           | 16 test cases | Edge cases, error conditions, validation scenarios                  |

### 🔍 Sample Data Structure

#### Clients.csv

```csv
ClientID,ClientName,PriorityLevel,RequestedTaskIDs,GroupTag,AttributesJSON
C1,Acme Corp,3,"T17,T27,T33,T31,T20,T3,T32,T26",GroupA,"{""location"":""New York"",""budget"":100000}"
```

#### workers.csv

```csv
WorkerID,WorkerName,Skills,AvailableSlots,MaxLoadPerPhase,WorkerGroup,QualificationLevel
W1,Alice Johnson,"Python,JavaScript,SQL","[1,2,3,4,5]",3,TechTeam,Senior
```

#### tasks.csv

```csv
TaskID,TaskName,Category,Duration,RequiredSkills,PreferredPhases,MaxConcurrent
T1,User Authentication System,Security,5,"Python,Security,Database","[1,2]",2
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Redis server (for session management)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd data-alchemist
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   REDIS_URL=redis://localhost:6379
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

4. **Start Redis server**

   ```bash
   redis-server
   ```

5. **Run the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## 🧪 Testing & Validation

### Running Tests

The application includes comprehensive validation testing:

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build verification
pnpm build
```

### Test Scenarios

Use the provided `test-cases.csv` file to validate the application's error detection capabilities:

- **Worker Validation**: Empty slots, invalid phases, missing skills
- **Task Validation**: Zero duration, excessive concurrency, invalid phases
- **Client Validation**: Invalid task references, malformed JSON
- **Cross-Reference Validation**: Broken relationships between entities

### Sample Testing Workflow

1. **Upload the sample files** from the `/samples` directory
2. **Review validation results** in the Validation Panel
3. **Test AI features** using natural language queries
4. **Create custom rules** using the Rule Builder
5. **Export cleaned data** and verify the output format

## 📖 Usage Guide

### 1. File Upload

- Navigate to the Upload tab
- Drag and drop your CSV/XLSX files or click to browse
- The system accepts `clients.csv`, `workers.csv`, and `tasks.csv`

### 2. Data Validation

- Automatic validation runs on file upload
- View errors and warnings in the Validation Panel
- Click on errors to navigate to problematic data points

### 3. Data Editing

- Use the Data Grid to edit values directly
- Changes are validated in real-time
- Invalid entries are highlighted with error messages

### 4. Rule Creation

- Access the Rule Builder tab
- Create custom validation and business rules
- Use natural language to describe complex rules

### 5. Prioritization

- Configure priority weights for different factors
- Use sliders or direct input for fine-tuning
- Preview the impact of your priority settings

### 6. Export

- Generate cleaned CSV files
- Download accompanying `rules.json` configuration
- Review the export summary before download

## 🏗️ Architecture

### Frontend Architecture

- **Next.js 14**: App Router with TypeScript
- **React Components**: Modular, reusable UI components
- **Tailwind CSS**: Utility-first styling with custom themes
- **Shadcn/ui**: High-quality component library
- **State Management**: React hooks with session persistence

### Backend Architecture

- **API Routes**: Next.js API endpoints for data processing
- **Redis Integration**: Session storage and caching
- **File Processing**: CSV/XLSX parsing with validation
- **AI Integration**: Mistral AI for natural language processing

### Key Components

```bash
components/
├── ai-assistant.tsx      # AI-powered data interaction
├── data-grid.tsx         # Interactive data table
├── upload-zone.tsx       # File upload interface
├── validation-panel.tsx  # Error display and management
├── rule-builder.tsx      # Custom rule creation
├── export-panel.tsx      # Data export functionality
└── ui/                   # Reusable UI components
```

## 🔧 Configuration

### Environment Variables

| Variable          | Description             | Required              |
| ----------------- | ----------------------- | --------------------- |
| `REDIS_URL`       | Redis connection string | Yes                   |
| `MISTRAL_API_KEY` | Mistral AI API key      | Yes (for AI features) |

### Redis Configuration

The application uses Redis for:

- Session data persistence
- File upload caching
- Validation result storage
- Real-time state management

## 📊 Validation Rules

The application implements 8+ core validation rules:

| Rule ID | Description              | Severity |
| ------- | ------------------------ | -------- |
| V1      | Missing required columns | Error    |
| V2      | Duplicate IDs            | Error    |
| V3      | Malformed lists/arrays   | Error    |
| V4      | Out-of-range values      | Warning  |
| V5      | Invalid JSON format      | Error    |
| V6      | Broken references        | Error    |
| V7      | Circular dependencies    | Warning  |
| V8      | Resource constraints     | Info     |

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard
3. **Set up Redis** using Vercel's Redis addon or external provider
4. **Deploy** - automatic deployments on git push

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for the excellent component library
- **Mistral AI** for powerful language processing capabilities
- **Vercel** for seamless deployment platform
- **Redis** for reliable session management

---
