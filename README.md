# 🎯 FinanceLens AI

> **Turn invoices into financial intelligence.**

**FinanceLens AI** is a production-grade, AI-powered FinTech web application designed to automate corporate audits and receipt auditing. Users can upload invoices, bills, or receipts (PDF, JPG, PNG) and instantly extract itemized line items, categorize expenditures, track budget health scores, view interactive visual charts, and consult an embedded AI financial analyst.

The project is structured as a robust full-stack monorepo featuring a **Node.js + Express API** backend and a **Vite + React + TypeScript** client, styled with a state-of-the-art **Tailwind CSS v4** glassmorphic interface.🔥

---

## 📸 Visual Interfaces Showcase

FinanceLens AI features a premium "Midnight Zen" dark mode aesthetic inspired by Apple, Stripe, and Linear. The design elements consist of 24px border radii, translucent glassmorphic card surfaces, deep cosmic space backdrops, and active neon glows:

*   **Landing Page**: MESMERIZING dark space visuals with animated hero charts tracking Monthly Burn Rates, confidence rates indicators (e.g. 99.8%), and accordions FAQ.
*   **Drag-Drop Upload Center**: Dotted file drop areas accepting files up to 25MB, coupled with real-time uploading queues and animated progress bars.
*   **Animated OCR Pipeline**: Real-time visual pipeline showing document processing states: *Upload ➔ OCR Scanning ➔ Data Extraction ➔ Categorization ➔ Insights ➔ Complete*.
*   **Overview Dashboard**: 4 glowing KPI panels (Spend, Pending reviews, Growth index, and Budget Score) alongside Recharts lines and category donut breakdown charts.
*   **Metadata Editor Pane**: Two-pane workspace displaying an interactive doc visual canvas on the left, and a structured metadata editor on the right (powered by `React Hook Form`).
*   **Scenario Simulator**: Multi-slider panels letting users simulate Q4 returns if monthly savings increase or expense reductions targets are implemented.
*   **Zen AI Analyst Chat**: Conversational AI advisor dialog box with suggested prompts history tracking.

---

## 🛠️ Full Tech Stack

### Frontend (Client)
*   **Core**: React (v19+), Vite, TypeScript.
*   **Styling**: Tailwind CSS v4, custom glassmorphism utilities, Outfit/Inter/JetBrains Mono typography grids.
*   **Animations**: Framer Motion (page transitions and pipeline stages ticks).
*   **Charts**: Recharts (Monthly spend trends and Category Pies).
*   **Forms**: React Hook Form with field array registries.
*   **Icons**: Lucide React.
*   **Microinteractions**: Canvas Confetti.

### Backend (Service)
*   **Runtime**: Node.js, Express, TypeScript, Multer (file processing), PDF-Parse (document text scans).
*   **AI Engine**: Google Generative AI SDK (`@google/generative-ai` with Gemini 1.5/2.0 Flash) for structured OCR key-value parses, categorization NLP, and chat consultations.
*   **Databases (Staged)**: Cloud Firestore, Firebase Auth, and Storage.

---

## 🚀 Persistent Sandbox Fallback Capabilities

To ensure absolute operational readiness out-of-the-box, FinanceLens AI implements a **Double-Layer Stateful Sandbox Fallback**:

*   **Cloud Mode**: Integrates with active Google Gemini API and Firebase Cloud backends.
*   **Sandbox Mode**: If the Express backend is offline or API credentials are not set, the frontend client automatically pivots onto an **in-memory LocalStorage sandbox**. All uploads, metadata edits, budget targets settings, scenario simulators, and conversational chat advisor histories are fully stateful and persist across browser reloads!

---

## 📂 Repository Folder Structure

```
/ (Root Workspace)
├── backend/                  # Node.js + Express API Service
│   ├── src/
│   │   ├── controllers/      # Dashboard, Analytics, OCR Controllers
│   │   ├── routes/           # Router mappings (CRUD, AI Advisor)
│   │   ├── services/         # Gemini AI, OCR parsers, Firestore services
│   │   └── server.ts         # Express bootstrapper
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React Client (Vite + TypeScript + Tailwind v4)
│   ├── src/
│   │   ├── components/       # GlassCard, Sidebar, Header layout blocks
│   │   ├── context/          # AuthContext, AppContext (state managers)
│   │   ├── pages/            # 11 Page views (Landing, Dashboard, Advisor...)
│   │   ├── App.tsx           # Page Routing and providers
│   │   └── index.css         # Tailwind v4 directives & glass panels styles
│   ├── package.json
│   └── tsconfig.app.json
├── ui designs/               # curating screenshots reference folders
└── README.md                 # Project handbook
```

---

## 💻 Local Setup & Execution Guide

Ensure you have [Node.js (v22+)](https://nodejs.org/) installed.

### 1. Initialize and Start backend API Service
Open a terminal in the root workspace folder:
```bash
cd backend
npm install
npm run dev
```
*The Express server boots up on `http://localhost:5000`.*

### 2. Initialize and Start Vite Client
Open a second parallel terminal in the root workspace folder:
```bash
cd frontend
npm install
npm run dev
```
*The Vite server launches on `http://localhost:5173/`.*

Open your browser, navigate to `http://localhost:5173/`, and begin turning invoices into financial intelligence!
