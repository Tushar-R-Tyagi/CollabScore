<table>
<tr>
<td>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=3B82F6&center=false&vCenter=true&width=600&lines=AI+Orchestration+Evaluator;Debug+with+AI+not+for+AI;Measure+collaboration+not+just+code" alt="Typing SVG" />

</td>
</tr>
</table>

A prototype demonstrating how to evaluate a developer's ability to **orchestrate AI agents** — not just write code. Built for HackerRank's shift from Leetcode-style puzzles to real-world AI collaboration assessment.

## The Problem

A billing system has a production bug: Family plan users with over 12 months tenure aren't receiving their 15% loyalty discount. The candidate must debug a 4-file Python codebase using an AI agent in a three-panel IDE.

## The Bugs

Two issues are hidden in the codebase without comments or hints:

1. **Case sensitivity** (`discounts.py`): Discount check compares `plan == "family"` but the actual plan ID in `plans.py` is `"FAMILY"`
2. **Silent exception handling** (`billing.py`): `except Exception` catches all errors and returns `None`, masking failures in production

## What Gets Evaluated

| Dimension | What It Measures |
|-----------|-----------------|
| Discovery | How the candidate explores the codebase (agent prompts vs direct browsing) |
| Diagnosis | Whether they run tests and verify hypotheses |
| Task Allocation | Balance between delegating to AI and writing code directly |
| Verification | Whether they review, accept, or reject AI suggestions |
| Speed | Time to ship the fix |

## Tech Stack

- **Frontend**: Next.js + TypeScript + Monaco Editor + Tailwind CSS
- **Backend**: Flask (Python)
- **AI Agent**: Groq API (OpenAI-compatible) with Llama 3.3 70B
- **Event Logging**: In-memory JSON store tracking every action

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Groq API key ([console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
pip install -r requirements.txt
```
### Create backend/.env:
```txt
GROQ_API_KEY=gsk_your_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### Run:
```bash
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

### Architecture
```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  ┌──────────┬──────────────┬────────────────┐   │
│  │ File     │  Monaco      │  AI Agent      │   │
│  │ Tree     │  Editor      │  Chat          │   │
│  └──────────┴──────────────┴────────────────┘   │
│                    │                            │
│              Event Logger (JS)                  │
└────────────────────┬────────────────────────────┘
                     │ HTTP
┌────────────────────▼─────────────────────────────┐
│              Flask Backend                       │
│  ┌─────────────┬────────────┬────────────────┐   │
│  │ /api/files  │ /api/agent │ /api/evaluate  │   │
│  │             │   /chat    │                │   │
│  └─────────────┴────────────┴────────────────┘   │
│                     │                            │
│              Event Store (in-memory)             │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              Groq API                            │
│         (Llama 3.3 70B Versatile)                │
└──────────────────────────────────────────────────┘

```

### Project Structure
```
hackerrank-agent-assessment/
├── backend/
│   ├── app.py                    # Flask server
│   ├── requirements.txt
│   ├── .env
│   └── billing_module/
│       ├── __init__.py
│       ├── plans.py              # Plan definitions (FAMILY is uppercase)
│       ├── billing.py            # Billing logic (silent exception bug)
│       ├── discounts.py           # Discount logic (case sensitivity bug)
│       └── tests/
│           ├── __init__.py
│           └── test_billing.py   # Existing tests (incomplete)
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx           # Main three-panel layout
        │   ├── layout.tsx
        │   └── globals.css
        ├── components/
        │   ├── FileTree.tsx       # Left panel
        │   ├── CodeEditor.tsx     # Center panel (Monaco)
        │   ├── AgentChat.tsx      # Right panel (AI chat)
        │   └── EvaluationDashboard.tsx  # Post-ship results
        └── lib/
            └── api.ts             # API client
```

### Author

Tushar Tyagi
