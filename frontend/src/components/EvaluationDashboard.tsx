'use client';

interface EvaluationData {
  scores: {
    discovery: number;
    diagnosis: number;
    task_allocation: number;
    verification: number;
    speed: number;
    final_score: number;
  };
  bugs_fixed: {
    silent_exception: boolean;
    case_sensitivity: boolean;
    test_coverage: boolean;
  };
  bugs_introduced: {
    any: boolean;
    deleted_existing_test: boolean;
    hallucinated_dependencies: boolean;
    broke_imports: boolean;
  };
  agent_hallucinated: boolean;
  hallucination_caught: boolean;
  time_total_seconds: number;
  statistics: {
    total_events: number;
    agent_interactions: number;
    direct_code_edits: number;
    agent_suggestions_accepted: number;
    agent_suggestions_rejected: number;
    test_runs: number;
    files_viewed: number;
  };
  timeline: Array<{
    id: string;
    type: string;
    timestamp: string;
    summary: string;
  }>;
}

interface EvaluationDashboardProps {
  data: EvaluationData;
  report: any;
  onReset: () => void;
}

const SCORE_ORDER = ['discovery', 'diagnosis', 'task_allocation', 'verification', 'speed', 'final_score'] as const;

export default function EvaluationDashboard({ data, report, onReset }: EvaluationDashboardProps) {
  const { scores, bugs_fixed, bugs_introduced, statistics, timeline, time_total_seconds, agent_hallucinated, hallucination_caught } = data;

  const minutes = Math.floor(time_total_seconds / 60);
  const seconds = Math.floor(time_total_seconds % 60);

  return (
    <div className="h-full bg-[#1e1e1e] overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Report Section */}
        {report && (
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-lg p-6 border border-[#3e3e3e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">📋 Evaluation Report</h3>
              <button
                onClick={() => {
                  const reportText = `
═══════════════════════════════════════
HACKERRANK AI ORCHESTRATION EVALUATION
═══════════════════════════════════════

PROFILE: ${report.profile}
${report.profile_description}

FINAL SCORE: ${report.final_score}/100

${'─'.repeat(40)}
SCORE BREAKDOWN
${'─'.repeat(40)}
Discovery: ${report.scores.discovery}/100
Diagnosis: ${report.scores.diagnosis}/100
Task Allocation: ${report.scores.task_allocation}/100
Verification: ${report.scores.verification}/100
Speed: ${report.scores.speed}/100

${'─'.repeat(40)}
KEY MOMENT
${'─'.repeat(40)}
${report.key_moment.description}

${'─'.repeat(40)}
STRENGTHS
${'─'.repeat(40)}
${report.strengths.map((s: string) => '✓ ' + s).join('\n')}

${'─'.repeat(40)}
AREAS FOR IMPROVEMENT
${'─'.repeat(40)}
${report.improvements.map((i: string) => '→ ' + i).join('\n')}

${'─'.repeat(40)}
TRUST STYLE
${'─'.repeat(40)}
${report.trust_style}

${'─'.repeat(40)}
BUGS FIXED
${'─'.repeat(40)}
Case Sensitivity: ${report.bugs_fixed.case_sensitivity ? '✅ Fixed' : '❌ Not Fixed'}
Error Handling: ${report.bugs_fixed.silent_exception ? '✅ Fixed' : '❌ Not Fixed'}
Test Coverage: ${report.bugs_fixed.test_coverage ? '✅ Added' : '❌ Not Added'}

${'─'.repeat(40)}
STATISTICS
${'─'.repeat(40)}
Total Actions: ${report.statistics.total_events}
Agent Interactions: ${report.statistics.agent_interactions}
Direct Code Edits: ${report.statistics.direct_code_edits}
Tests Run: ${report.statistics.test_runs}
Agent Suggestions Accepted: ${report.statistics.agent_suggestions_accepted}
Agent Suggestions Rejected: ${report.statistics.agent_suggestions_rejected}

═══════════════════════════════════════
SUMMARY
═══════════════════════════════════════
${report.summary}
`;
                  navigator.clipboard.writeText(reportText);
                  alert('Report copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                📋 Copy Report
              </button>
            </div>

            {/* Key Moment */}
            <div className="bg-[#0f0f1a] rounded p-4 mb-4 border-l-4 border-yellow-500">
              <div className="text-xs text-[#888] mb-1">🔑 KEY MOMENT</div>
              <div className="text-sm text-[#d4d4d4]">{report.key_moment.description}</div>
            </div>

            {/* Profile & Trust */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-[#888] mb-1">PROFILE</div>
                <div className="text-lg font-bold text-white">{report.profile}</div>
                <div className="text-xs text-[#aab] mt-1">{report.profile_description}</div>
              </div>
              <div>
                <div className="text-xs text-[#888] mb-1">TRUST STYLE</div>
                <div className="text-sm text-[#d4d4d4]">{report.trust_style}</div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-green-400 mb-2">✅ STRENGTHS</div>
                {report.strengths.map((s: string, i: number) => (
                  <div key={i} className="text-sm text-[#d4d4d4] mb-1">• {s}</div>
                ))}
              </div>
              <div>
                <div className="text-xs text-amber-400 mb-2">📈 AREAS FOR IMPROVEMENT</div>
                {report.improvements.map((imp: string, i: number) => (
                  <div key={i} className="text-sm text-[#d4d4d4] mb-1">• {imp}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Orchestration Evaluation</h2>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Try Again
          </button>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-6 gap-4">
          {SCORE_ORDER.map((key) => {
            const value = scores[key];
            return (
              <div key={key} className="bg-[#252526] rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{value}</div>
                <div className="text-xs text-[#888] mt-1 capitalize">
                  {key === 'final_score' ? 'Final Score' : key.replace('_', ' ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time */}
        <div className="text-center text-sm text-[#6a6a6a]">
          Time: {minutes}m {seconds}s
        </div>

        {/* Bugs Fixed */}
        <div className="bg-[#252526] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#bbbbbb] mb-3">Bugs Fixed</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span>{bugs_fixed.case_sensitivity ? '✅' : '❌'}</span>
              <span className="text-sm text-[#d4d4d4]">Case Sensitivity</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{bugs_fixed.silent_exception ? '✅' : '❌'}</span>
              <span className="text-sm text-[#d4d4d4]">Error Handling</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{bugs_fixed.test_coverage ? '✅' : '❌'}</span>
              <span className="text-sm text-[#d4d4d4]">Test Coverage</span>
            </div>
          </div>
          {bugs_introduced.any && (
            <div className="mt-3 pt-3 border-t border-[#3e3e3e]">
              <div className="text-xs text-red-400 mb-2">⚠️ Issues Introduced</div>
              {bugs_introduced.deleted_existing_test && (
                <div className="text-xs text-red-300">• Deleted existing test</div>
              )}
              {bugs_introduced.hallucinated_dependencies && (
                <div className="text-xs text-red-300">• Added hallucinated dependencies</div>
              )}
              {bugs_introduced.broke_imports && (
                <div className="text-xs text-red-300">• Broke existing imports</div>
              )}
            </div>
          )}
        </div>

        {/* Hallucination Alert */}
        {agent_hallucinated && (
          <div className={`rounded-lg p-4 ${hallucination_caught ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
            <div className="text-sm font-semibold mb-1">
              {hallucination_caught ? '✅ Hallucination Caught' : '⚠️ Hallucination Missed'}
            </div>
            <div className="text-xs text-[#d4d4d4]">
              {hallucination_caught
                ? 'The agent suggested fabricated code. The candidate detected and rejected it.'
                : 'The agent suggested fabricated code. The candidate accepted it without verification.'}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-[#252526] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#bbbbbb] mb-3">Interaction Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Total Events" value={statistics.total_events} />
            <Stat label="Agent Interactions" value={statistics.agent_interactions} />
            <Stat label="Direct Code Edits" value={statistics.direct_code_edits} />
            <Stat label="Agent Suggestions Accepted" value={statistics.agent_suggestions_accepted} />
            <Stat label="Agent Suggestions Rejected" value={statistics.agent_suggestions_rejected} />
            <Stat label="Test Runs" value={statistics.test_runs} />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-[#252526] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#bbbbbb] mb-3">Action Timeline</h3>
          <div className="space-y-2">
            {timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <span className="text-[#6a6a6a] w-16 flex-shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEventColor(event.type)}`}>
                  {event.type}
                </span>
                <span className="text-[#d4d4d4] truncate">{event.summary}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-[#888]">{label}</div>
    </div>
  );
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    code_edit: 'bg-green-800 text-green-200',
    agent_prompt: 'bg-blue-800 text-blue-200',
    agent_response: 'bg-purple-800 text-purple-200',
    agent_diff_accepted: 'bg-teal-800 text-teal-200',
    agent_diff_rejected: 'bg-red-800 text-red-200',
    test_run: 'bg-yellow-800 text-yellow-200',
    task_complete: 'bg-orange-800 text-orange-200',
  };
  return colors[type] || 'bg-gray-700 text-gray-300';
}