# Security Design

## Overview

SurakshaAI is designed with a security-first architecture that minimizes attack surface, eliminates external data dependencies, and ensures user privacy by default.

---

## Privacy by Design

### No Data Leaves the Machine

All processing occurs locally:

- The rule engine operates on in-memory pattern matching.
- The AI model (BART-large-MNLI) runs locally via HuggingFace Transformers. No API calls are made to external inference services.
- The psychology classifier is a deterministic local module.
- PDF reports are generated and stored on the local filesystem.
- The SQLite database resides on the local filesystem.

At no point during analysis does any user data leave the host machine. There are no analytics beacons, telemetry endpoints, or third-party service integrations.

### No External API Dependency

SurakshaAI does not call:
- OpenAI API
- Google Cloud API
- AWS services
- Any external NLP or classification service
- Any analytics or tracking service

The HuggingFace model is downloaded once during initial setup and cached locally. Subsequent runs use the local cache with no network calls.

---

## No Authentication

SurakshaAI deliberately does not implement user authentication. This is a security design decision, not an omission.

Rationale:
- **Reduced attack surface**: No password storage, no session management, no token handling, no OAuth flows. Each of these introduces vulnerability classes (credential stuffing, session hijacking, token theft) that are entirely eliminated.
- **No PII collection**: Without accounts, there are no email addresses, names, or credentials stored. The only data persisted is the analyzed message text and its computed scores.
- **Accessibility**: Authentication creates adoption friction. The target users — individuals receiving suspicious messages — need immediate access without registration barriers.

---

## Input Sanitization

### Message Length Validation

All incoming messages are validated for length before processing:
- Minimum length: 1 character (empty messages rejected)
- Maximum length: 5000 characters (prevents memory abuse)
- Batch mode: Maximum messages per batch enforced

### Text Processing Safety

- All keyword matching uses compiled regex with word boundaries, preventing ReDoS (Regular Expression Denial of Service) attacks
- No `eval()`, `exec()`, or dynamic code execution on user input
- No shell command construction from user input
- URL extraction uses pattern matching only — URLs are never fetched, loaded, or resolved

---

## Rate Limiting

API endpoints are protected by rate limiting:
- 100 requests per minute per IP address
- Implemented via SlowAPI middleware
- Prevents automated abuse and resource exhaustion
- Returns HTTP 429 with retry-after header on limit breach

---

## Database Security

### SQLite Configuration

- Parameterized queries for all database operations (prevents SQL injection)
- Database file created with default filesystem permissions
- No network-accessible database server (SQLite is file-based)
- No database authentication required (single-user local access model)
- Auto-created on first run — no manual schema migration required

### Stored Data

The database stores:
- Analyzed message text
- Computed scores (rule, AI, psych, final)
- Risk level classification
- Profile used
- Detected categories
- Timestamp

It does not store:
- IP addresses
- User identifiers
- Browser fingerprints
- Session tokens
- Geographic data

---

## AI Model Security

### Local Inference

The BART-large-MNLI model runs entirely locally via PyTorch. No inference requests are sent to external services.

### Model Integrity

The model is downloaded from HuggingFace's official model hub with checksum verification (handled by the HuggingFace library). The model files are cached in the standard HuggingFace cache directory.

### Graceful Degradation

If the AI model fails to load (corrupted cache, insufficient memory, missing dependencies), the system continues operating with rule-based and psychological detection only. The AI weight is redistributed rather than causing a system failure.

---

## Ethical AI Usage

### Transparency

- Every detection decision is explainable. The system shows which phrases triggered which categories and why.
- The AI probability and confidence scores are displayed alongside the rule engine score — users can see both independent assessments.
- The agreement indicator explicitly shows whether the rule engine and AI agree or diverge.

### No Automated Action

SurakshaAI provides intelligence and recommendations. It does not:
- Block messages
- Delete content
- Report to authorities
- Take any automated action on behalf of the user

The user always retains full decision-making authority.

### Bias Mitigation

- The rule engine uses explicitly defined keywords — detection logic is auditable and modifiable.
- The zero-shot AI model was not fine-tuned on Indian data, reducing the risk of encoding cultural biases from training data.
- Context-aware financial detection prevents false positives on legitimate banking communications.

---

## CORS Configuration

The backend configures CORS to allow requests from the frontend origin (localhost:3000 in development). In production, this should be restricted to the specific frontend domain.

---

## Threat Model Summary

| Threat                     | Mitigation                                              |
|----------------------------|---------------------------------------------------------|
| SQL Injection              | Parameterized queries                                    |
| ReDoS                      | Pre-compiled regex, bounded pattern complexity           |
| Data exfiltration          | No external API calls, all processing local              |
| Credential theft           | No credentials stored (no authentication)                |
| Session hijacking          | No sessions                                              |
| API abuse                  | Rate limiting (100 req/min)                              |
| Input overflow             | Length validation (5000 char max)                        |
| Model tampering            | HuggingFace checksum verification                       |
| Privacy violation          | No PII collection, no tracking, no analytics             |