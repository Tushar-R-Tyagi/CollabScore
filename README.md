<div align="center">
<pre>
 ██████╗ ██████╗ ██╗     ██╗      █████╗ ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██║     ██║     ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║     ██║     ███████║██████╔╝███████╗██║     ██║   ██║██████╔╝█████╗  
██║     ██║   ██║██║     ██║     ██╔══██║██╔══██╗╚════██║██║     ██║   ██║██╔══██╗██╔══╝  
╚██████╗╚██████╔╝███████╗███████╗██║  ██║██████╔╝███████║╚██████╗╚██████╔╝██║  ██║███████╗
 ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
                                                                                          
</pre>
</div>

                                                                                                    


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

## 📐 How Scoring Works

The evaluation uses a transparent, tunable mathematical model with five dimensions. Every score is traceable to specific candidate behaviors — nothing is a black box.

### The Five Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| **Discovery** | 20% | Did they explore the problem space before acting? |
| **Diagnosis** | 25% | Did they verify hypotheses and find root causes? |
| **Task Allocation** | 20% | Did they balance AI delegation with hands-on coding? |
| **Verification** | 25% | Did they review AI output critically or blindly accept it? |
| **Speed** | 10% | Completion quality relative to time invested |

### Discovery (Weight: 0.20)
agent_ratio = agent_prompts / (agent_prompts + direct_code_edits)

if ratio < 0.1: score = 20 (ignored available AI)
if ratio > 0.9: score = 15 (outsourced everything)
else:
deviation = |ratio - 0.5|
score = 100 × (1 - deviation × 2.5)

```

- Sweet spot: 40-60% of actions delegated to AI
- Too much AI reliance = 15 (outsourcing)
- Too little AI use = 20 (not leveraging available tools)
- Quality penalty: if agent output was accepted but tests failed, subtract 25

```

### Verification (Weight: 0.25)
rejection_rate = rejected / (accepted + rejected)

if never_used_suggestions: score = 50 (neutral)
if accepted_all_blindly: score = 15 (dangerous trust)
if rejected_most: score = 40 (too skeptical)

else:
score = 100 × rejection_rate / 0.25
score += 15 × min(1.0, edits_after_acceptance / 2)
score += 20 × caught_hallucination
cap at 100
- Heaviest weight (25%) — verification is the hardest AI skill to teach
- Blind acceptance of all agent suggestions = 15
- Bonus for improving agent code after accepting it
- Major bonus (+20) for catching fabricated code

### Speed (Weight: 0.10)
completion = bugs_fixed / 2
time_efficiency = max(0, 1 - (time_spent - 300) / 900)
quality_penalty = 0.5 if introduced_new_bugs else 1.0

speed = 100 × completion × time_efficiency × quality_penalty

- Not about raw speed — about completion quality per unit time
- Sweet spot: 5-20 minutes
- Introduces a quality penalty if the candidate's "fixes" created new problems
- Lowest weight because speed without verification is dangerous

### Composite Score
composite = 0.20(discovery) + 0.25(diagnosis) + 0.20(allocation) + 0.25(verification) + 0.10(speed)


### Hallucination Detection

The agent is deliberately calibrated to occasionally fabricate solutions (e.g., inventing a `users.py` module that doesn't exist). The system:

1. Scans agent responses for known hallucination patterns
2. Checks final code for hallucinated imports
3. Scores Verification based on whether the candidate caught it

A candidate who blindly accepts hallucinated code gets:
- Verification capped at 15
- Diagnosis multiplied by 0.3
- Composite severely impacted

### Why These Weights?

- **Verification and Diagnosis are heaviest (25% each)** — over-reliance on AI is the dominant failure mode. Studies on clinical AI show users accept incorrect AI suggestions 15-30% of the time when they appear plausible.
- **Discovery and Allocation tie at 20%** — systematic exploration and balanced delegation are equally important.
- **Speed is lightest (10%)** — hiring for speed encourages the wrong behavior with AI. A fast but careless orchestrator is worse than a slow but thorough one.

### Tunability

All weights, thresholds, and penalty factors are declared as constants and can be adjusted per role:

```python
WEIGHTS = {
    "discovery": 0.20,
    "diagnosis": 0.25,
    "task_allocation": 0.20,
    "verification": 0.25,
    "speed": 0.10
}

SWEET_SPOT_RATIO = 0.5      # Ideal agent/human balance
HALLUCINATION_PENALTY = 0.3  # Multiplier for accepting fake code
TIME_SWEET_SPOT = 300        # Seconds (5 minutes)
```
For a senior role, Verification weight might increase to 0.30. For a junior role, Discovery might be weighted higher.

### Evidence Basis
The dimensions and weights draw from:

- Bloom's Taxonomy: Discovery (Analyze) → Diagnosis (Evaluate) → Verification (Evaluate) map to higher-order cognitive skills

- Human-AI Teaming research (Seeber et al., 2020): Identifies over-reliance, under-reliance, and misuse as the three failure modes in AI collaboration

- Dual-Process Theory (Kahneman): Rewards System 2 thinking (verification, testing) over System 1 (quick acceptance of plausible AI output)

The exact thresholds need calibration against real candidate data. This prototype is an assessment platform, not a finished assessment. The math is transparent so hiring managers can tune it to what matters for their roles.

## Future Directions

These are features this prototype points toward but doesn't implement. They're listed here to show the product thinking beyond the demo.

### Multiple Scenarios

The prototype uses one hardcoded bug scenario. A real platform would support a library of tasks — security vulnerabilities, performance issues, architectural refactors, each with configurable difficulty and AI behavior calibration.

### Configurable Scoring Weights

Different roles need different evaluation profiles. A senior architect might weight Verification higher (0.30) while a junior developer might weight Discovery higher (0.25). All weights are already declared as constants — making them configurable per role is a UI task, not an architecture change.

### Multi-Agent Scenarios

Future assessments could involve multiple AI agents with different roles (code reviewer, security auditor, product manager) — testing whether candidates can orchestrate a team of agents, not just one.

### Generalist vs. Memorizer Detection

The same event-logging architecture could detect when candidates hardcode solutions to known test cases rather than building general solutions. A "Perturbation Check" would silently run candidate code on a slightly modified dataset — if scores plummet, the candidate was memorizing, not solving.

### Communication Style Analysis

The event log captures candidate prompts verbatim. A future version could analyze whether confident, fast-moving language correlates with worse verification behavior, surfacing candidates who sound competent but skip critical review steps.


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
