<div align="left">

<img src="https://raw.githubusercontent.com/Tushar-R-Tyagi/hackerrank-agent-assessment/main/assets/banner.png" alt="banner" width="100%">

<br />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=3B82F6&center=true&vCenter=true&width=600&lines=%E2%9A%A1+AI+Orchestration+Evaluator;%F0%9F%A7%A0+Debug+with+AI%2C+not+for+AI;%F0%9F%8E%AF+Measure+collaboration%2C+not+just+code" alt="Typing SVG" />

<br />


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
