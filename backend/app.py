import sys
import os
import json
import uuid
import datetime
import subprocess
import tempfile
import shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)
CORS(app)

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
)

# In-memory storage for events (single user demo)
events = []
session_start = None

CODEBASE_CONTEXT = """
This is a billing system for a SaaS product. The system has three plans with different price points.
The system calculates totals based on plan selection, quantity, and any applicable discounts.
"""

AGENT_SYSTEM_PROMPT = f"""You are a junior developer assistant. You have access to a codebase and can suggest changes.

Your personality:
- You're helpful but not all-knowing
- You explain your reasoning clearly
- You only make changes when explicitly asked
- You output code diffs when proposing changes
- You sometimes miss edge cases or make assumptions
- You occasionally suggest changes that introduce new problems
- You don't jump to conclusions — you let the user guide the investigation

The codebase context:
{CODEBASE_CONTEXT}

When responding:
1. If asked to investigate, explain what you're looking at — but don't guess the bug unless you see clear evidence
2. If asked to fix something specific, propose a diff
3. If asked to write tests, provide test code
4. Always explain why you're suggesting a change
5. Don't volunteer the root cause unless the user has shown they've found it themselves

Be concise but thorough. Don't write essays."""


def read_billing_module():
    """Read all Python files from the billing_module directory."""
    files = {}
    base_path = os.path.join(os.path.dirname(__file__), 'billing_module')

    for root, dirs, filenames in os.walk(base_path):
        for filename in filenames:
            if filename.endswith('.py') and '__init__' not in filename:
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, base_path)
                with open(full_path, 'r') as f:
                    files[relative_path] = f.read()

    return files


@app.route('/api/session/start', methods=['POST'])
def start_session():
    """Record the start time of the candidate's session."""
    global session_start, events
    session_start = datetime.datetime.now()
    events = []  # Clears events
    print(f"Session started, events cleared. Count: {len(events)}")
    return jsonify({"started": session_start.isoformat()})


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
        import traceback
        print("=== ERROR IN AGENT CHAT ===")
        traceback.print_exc()
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


