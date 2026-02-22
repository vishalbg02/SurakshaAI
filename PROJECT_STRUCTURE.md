# Project Structure

## Directory Tree

```
SurakshaAI/
├── backend/
│   ├── main.py                  # FastAPI application entry point
│   ├── rule_engine.py           # Layer 1: Rule-based fraud detection engine
│   ├── ai_engine.py             # Layer 2: AI semantic classification (BART)
│   ├── psych_classifier.py      # Layer 3: Psychological manipulation classifier
│   ├── workflow.py              # Orchestration: fusion, floors, risk mapping
│   ├── url_scanner.py           # URL analysis module
│   ├── education_engine.py      # Safety tip generation
│   ├── report_generator.py      # PDF report generation
│   ├── database.py              # SQLite persistence layer
│   ├── requirements.txt         # Python dependencies
│   ├── reports/                 # Generated PDF reports (auto-created)
│   └── suraksha.db              # SQLite database (auto-created)
│
├── frontend/
│   ├── app/
│   │   ├── globals.css          # Global styles, animations, utilities
│   │   ├── layout.jsx           # Root layout with navigation
│   │   ├── page.jsx             # Landing page
│   │   ├── analyzer/
│   │   │   └── page.jsx         # Threat Analyzer page
│   │   ├── simulator/
│   │   │   └── page.jsx         # Scam Simulation Lab page
│   │   └── dashboard/
│   │       └── page.jsx         # Intelligence Dashboard page
│   ├── components/
│   │   └── TrendCharts.jsx      # Recharts-based distribution chart
│   ├── lib/
│   │   ├── api.js               # Backend API client functions
│   │   └── simulations.js       # Static simulation scenario data
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── jsconfig.json            # Path alias configuration
│   ├── next.config.js           # Next.js configuration
│   └── package.json             # Node.js dependencies
│
├── README.md                    # Primary documentation
├── PROJECT_STRUCTURE.md         # This file
├── SECURITY.md                  # Security design document
├── CONTRIBUTING.md              # Contribution guidelines
├── DEMO_GUIDE.md                # Demo script and judge Q&A
└── LICENSE                      # MIT License
```

---

## Backend Architecture

### Entry Point

**main.py** — FastAPI application server. Defines all HTTP endpoints (/analyze, /analyze/batch, /trends, /history, /report/{id}). Handles CORS middleware, rate limiting, request validation, and response formatting. Imports `compute_final` from workflow.py as the primary analysis function.

### Detection Layer 1: Rule Engine

**rule_engine.py** — Deterministic fraud detection using categorized keyword dictionaries with configurable weights. Implements:

- Word-boundary regex matching (compiled and cached)
- 15+ scam categories in English, Hindi, and Hinglish
- Context-aware financial detection (compound logic)
- Social impersonation compound detection
- Dynamic urgency regex patterns
- Negative-intent suppression
- Raw score floors before normalisation

Exposes a single public function: `analyze(text) -> dict`

### Detection Layer 2: AI Engine

**ai_engine.py** — Zero-shot semantic classification using facebook/bart-large-mnli via HuggingFace Transformers. Classifies messages against fraud-related candidate labels. Returns probability, confidence, and label.

Fully optional. If the model fails to load or is disabled by the user, the workflow redistributes AI weight.

Exposes: `predict(text) -> dict`

### Detection Layer 3: Psychology Classifier

**psych_classifier.py** — Pattern-based psychological manipulation detection. Identifies eight tactic categories with context-aware suppression for neutral financial outcomes.

Exposes: `classify(text) -> dict`

### Orchestration

**workflow.py** — The central orchestration module. Calls all three engines, applies profile multipliers, computes weighted fusion, enforces post-fusion floors, maps risk levels, generates safety tips and highlights, and persists results.

Exposes: `compute_final(text, profile, ai_enabled) -> dict`

The function name `compute_final` is the canonical API used by main.py. An alias `analyze_message` is provided for internal compatibility.

### Supporting Modules

**url_scanner.py** — Analyzes URLs found in messages. Detects typosquatting patterns, non-HTTPS schemes, suspicious TLDs (.xyz, .tk, .co.in with suspicious patterns), IP-based URLs, and excessive subdomain depth. Returns a URL score and list of suspicious URLs with reasons.

**education_engine.py** — Generates contextual safety tips based on risk level, detected categories, and flags. Tips are tailored to the specific scam type detected.

**report_generator.py** — Generates PDF intelligence reports using FPDF2. Dark-themed header with risk badge, score breakdown, original message, psychological analysis, and safety recommendations.

**database.py** — SQLite persistence layer. Creates the analysis table on first use. Stores message text, scores, risk level, profile, categories, and timestamp. Provides functions for saving analyses and querying history/trends.

### Data Flow Between Layers

```
main.py receives HTTP request
    |
    v
workflow.compute_final(text, profile, ai_enabled)
    |
    +---> rule_engine.analyze(text)
    |         |
    |         +---> url_scanner.scan_urls(text)
    |         |
    |         +---> returns: score, categories, flags, matched_phrases, url_analysis
    |
    +---> ai_engine.predict(text)      [optional]
    |         |
    |         +---> returns: probability, confidence, label
    |
    +---> psych_classifier.classify(text)
    |         |
    |         +---> returns: psych_score, categories, explanation
    |
    +---> Apply profile multipliers
    +---> Compute weighted fusion
    +---> Apply post-fusion floors
    +---> Map risk level from final_score
    +---> education_engine.generate_safety_tips(...)
    +---> Generate highlights from matched_phrases
    +---> database.save_analysis(...)
    +---> Return complete response dict
```

---

## Frontend Architecture

### Routing

| Route        | File                        | Purpose                            |
|--------------|-----------------------------|------------------------------------|
| /            | app/page.jsx                | Landing page                       |
| /analyzer    | app/analyzer/page.jsx       | Threat Analyzer                    |
| /simulator   | app/simulator/page.jsx      | Scam Simulation Lab                |
| /dashboard   | app/dashboard/page.jsx      | Intelligence Dashboard             |

### Component Structure

The Analyzer page is self-contained — all sub-components (ScoreBar, AgreementBadge, tab panels, FlagPill, DownloadBtn) are defined within the page file. This eliminates cross-file import chains and makes the analyzer a single deployable unit.

**TrendCharts.jsx** is the only shared component, dynamically imported by the Dashboard to avoid SSR issues with Recharts.

### API Client

**lib/api.js** — Centralized API client with functions for analyzeMessage, analyzeBatch, getTrends, getHistory, and downloadReport. All functions point to the backend at localhost:8000.

### Simulation Data

**lib/simulations.js** — Static JSON data defining seven fraud scenarios. Each scenario contains steps (messages, risk scores, tactics, commentary), psychology breakdown, intervention points, and prevention checklists. No backend calls required.

### Design System

**tailwind.config.js** — Defines the custom color system (cx-* namespace for interface colors, risk-* namespace for risk level colors), custom animations (fade-in, slide-up, gauge-draw, bar-grow, shimmer), and typography configuration (Inter + JetBrains Mono).

**globals.css** — Global styles including glass morphism panels, skeleton loading states, card hover interactions, scrollbar styling, and listening-dot animation for voice input.