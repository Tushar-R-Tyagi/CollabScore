'use client';

interface EvaluationData {
  scores: {
    discovery: number;
    diagnosis: number;
    task_allocation: number;
    verification: number;
    speed: number;
  };
  bugs_fixed: {
    silent_exception: boolean;
    case_sensitivity: boolean;
    test_coverage: boolean;
  };
  statistics: {
    total_events: number;
    agent_interactions: number;
    direct_code_edits: number;
    agent_suggestions_accepted: number;
    agent_suggestions_rejected: number;
    test_runs: number;
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
  onReset: () => void;
}

export default function EvaluationDashboard({ data, onReset }: EvaluationDashboardProps) {
  const { scores, bugs_fixed, statistics, timeline } = data;

  return (
    <div className="h-full bg-[#1e1e1e] overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(scores).map(([key, value]) => (
            <div key={key} className="bg-[#252526] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{value}</div>
              <div className="text-xs text-[#888] mt-1 capitalize">
                {key.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>

        {/* Bugs Fixed */}
        <div className="bg-[#252526] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#bbbbbb] mb-3">Bugs Fixed</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(bugs_fixed).map(([bug, fixed]) => (
              <div key={bug} className="flex items-center gap-2">
                <span>{fixed ? '✅' : '❌'}</span>
                <span className="text-sm text-[#d4d4d4] capitalize">
                  {bug.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

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
            {timeline.map((event, i) => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <span className="text-[#6a6a6a] w-16 flex-shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getEventColor(event.type)}`}
                >
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