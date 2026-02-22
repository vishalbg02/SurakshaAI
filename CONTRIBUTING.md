# Contributing to SurakshaAI

Thank you for your interest in contributing to SurakshaAI. This document provides guidelines for contributing to the project.

---

## Code of Conduct

Contributors are expected to maintain a professional and respectful environment. Harassment, discrimination, and disruptive behavior will not be tolerated.

---

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates.
2. Use a clear, descriptive title.
3. Include:
   - Steps to reproduce the issue
   - Expected behavior
   - Actual behavior
   - Input message that triggered the issue (if applicable)
   - Browser and OS information (for frontend issues)
   - Python version (for backend issues)

### Suggesting Features

1. Open an issue with the "enhancement" label.
2. Describe the feature, its purpose, and expected behavior.
3. Explain how it fits within the existing architecture.

### Submitting Code

1. Fork the repository from [https://github.com/vishalbg02/SurakshaAI](https://github.com/vishalbg02/SurakshaAI).
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the coding standards below.
4. Test your changes thoroughly.
5. Commit with clear, descriptive messages:
   ```bash
   git commit -m "Add context-aware financial detection for vendor payment scams"
   ```
6. Push to your fork and open a pull request.

---

## Coding Standards

### Backend (Python)

- Python 3.10+ syntax
- Type hints on all function signatures
- Docstrings on all public functions
- Word-boundary regex for all keyword matching (no substring matching)
- No `eval()`, `exec()`, or dynamic code execution
- Parameterized queries for all database operations
- Test cases documented as comment blocks in detection modules

### Frontend (JavaScript/JSX)

- React functional components with hooks
- Tailwind CSS utility classes (no external CSS files per component)
- Custom color tokens from the `cx-*` and `risk-*` namespaces
- Self-contained page components (sub-components defined in the same file)
- No external UI component libraries

### General

- No hardcoded credentials or API keys
- No external API dependencies without explicit justification
- Backward compatibility for all public function signatures
- Existing test cases must continue to pass after changes

---

## Architecture Guidelines

### Adding a New Scam Category

1. Add the keyword list and weight to `SCAM_KEYWORDS` in `rule_engine.py`.
2. Add corresponding psychological tactic patterns to `psych_classifier.py` if applicable.
3. Add a highlight color mapping in `HIGHLIGHT_COLORS` in `workflow.py`.
4. Add test cases as comments at the bottom of `rule_engine.py`.
5. Verify no false positives with neutral messages containing similar vocabulary.

### Adding a New Simulation Scenario

1. Add the scenario object to the `SIMULATIONS` array in `frontend/lib/simulations.js`.
2. Include: id, title, short, icon, description, steps (4-6), bestBreakPoint, breakExplanation, psychology (3 entries), and prevention (immediate, preventive, verification).
3. Add the icon SVG path to the `ICONS` object in `frontend/app/simulator/page.jsx`.

### Modifying Scoring Logic

1. Do not change risk level thresholds (0-30, 31-60, 61-80, 81-100).
2. Do not change fusion weights without documenting the rationale.
3. All floors must be applied post-fusion, not pre-normalisation.
4. Verify all existing test cases pass after changes.
5. Document the change in the module docstring version history.

---

## Pull Request Process

1. Ensure the PR description clearly explains what changed and why.
2. Reference any related issues.
3. Verify the application starts without import errors.
4. Test with at least the five standard test cases from the README.
5. Do not include generated files (reports/, suraksha.db, node_modules/).
6. The PR will be reviewed and merged by a maintainer.

---

## Development Environment

### Backend

```bash
git clone https://github.com/vishalbg02/SurakshaAI.git
cd SurakshaAI/backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd SurakshaAI/frontend
npm install
npm run dev
```

### Testing a Change

After making changes to detection logic, verify with:

```bash
# Start the backend
cd backend && python main.py

# In another terminal, test via curl
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Your test message here", "profile": "general", "ai_enabled": true}'
```

Inspect the response for correct score, risk_level, categories, and flags.