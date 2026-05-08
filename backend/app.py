import sys
import os
import json
import uuid
import datetime

# Add backend directory to Python path so billing_module works
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

app = Flask(__name__)
CORS(app)

# In-memory storage for events (single user demo)
events = []

# Context about the codebase for the AI agent
CODEBASE_CONTEXT = """
This is a billing system for a SaaS product. The system has three plans:
- Basic: $10/unit
- Professional: $25/unit  
- FAMILY: $40/unit

The system should apply loyalty discounts:
- Family plan users with >12 months tenure get 15% off
- Professional plan users with >24 months tenure get 10% off

The candidate is debugging a production issue where Family plan users aren't receiving their loyalty discounts.
"""

AGENT_SYSTEM_PROMPT = f"""You are a junior developer assistant helping debug a billing system. You have access to the codebase and can suggest changes.

Your personality:
- You're helpful but not all-knowing
- You explain your reasoning clearly
- You only make changes when asked
- You output code diffs when proposing changes
- You sometimes miss edge cases or make assumptions

The codebase context:
{CODEBASE_CONTEXT}

When responding:
1. If asked to investigate, explain what you're looking at
2. If asked to fix something, propose a specific diff
3. If asked to write tests, provide test code
4. Always explain why you're suggesting a change

Be concise but thorough. Don't write essays."""


def read_billing_module():
    """Read all Python files from the billing_module directory."""
    files = {}
    base_path = os.path.join(os.path.dirname(__file__), 'billing_module')

    for root, dirs, filenames in os.walk(base_path):
        for filename in filenames:
            if filename.endswith('.py'):
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, base_path)
                with open(full_path, 'r') as f:
                    files[relative_path] = f.read()

    return files


@app.route('/api/files', methods=['GET'])
def get_files():
    """Return all files in the billing module."""
    files = read_billing_module()
    return jsonify({"files": files})


@app.route('/api/agent/chat', methods=['POST'])
def agent_chat():
    """Handle chat messages with the AI agent."""
    data = request.json
    user_message = data.get('message', '')
    current_code = data.get('current_code', {})

    event = {
        "id": str(uuid.uuid4()),
        "type": "agent_prompt",
        "timestamp": datetime.datetime.now().isoformat(),
        "data": {"message": user_message}
    }
    events.append(event)

    code_context = "\n\nCurrent codebase state:\n"
    for filename, content in current_code.items():
        code_context += f"# {filename}\n{content}\n\n"

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": f"Working with the following code:{code_context}\n\nUser request: {user_message}"}
            ],
            temperature=0.7
        )

        agent_response = response.choices[0].message.content

        reply_event = {
            "id": str(uuid.uuid4()),
            "type": "agent_response",
            "timestamp": datetime.datetime.now().isoformat(),
            "data": {"message": agent_response}
        }
        events.append(reply_event)

        return jsonify({
            "message": agent_response,
            "event_id": reply_event["id"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/events/log', methods=['POST'])
def log_event():
    """Log a frontend event."""
    data = request.json
    event = {
        "id": str(uuid.uuid4()),
        "type": data.get('type'),
        "timestamp": datetime.datetime.now().isoformat(),
        "data": data.get('data', {})
    }
    events.append(event)
    return jsonify({"event_id": event["id"]})


@app.route('/api/events/all', methods=['GET'])
def get_all_events():
    """Return all logged events for evaluation."""
    return jsonify({"events": events})


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """Generate evaluation dashboard data from events."""
    data = request.json
    final_code = data.get('final_code', {})

    event_counts = {}
    for event in events:
        event_type = event['type']
        if event_type not in event_counts:
            event_counts[event_type] = 0
        event_counts[event_type] += 1

    agent_prompts = event_counts.get('agent_prompt', 0)
    direct_edits = event_counts.get('code_edit', 0)
    agent_diffs_accepted = event_counts.get('agent_diff_accepted', 0)
    agent_diffs_rejected = event_counts.get('agent_diff_rejected', 0)
    test_runs = event_counts.get('test_run', 0)

    discovery_score = min(100, (agent_prompts * 20) + (direct_edits * 10))
    diagnosis_score = min(100, test_runs * 25)

    total_actions = agent_prompts + direct_edits
    if total_actions > 0:
        agent_ratio = agent_prompts / total_actions
        if 0.4 <= agent_ratio <= 0.6:
            allocation_score = 100
        elif 0.2 <= agent_ratio <= 0.8:
            allocation_score = 80
        else:
            allocation_score = 60
    else:
        allocation_score = 0

    verification_score = min(100, (agent_diffs_accepted * 30))
    if agent_diffs_rejected > 0:
        verification_score += 20

    task_complete = event_counts.get('task_complete', 0) > 0
    speed_score = 100 if task_complete else 50

    bugs_fixed = check_bug_fixes(final_code)

    evaluation = {
        "scores": {
            "discovery": min(100, discovery_score),
            "diagnosis": min(100, diagnosis_score),
            "task_allocation": allocation_score,
            "verification": min(100, verification_score),
            "speed": speed_score
        },
        "bugs_fixed": bugs_fixed,
        "statistics": {
            "total_events": len(events),
            "agent_interactions": agent_prompts,
            "direct_code_edits": direct_edits,
            "agent_suggestions_accepted": agent_diffs_accepted,
            "agent_suggestions_rejected": agent_diffs_rejected,
            "test_runs": test_runs
        },
        "timeline": [{
            "id": e["id"],
            "type": e["type"],
            "timestamp": e["timestamp"],
            "summary": e.get("data", {}).get("message", "")[:100] if e["type"] in ["agent_prompt", "agent_response"] else e["type"]
        } for e in events]
    }

    return jsonify(evaluation)


def check_bug_fixes(code):
    """Basic check if bugs appear to be fixed."""
    bugs = {
        "silent_exception": False,
        "case_sensitivity": False,
        "test_coverage": False
    }

    billing_code = code.get("billing.py", "")
    discounts_code = code.get("discounts.py", "")
    test_code = code.get("tests/test_billing.py", "")

    if "except Exception" in billing_code:
        if "raise" in billing_code.split("except Exception")[1][:200]:
            bugs["silent_exception"] = True
    else:
        bugs["silent_exception"] = True

    if "FAMILY" in discounts_code or "upper()" in discounts_code or "lower()" in discounts_code:
        bugs["case_sensitivity"] = True

    if "family" in test_code.lower() or "FAMILY" in test_code:
        bugs["test_coverage"] = True

    return bugs


if __name__ == '__main__':
    app.run(debug=True, port=5000)