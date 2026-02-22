![License](https://img.shields.io/badge/license-MIT-blue)
![Backend](https://img.shields.io/badge/backend-FastAPI-green)
![Frontend](https://img.shields.io/badge/frontend-Next.js-black)
![AI](https://img.shields.io/badge/AI-BART--MNLI-orange)

# SurakshaAI

**Explainable Fraud Intelligence Engine for the Indian Digital Ecosystem**

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [System Flow](#system-flow)
5. [Core Detection Layers](#core-detection-layers)
6. [Feature Breakdown](#feature-breakdown)
7. [Technology Stack](#technology-stack)
8. [Installation](#installation)
9. [API Reference](#api-reference)
10. [Sample Test Cases](#sample-test-cases)
11. [Performance Considerations](#performance-considerations)
12. [Scalability](#scalability)
13. [Security](#security)
14. [Impact and Future Scope](#impact-and-future-scope)
15. [Why SurakshaAI Is Different](#why-surakshaai-is-different)
16. [License](#license)

---

## Problem Statement

India reported over 10 lakh cyber fraud complaints in the first nine months of 2024 alone, with financial losses exceeding INR 27,914 crore (National Cybercrime Reporting Portal, I4C). The Indian Cyber Crime Coordination Centre has identified SMS phishing, UPI fraud, KYC scams, and call-based social engineering as the dominant attack vectors targeting the Indian population.

The victims are not careless. They are systematically manipulated through psychological tactics — authority impersonation (fake bank and police calls), urgency pressure (account closure threats with deadlines), fear exploitation (arrest warrants, FIR threats), and emotional manipulation (family impersonation via WhatsApp). These attacks are designed to bypass rational thinking by exploiting deeply ingrained social trust in institutions and family bonds.

Existing solutions fall short in several critical ways:

- **Carrier-level spam filters** operate on sender reputation, not message content. They fail entirely against new numbers and compromised accounts.
- **Generic AI classifiers** provide binary spam/not-spam verdicts with zero explainability. Users receive no understanding of why a message is dangerous.
- **ChatGPT-style API solutions** introduce external data dependencies, require internet connectivity, incur per-request costs, and create privacy concerns by transmitting user messages to third-party servers.
- **No existing tool** performs phrase-level explainability, psychological tactic identification, or social impersonation compound detection in the Indian multilingual context.

The gap is clear: there is no free, offline-capable, explainable fraud intelligence tool purpose-built for the Indian digital threat landscape.

---

## Solution Overview

SurakshaAI is an explainable fraud intelligence engine that analyzes suspicious SMS messages, WhatsApp messages, and call transcripts through a three-layer detection architecture. It is designed to operate without mandatory internet connectivity, without user authentication, without external API dependencies, and without cost.

The system provides:

- **Transparent risk scoring** with a 0-100 composite score derived from three independent engines.
- **Phrase-level explainability** — every flagged word or phrase is highlighted with its exact category and risk contribution.
- **Psychological manipulation profiling** — identification of fear, urgency, authority, emotional manipulation, financial coercion, reward, and scarcity tactics with behavioral impact explanations.
- **Compound detection logic** — patterns like family keyword + new number + money request are detected as social impersonation even when individual words appear benign.
- **Context-aware financial detection** — neutral financial terms (payment, refund, salary) do not trigger false positives unless combined with action verbs, urgency, URLs, or OTP requests.
- **Profile-based risk adaptation** — risk scoring adjusts based on the user's vulnerability profile (general, student, elderly, business owner).
- **Full offline operation** — the rule engine, psychology classifier, SQLite database, and PDF report generator function without internet. AI semantic classification enhances detection when available but never gates it.

---

## Architecture

SurakshaAI employs a modular three-layer detection architecture with a fusion scoring system.

### Layer 1: Rule-Based Fraud Engine

A deterministic keyword and pattern matching engine that scans input text against categorized dictionaries covering 15+ scam categories in English, Hindi, and Hinglish. Each category carries a configurable weight. Detection uses word-boundary regex matching to prevent substring false positives.

Key capabilities:
- Dynamic urgency detection via regex (e.g., "within 24 hours")
- Context-aware financial detection (compound logic prevents false positives)
- Social impersonation compound detection (family + new number + money request)
- Negative-intent suppression (messages containing "successfully", "completed" are not flagged)
- URL scanning with typosquatting, non-HTTPS, and suspicious TLD detection

### Layer 2: AI Semantic Classification

A zero-shot classification model (facebook/bart-large-mnli) that evaluates message semantics without requiring training data specific to Indian scams. The model classifies messages against candidate labels (fraud, scam, phishing, legitimate, informational) and returns a probability score and confidence value.

This layer is entirely optional. When disabled or unavailable, the system redistributes AI weight across rule and psychology scores.

### Layer 3: Psychological Manipulation Classifier

A pattern-based classifier that identifies psychological tactics deployed in the message: Fear, Urgency, Authority, Financial Pressure, Financial Coercion, Emotional Manipulation, Reward, and Scarcity.

Each tactic includes:
- Detected trigger phrases
- Explanation of why the tactic works psychologically
- Behavioral impact assessment

This layer also applies context-aware suppression: neutral financial outcomes (salary credited, refund completed) do not trigger Financial Pressure or Financial Coercion categories.

### Fusion Engine

The three layer scores are combined using weighted fusion:

```
final_score = (rule_score * 0.45) + (ai_score * 0.30) + (psych_score * 0.25)
```

Post-fusion floors are applied to prevent contradictions:
- OTP + suspicious URL detected: final score minimum 90 (Critical)
- Social impersonation + money request: final score minimum 65 (High)
- Social impersonation alone: final score minimum 45 (Medium)
- Any detection flag active: final score minimum 35 (Medium)

Risk levels are mapped exclusively from the final fused score:
- 0-30: Low
- 31-60: Medium
- 61-80: High
- 81-100: Critical

---

## System Flow

```
+---------------------------------------------------------------------+
|                         USER INPUT                                  |
|              (SMS / WhatsApp / Call Transcript / Voice)              |
+---------------------------------------------------------------------+
                                |
                                v
+---------------------------------------------------------------------+
|                      INPUT SANITIZATION                             |
|              (Length validation, rate limiting)                      |
+---------------------------------------------------------------------+
                                |
               +----------------+----------------+
               |                |                |
               v                v                v
   +-----------+--+  +---------+------+  +------+---------+
   | RULE ENGINE  |  | AI ENGINE      |  | PSYCH ENGINE   |
   | (Layer 1)    |  | (Layer 2)      |  | (Layer 3)      |
   |              |  |                |  |                |
   | Keywords     |  | BART Zero-Shot |  | Fear           |
   | URL Scan     |  | Classification |  | Urgency        |
   | Compound     |  |                |  | Authority      |
   | Detection    |  | Optional       |  | Manipulation   |
   | Social Imp.  |  | Offline OK     |  | Coercion       |
   +-----------+--+  +---------+------+  +------+---------+
               |                |                |
               v                v                v
+---------------------------------------------------------------------+
|                      FUSION ENGINE                                  |
|         rule*0.45 + ai*0.30 + psych*0.25                           |
|         + Post-fusion floors + Profile adjustment                   |
+---------------------------------------------------------------------+
                                |
                                v
+---------------------------------------------------------------------+
|                     FINAL ASSESSMENT                                |
|    Score (0-100) | Risk Level | Agreement | Highlights              |
+---------------------------------------------------------------------+
                                |
               +----------------+----------------+
               |                |                |
               v                v                v
   +-----------+--+  +---------+------+  +------+---------+
   | SAFETY TIPS  |  | PDF REPORT     |  | DATABASE       |
   | (Education)  |  | (ReportLab)    |  | (SQLite)       |
   +--------------+  +----------------+  +----------------+
                                |
                                v
+---------------------------------------------------------------------+
|                     FRONTEND DISPLAY                                |
|    Risk Gauge | Highlights | Tabs | Dashboard | Simulator           |
+---------------------------------------------------------------------+
```

---

## Core Detection Layers

### Rule Engine — Deterministic Pattern Matching

| Category                | Weight | Language Support    |
|-------------------------|--------|---------------------|
| Urgency                 | 12     | English, Hindi      |
| Fear                    | 14     | English, Hindi      |
| OTP / Credential        | 18     | English, Hindi      |
| Personal Data           | 15     | English             |
| Authority Impersonation | 16     | English, Hindi      |
| Reward / Lottery        | 10     | English, Hindi      |
| KYC Scam                | 14     | English             |
| Financial Data Request  | 16     | English (compound)  |
| Social Impersonation    | 20     | English, Hindi      |
| Dynamic Urgency         | 10     | Regex-based         |
| Call Transcript          | 14     | English             |
| Suspicious URL          | Var.   | Pattern-based       |

### AI Engine — Semantic Classification

- Model: facebook/bart-large-mnli (zero-shot)
- No fine-tuning required
- Candidate labels: fraud, scam, phishing, legitimate, informational
- Returns: probability, confidence, label
- Fully optional — system operates without it

### Psychology Classifier — Manipulation Detection

| Tactic               | Target Emotion | Detection Method         |
|----------------------|----------------|--------------------------|
| Fear                 | Anxiety        | Keyword + context        |
| Urgency              | Panic          | Keyword + regex          |
| Authority            | Trust          | Institution name matching|
| Financial Pressure   | Loss aversion  | Loss-indicator compound  |
| Financial Coercion   | Obligation     | Action-demand compound   |
| Emotional Manipulation| Love/Concern  | Family keyword compound  |
| Reward               | Greed          | Prize/offer keywords     |
| Scarcity             | FOMO           | Limited-availability     |

---

## Feature Breakdown

### Detection and Analysis
- Three-layer independent analysis (Rule, AI, Psychology)
- Context-aware financial detection with false-positive prevention
- Social impersonation compound detection
- Dynamic urgency regex (e.g., "within 24 hours", "by tomorrow")
- Suspicious URL scanner (typosquatting, non-HTTPS, suspicious TLDs)
- OTP and credential harvesting detection
- KYC fraud pattern recognition
- Call transcript scam detection
- Hindi and Hinglish language support

### Explainability
- Phrase-level highlighting with category labels
- Interactive hover tooltips on flagged phrases
- Structured psychological tactic breakdowns
- "Why This Was Flagged" plain-language summary
- Agreement indicator (Rule-Dominant, AI-Dominant, Balanced)

### User Experience
- Premium cyber-intelligence UI aesthetic
- Profile-based risk adaptation (General, Student, Elderly, Business)
- Voice input with speech recognition
- Batch message analysis mode
- Sequential loading animation during analysis
- Animated risk gauge with score counter
- Tabbed deep-analysis panels (Overview, Highlights, Psychology, URLs, Actions)
- Smooth scroll-to-results after analysis

### Intelligence Dashboard
- Aggregate risk distribution visualization
- Trend narrative generation
- Analysis history with search and filter
- Expandable row detail view
- Risk-level and profile filtering

### Scam Simulation Lab
- Seven interactive fraud scenarios
- Step-by-step manipulation progression
- Live risk score escalation display
- Active psychological tactic tracking
- Intervention mode with breaking-point identification
- Prevention checklists per scenario
- Direct integration with Analyzer ("Test This Scenario")

### Reporting
- PDF intelligence report generation
- Dark-themed enterprise report layout
- Risk gauge, category badges, safety recommendations
- Downloadable from analysis results

### Infrastructure
- Offline-capable architecture (AI optional)
- No authentication required
- No external API calls
- Rate limiting (100 requests/minute)
- Input length validation
- SQLite persistence
- Modular backend design

---

## Technology Stack

### Backend

| Component       | Technology                                |
|-----------------|-------------------------------------------|
| Framework       | FastAPI (Python 3.10+)                    |
| Database        | SQLite3 (zero-config persistence)          |
| AI Model        | HuggingFace Transformers (BART-large-MNLI)|
| PDF Generation  | FPDF2                                      |
| URL Analysis    | Custom scanner (regex + heuristic)        |
| Rate Limiting   | SlowAPI                                    |
| CORS            | FastAPI CORSMiddleware                    |

### Frontend

| Component       | Technology                                |
|-----------------|-------------------------------------------|
| Framework       | Next.js 14 (App Router)                   |
| Styling         | Tailwind CSS v3                           |
| Charts          | Recharts                                  |
| Routing         | Next.js file-based routing                |
| State           | React useState/useEffect                  |
| Speech          | Web Speech API                            |

---

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher
- Git

### Backend Setup

```bash
git clone https://github.com/vishalbg02/SurakshaAI.git
cd SurakshaAI/backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

python main.py
```

The backend server starts at `http://localhost:8000`.

On first run, the BART model (~1.6 GB) is downloaded from HuggingFace. Subsequent runs use the cached model. If the model download fails or is skipped, the system operates in rule-only mode.

### Frontend Setup

```bash
cd SurakshaAI/frontend

npm install

npm run dev
```

The frontend starts at `http://localhost:3000`.

### Environment Notes

- No environment variables are required.
- No API keys are needed.
- No database setup is needed (SQLite auto-creates).
- No Docker configuration is required (though compatible).

---

## API Reference

### POST /analyze

Analyze a single message.

**Request Body:**
```json
{
  "message": "Your SBI account has been blocked. Click http://sbi-update.in",
  "profile": "general",
  "ai_enabled": true
}
```

**Response:** Full analysis object containing rule_analysis, ai_analysis, psych_analysis, profile_adjustment, final_assessment, safety_tips, and highlights.

### POST /analyze/batch

Analyze multiple messages in a single request.

**Request Body:**
```json
{
  "messages": "Message 1\nMessage 2\nMessage 3",
  "profile": "general",
  "ai_enabled": true
}
```

**Response:** Array of analysis results for each message.

### GET /trends

Retrieve aggregate analytics.

**Response:** Risk distribution, most common scam category, most common psychological trigger.

### GET /history

Retrieve analysis history.

**Query Parameters:** `limit` (default 50)

**Response:** Array of past analysis results.

### GET /report/{analysis_id}

Download a PDF intelligence report for a specific analysis.

**Response:** PDF file download.

---

## Sample Test Cases

### Test Case 1: Bank KYC Phishing (Expected: Critical)

**Input:**
```
Dear customer, your SBI account has been blocked due to KYC expiry.
Share OTP and click http://sbi-kyc-update.in to verify immediately
or account will be permanently closed within 24 hours.
```

**Expected Behavior:**
- Rule engine detects: authority_impersonation, kyc_scam, otp, urgency, dynamic_urgency, suspicious_url
- Psychology detects: Fear, Urgency, Authority
- OTP + URL override activates: final score >= 90
- Risk level: Critical
- Highlights: "SBI", "blocked", "KYC expiry", "OTP", URL, "immediately", "permanently closed", "within 24 hours"

### Test Case 2: Family Impersonation with Money Request (Expected: High)

**Input:**
```
Hi Dad I lost my phone this is my new number send 10000 urgently
```

**Expected Behavior:**
- Rule engine detects: social_impersonation (family + new number + money + urgency)
- has_money_request: true
- Post-fusion floor: final score >= 65
- Risk level: High
- Psychology detects: Emotional Manipulation, Urgency

### Test Case 3: Legitimate Vendor Payment (Expected: Low)

**Input:**
```
We have processed your vendor payment successfully. No further action is required.
```

**Expected Behavior:**
- Negative-intent suppression activates ("successfully", "no further action required")
- No action verbs detected
- financial_data_request NOT triggered
- Rule score: 0
- Final score: 0
- Risk level: Low

### Test Case 4: Refund Phishing (Expected: High)

**Input:**
```
Your refund could not be processed. Confirm your bank details within 6 hours to avoid cancellation.
```

**Expected Behavior:**
- Context-aware financial detection: "refund" + "confirm" (action verb) + "within 6 hours" (dynamic urgency) + "avoid cancellation" (action verb)
- financial_data_request triggered
- Financial + urgency floor: raw score >= 37
- Risk level: High
- Psychology detects: Financial Pressure, Urgency

### Test Case 5: Government Threat Scam (Expected: Critical)

**Input:**
```
This is Inspector Sharma from Delhi Cyber Cell. Your Aadhaar has been used for money laundering.
FIR CBI-2024-4829 registered. Transfer 150000 to verification account immediately or arrest warrant will be issued.
```

**Expected Behavior:**
- Rule engine detects: authority_impersonation, fear, personal_data, urgency
- has_money_request: true
- Psychology detects: Authority, Fear, Urgency, Financial Pressure
- Final score: 80-95
- Risk level: High or Critical

---

## Performance Considerations

### Latency

- Rule engine: < 5ms per message (deterministic pattern matching)
- Psychology classifier: < 3ms per message (pattern matching)
- AI engine: 200-800ms per message (BART inference, GPU accelerated if available)
- Total with AI: < 1 second per message
- Total without AI: < 10ms per message

### Memory

- Rule engine: negligible (regex compilation cached)
- AI model: approximately 1.6 GB RAM (BART-large-MNLI)
- SQLite: minimal (file-based, no server process)
- Frontend: standard Next.js memory footprint

### Optimization

- Regex patterns are compiled once and cached in a dictionary
- AI model is loaded once at startup, not per-request
- Word-boundary matching prevents redundant full-text scans
- URL scanner uses early-exit on first suspicious pattern match
- Dynamic urgency detection breaks on first regex match (single-hit)
- Highlights use a seen-ranges set to prevent duplicate entries

---

## Scalability

### Current Architecture

SurakshaAI is designed as a single-instance application suitable for individual use, demonstrations, and small-scale deployments. SQLite provides zero-configuration persistence adequate for thousands of analyses.

### Scaling Considerations

| Dimension         | Current            | Scalable Alternative                          |
|-------------------|--------------------|-----------------------------------------------|
| Database          | SQLite             | PostgreSQL with connection pooling             |
| AI Inference      | Single-process     | GPU-accelerated inference server (TorchServe)  |
| API Layer         | Single FastAPI     | Horizontal scaling behind load balancer        |
| Batch Processing  | Sequential         | Async task queue (Celery + Redis)              |
| Model             | BART-large (1.6GB) | Distilled model or API-served inference        |
| Storage           | Local filesystem    | Cloud object storage for reports               |

### Production Path

1. Replace SQLite with PostgreSQL for concurrent write safety
2. Deploy AI inference as a separate microservice
3. Add Redis for rate limiting and session caching
4. Implement async batch processing for high-volume analysis
5. Add monitoring and alerting (Prometheus + Grafana)

---

## Security

See [SECURITY.md](SECURITY.md) for the complete security design document.

Key principles:
- No user authentication required (reduces attack surface)
- No external API calls (no data leaves the machine)
- Input sanitization and length validation on all endpoints
- Rate limiting (100 requests/minute per IP)
- SQLite with parameterized queries (SQL injection prevention)
- No PII storage beyond the analyzed message text
- AI model runs locally (no cloud inference)

---

## Impact and Future Scope

### Current Impact

- Provides free, accessible fraud detection for any Indian user
- Educates users on manipulation tactics through explainability and simulation
- Functions without internet, reaching users in low-connectivity areas
- No login barrier eliminates adoption friction

### Future Development

- **Regional language expansion**: Tamil, Telugu, Bengali, Marathi keyword dictionaries
- **Browser extension**: Real-time SMS and WhatsApp Web scanning
- **Community reporting**: Crowd-sourced scam message database with anonymization
- **Model fine-tuning**: Custom fraud classifier trained on Indian scam datasets
- **WhatsApp Business API integration**: Direct message scanning for businesses
- **Telecom API partnerships**: Carrier-level integration for pre-delivery filtering
- **Audio analysis**: Direct audio file transcription and analysis
- **Image OCR**: Screenshot-based scam message extraction and analysis

---

## Why SurakshaAI Is Different

| Dimension                  | Generic AI Spam Detector       | SurakshaAI                                     |
|----------------------------|--------------------------------|------------------------------------------------|
| Explainability             | Binary verdict (spam/not spam) | Phrase-level highlighting with category labels  |
| Psychological analysis     | None                           | 8-tactic manipulation profiling                |
| Social impersonation       | None                           | Compound detection (family + money + urgency)  |
| False positive prevention  | High on financial messages     | Context-aware compound logic with suppression  |
| Internet dependency        | Required                       | Optional (AI enhances, never gates)            |
| Cost                       | Per-request API cost           | Completely free                                |
| Privacy                    | Data sent to external servers  | All processing local                           |
| Indian context             | Generic training data          | Purpose-built for Indian scam patterns         |
| User education             | None                           | Scam Simulator with 7 interactive scenarios    |
| Authentication             | Required                       | None (reduces barrier and attack surface)      |

SurakshaAI is not a spam filter. It is a fraud intelligence engine that explains why a message is dangerous, what psychological tactics are being used, and what the user should do about it.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Built for the Indian digital ecosystem. Built to explain, not just classify.