@app.route('/api/run-tests', methods=['POST'])
def run_tests():
    """Execute the candidate's test file and return results."""
    data = request.json
    current_code = data.get('current_code', {})
    
    tmpdir = tempfile.mkdtemp()
    try:
        for filepath, content in current_code.items():
            if filepath.startswith('tests/') or filepath.startswith('tests\\'):
                tests_dir = os.path.join(tmpdir, 'tests')
                os.makedirs(tests_dir, exist_ok=True)
                filename = os.path.basename(filepath)
                full_path = os.path.join(tests_dir, filename)
            else:
                filename = os.path.basename(filepath)
                full_path = os.path.join(tmpdir, filename)
            
            with open(full_path, 'w') as f:
                f.write(content)
        
        tests_dir = os.path.join(tmpdir, 'tests')
        if os.path.exists(tests_dir):
            init_file = os.path.join(tests_dir, '__init__.py')
            if not os.path.exists(init_file):
                open(init_file, 'a').close()
        
        result = subprocess.run(
            ['python', '-m', 'pytest', 'tests/', '-v', '--tb=short'],
            cwd=tmpdir,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        event = {
            "id": str(uuid.uuid4()),
            "type": "test_run",
            "timestamp": datetime.datetime.now().isoformat(),
            "data": {
                "passed": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }
        }
        events.append(event)
        
        return jsonify({
            "passed": result.returncode == 0,
            "output": result.stdout,
            "errors": result.stderr,
            "event_id": event["id"]
        })
    
    except subprocess.TimeoutExpired:
        return jsonify({"passed": False, "output": "", "errors": "Test execution timed out after 10 seconds"})
    except Exception as e:
        return jsonify({"passed": False, "output": "", "errors": str(e)})
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """Generate evaluation dashboard data from events using defensible scoring model."""
    data = request.json
    final_code = data.get('final_code', {})

    event_counts = {}
    agent_messages = []
    code_edit_files = set()
    agent_diffs_accepted_count = 0
    agent_diffs_rejected_count = 0
    edits_after_accept = 0
    last_accept_time = None
    
    for event in events:
        event_type = event['type']
        event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        if event_type == 'agent_response':
            agent_messages.append(event.get('data', {}).get('message', ''))
        elif event_type == 'code_edit':
            filename = event.get('data', {}).get('filename', '')
            if filename:
                code_edit_files.add(filename)
            if last_accept_time:
                edits_after_accept += 1
        elif event_type == 'agent_diff_accepted':
            agent_diffs_accepted_count += 1
            last_accept_time = event.get('timestamp')
        elif event_type == 'agent_diff_rejected':
            agent_diffs_rejected_count += 1
            last_accept_time = None

    agent_prompts = event_counts.get('agent_prompt', 0)
    direct_edits = event_counts.get('code_edit', 0)
    test_runs = event_counts.get('test_run', 0)
    task_complete = event_counts.get('task_complete', 0) > 0

    # Debug:
    print("=== FINAL CODE KEYS ===")
    for key, value in final_code.items():
        print(f"{key}: {value[:100]}...")
    print("=== END FINAL CODE ===")

    # Detect hallucination
    hallucination_keywords = ['users.py', 'get_user', 'from users import', 'create a new file']
    agent_hallucinated = any(
        any(keyword in msg.lower() for keyword in hallucination_keywords)
        for msg in agent_messages
    )
    
    all_final_code = " ".join(final_code.values())
    hallucinated_code_present = any(
        keyword in all_final_code.lower() for keyword in ['from users import', 'import users']
    )
    hallucination_caught = agent_hallucinated and not hallucinated_code_present

    # Check code quality
    bugs_fixed = check_bug_fixes(final_code)
    bugs_introduced = check_bugs_introduced(final_code)
    
    print("=== BUGS FIXED ===")
    print(bugs_fixed)
    
    B_found = sum(1 for v in bugs_fixed.values() if v)
    total_bugs = 2

    # Calculate time
    global session_start
    T_total = 0
    
    if session_start:
        for event in events:
            if event['type'] == 'task_complete':
                try:
                    end_time = datetime.datetime.fromisoformat(event['timestamp'])
                    T_total = (end_time - session_start).total_seconds()
                except Exception:
                    pass
                break
        
        if T_total == 0 and events:
            try:
                last_ts = events[-1].get('timestamp', '')
                end_time = datetime.datetime.fromisoformat(last_ts)
                T_total = (end_time - session_start).total_seconds()
            except Exception:
                pass
    
    if T_total == 0:
        T_total = 600

    # 1. DISCOVERY
    F = len(code_edit_files)
    P = agent_prompts
    
    exploration_breadth = min(1.0, F / 4)
    prompt_depth = min(1.0, max(0, (P - 1)) / 3)
    patience_factor = min(1.0, T_total / 300)
    
    discovery = 100 * (0.4 * exploration_breadth + 0.4 * prompt_depth + 0.2 * patience_factor)
    discovery = round(discovery)

    # 2. DIAGNOSIS
    R = test_runs
    
    test_rigor = min(1.0, R / 3)
    fix_completeness = B_found / total_bugs if total_bugs > 0 else 0
    skepticism = min(1.0, agent_diffs_rejected_count / 2)
    H_caught = 1.0 if hallucination_caught else 0.0
    
    hallucination_penalty = 0.3 if (agent_hallucinated and not hallucination_caught) else 1.0
    
    diagnosis = 100 * (
        0.3 * test_rigor + 
        0.4 * fix_completeness + 
        0.2 * skepticism + 
        0.1 * H_caught
    ) * hallucination_penalty
    diagnosis = round(min(100, diagnosis))

    # 3. TASK ALLOCATION
    total_actions = agent_prompts + direct_edits
    
    if total_actions == 0:
        allocation = 0
    else:
        agent_ratio = agent_prompts / total_actions
        if agent_ratio < 0.1:
            allocation = 20
        elif agent_ratio > 0.9:
            allocation = 15
        else:
            deviation = abs(agent_ratio - 0.5)
            allocation = 100 * max(0, 1 - deviation * 2.5)
    
    if test_runs > 0 and agent_diffs_accepted_count > 0 and B_found < 2:
        allocation = max(15, allocation - 25)
    
    allocation = round(min(100, allocation))

    # 4. VERIFICATION
    suggestion_total = agent_diffs_accepted_count + agent_diffs_rejected_count
    print(f"DEBUG VERIFICATION: accepted={agent_diffs_accepted_count}, rejected={agent_diffs_rejected_count}, total={suggestion_total}, edits_after_accept={edits_after_accept}")
    
    if suggestion_total == 0:
        verification = 50
    elif agent_diffs_rejected_count == 0 and agent_diffs_accepted_count > 0:
        # Blind acceptance: cap at 25 max
        verification = 15 + (5 * min(1.0, edits_after_accept / 2))
        verification = min(25, verification)
    elif agent_diffs_rejected_count / max(1, suggestion_total) > 0.7:
        verification = 40
    else:
        rejection_rate = agent_diffs_rejected_count / max(1, suggestion_total)
        verification = 100 * min(1.0, rejection_rate / 0.25)
        verification += 15 * min(1.0, edits_after_accept / 2)
        verification += 20 * H_caught
        verification = min(100, verification)
    
    verification = round(verification)

    # 5. SPEED
    completion = B_found / total_bugs if total_bugs > 0 else 0
    time_efficiency = max(0, 1 - (T_total - 300) / 900)
    Q_penalty = 0.5 if bugs_introduced['any'] else 1.0
    
    speed = 100 * completion * time_efficiency * Q_penalty
    speed = round(min(100, max(0, speed)))

    # FINAL SCORE
    final_score = round(
        0.20 * discovery + 
        0.25 * diagnosis + 
        0.20 * allocation + 
        0.25 * verification + 
        0.10 * speed
    )

    evaluation = {
        "scores": {
            "discovery": discovery,
            "diagnosis": diagnosis,
            "task_allocation": allocation,
            "verification": verification,
            "speed": speed,
            "final_score": final_score
        },
        "weights": {
            "discovery": 0.20,
            "diagnosis": 0.25,
            "task_allocation": 0.20,
            "verification": 0.25,
            "speed": 0.10
        },
        "bugs_fixed": bugs_fixed,
        "bugs_introduced": bugs_introduced,
        "agent_hallucinated": agent_hallucinated,
        "hallucination_caught": hallucination_caught,
        "time_total_seconds": T_total,
        "statistics": {
            "total_events": len(events),
            "agent_interactions": agent_prompts,
            "direct_code_edits": direct_edits,
            "agent_suggestions_accepted": agent_diffs_accepted_count,
            "agent_suggestions_rejected": agent_diffs_rejected_count,
            "test_runs": test_runs,
            "files_viewed": len(code_edit_files)
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
    """Check if the two known bugs are fixed in final code."""
    bugs = {
        "silent_exception": False,
        "case_sensitivity": False,
        "test_coverage": False
    }

    # Normalize keys
    normalized = {}
    for key, value in code.items():
        normalized[key.replace('\\', '/')] = value

    billing_code = normalized.get("billing.py", "")
    discounts_code = normalized.get("discounts.py", "")
    test_code = normalized.get("tests/test_billing.py", "")

    if "except Exception" not in billing_code:
        bugs["silent_exception"] = True
    elif "raise" in billing_code or "logger.exception" in billing_code:
        bugs["silent_exception"] = True

    discounts_upper = discounts_code.upper()
    if "PLAN.UPPER()" in discounts_upper or "PLAN.LOWER()" in discounts_upper:
        bugs["case_sensitivity"] = True
    elif '"FAMILY"' in discounts_code and '"family"' not in discounts_code:
        bugs["case_sensitivity"] = True

    test_lower = test_code.lower()
    if "family" in test_lower and "def test_" in test_lower:
        bugs["test_coverage"] = True

    return bugs


def check_bugs_introduced(code):
    """Check if candidate introduced new problems into the codebase."""
    bugs = {
        "any": False,
        "deleted_existing_test": False,
        "hallucinated_dependencies": False,
        "broke_imports": False
    }
    
    test_code = code.get("tests/test_billing.py", "") or code.get("tests\\test_billing.py", "")
    all_code = " ".join(code.values())
    billing_code = code.get("billing.py", "")
    
    if "test_basic_plan" not in test_code:
        bugs["deleted_existing_test"] = True
        bugs["any"] = True
    
    if "from users import" in all_code or "import users" in all_code:
        bugs["hallucinated_dependencies"] = True
        bugs["any"] = True
    
    if "from .plans" in billing_code or "from .discounts" in billing_code:
        bugs["broke_imports"] = True
        bugs["any"] = True
    
    return bugs

@app.route('/api/report', methods=['POST'])
def generate_report():
    """Generate a narrative evaluation report."""
    response = evaluate()
    eval_data = response.get_json()
    
    scores = eval_data['scores']
    bugs_fixed = eval_data['bugs_fixed']
    stats = eval_data['statistics']
    timeline = eval_data['timeline']
    
    final_score = scores['final_score']
    if final_score >= 75:
        profile = "Excellent Orchestrator"
        profile_desc = "Leads AI like a senior engineer — delegates appropriately, verifies critically, and takes over when needed."
    elif final_score >= 55:
        profile = "Capable Collaborator"
        profile_desc = "Works well with AI but has room to improve in either verification rigor or balanced task allocation."
    elif final_score >= 35:
        profile = "Developing Orchestrator"
        profile_desc = "Shows some collaboration skills but tends toward either over-reliance or under-utilization of AI."
    else:
        profile = "Novice AI User"
        profile_desc = "Either outsourced everything to AI without verification or ignored available AI tools entirely."
    
    # Key moment
    key_moment = None
    for event in timeline:
        if event['type'] == 'agent_diff_rejected':
            key_moment = {
                "description": "Candidate rejected an AI suggestion — demonstrating independent judgment and willingness to challenge AI output."
            }
            break
    if not key_moment:
        for event in timeline:
            if event['type'] == 'test_run':
                key_moment = {
                    "description": "Candidate ran tests to validate changes — showing thorough verification habits."
                }
                break
    if not key_moment:
        for event in timeline:
            if event['type'] == 'agent_diff_accepted':
                key_moment = {
                    "description": "Candidate accepted AI-generated code after review."
                }
                break
    if not key_moment:
        key_moment = {
            "description": "Candidate completed the debugging task."
        }
    
    # Strengths
    strengths = []
    if scores['discovery'] >= 70:
        strengths.append("Thorough exploration of the problem space before acting")
    if scores['diagnosis'] >= 70:
        strengths.append("Systematic verification through testing and hypothesis validation")
    if scores['verification'] >= 70:
        strengths.append("Critical review of AI output")
    if scores['task_allocation'] >= 70:
        strengths.append("Well-balanced delegation between AI assistance and direct coding")
    if not strengths:
        strengths.append("Completed the task")
    
    # Improvements
    improvements = []
    if scores['discovery'] < 50:
        improvements.append("Spend more time exploring the codebase before asking the AI for solutions")
    if scores['diagnosis'] < 50:
        improvements.append("Run tests more frequently to validate hypotheses")
    if scores['verification'] < 50:
        improvements.append("Review AI suggestions more critically")
    if scores['task_allocation'] < 30:
        improvements.append("Find a better balance between AI delegation and direct coding")
    if stats['agent_suggestions_accepted'] > 0 and stats['agent_suggestions_rejected'] == 0:
        improvements.append("Challenge the AI occasionally — rejecting a suggestion shows independent judgment")
    
    # Trust style
    if stats['agent_suggestions_rejected'] > 0:
        trust_style = "Calibrated trust — accepts when appropriate, pushes back when necessary"
    elif stats['agent_suggestions_accepted'] > 0:
        trust_style = "High trust — tends to accept AI output without pushback"
    elif stats['agent_interactions'] == 0:
        trust_style = "AI-avoidant — preferred to work independently"
    else:
        trust_style = "Exploratory — used AI for investigation but made decisions independently"
    
    bugs_text = (
        f"Fixed {sum(1 for v in bugs_fixed.values() if v)}/3 issues "
        f"(case sensitivity: {'✅' if bugs_fixed['case_sensitivity'] else '❌'}, "
        f"error handling: {'✅' if bugs_fixed['silent_exception'] else '❌'}, "
        f"test coverage: {'✅' if bugs_fixed['test_coverage'] else '❌'})"
    )
    
    report = {
        "profile": profile,
        "profile_description": profile_desc,
        "final_score": final_score,
        "scores": scores,
        "bugs_fixed": bugs_fixed,
        "key_moment": key_moment,
        "strengths": strengths,
        "improvements": improvements,
        "trust_style": trust_style,
        "statistics": stats,
        "summary": f"Candidate scored {final_score}/100 as a '{profile}'. They {trust_style.lower()}. {bugs_text}."
    }
    
    return jsonify(report)

if __name__ == '__main__':
    app.run(debug=True, port=5000)