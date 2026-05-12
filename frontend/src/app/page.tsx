'use client';

import { useState, useEffect, useCallback } from 'react';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import AgentChat from '@/components/Agentchat';
import EvaluationDashboard from '../components/EvaluationDashboard';
import { fetchFiles, sendAgentMessage, logEvent, getEvaluation, runTests, startSession, generateReport } from '@/lib/api';
import { report } from 'process';

export default function Home() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [shipped, setShipped] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  // Load files on mount
  useEffect(() => {
    async function load() {
      try {
        await startSession();
        const data = await fetchFiles();
        setFiles(data);
        const firstFile = Object.keys(data).find((f) => !f.includes('__init__')) || Object.keys(data)[0];
        setSelectedFile(firstFile || '');
      } catch (err) {
        console.error('Failed to load files:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Handle code changes
  const handleCodeChange = useCallback(
    (filename: string, newCode: string) => {
      setFiles((prev) => ({ ...prev, [filename]: newCode }));
      logEvent('code_edit', { filename, code: newCode });
    },
    []
  );

  // Handle agent messages
  const handleSendMessage = useCallback(
    async (message: string): Promise<string> => {
      const response = await sendAgentMessage(message, files);
      return response;
    },
    [files]
  );

  // Handle run tests
  const handleRunTests = async () => {
    setTestOutput('Running tests...');
    const result = await runTests(files);
    setTestOutput(result.output || result.errors || 'No output');
  };

  // Handle ship fix
  const handleShipFix = async () => {
    await logEvent('task_complete', {});
    const evalData = await getEvaluation(files);
    setEvaluation(evalData);
    const reportData = await generateReport(files);
    setReport(reportData);
    setShipped(true);
  };

  // Reset
  const handleReset = async () => {
    const data = await fetchFiles();
    setFiles(data);
    setShipped(false);
    setEvaluation(null);
    setTestOutput(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-[#6a6a6a] text-lg">Loading billing module...</div>
      </div>
    );
  }

  if (shipped && evaluation) {
    return <EvaluationDashboard data={evaluation} report={report} onReset={handleReset} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      {/* Top bar */}
      <div className="h-14 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] border-b border-[#3e3e3e] flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-base font-bold text-white tracking-tight">
              HackerRank <span className="text-blue-400">AI Orchestrator</span>
            </span>
          </div>
          <div className="h-5 w-px bg-[#4a4a4a]"></div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-sm text-[#aab]">
              Production issue: Family plan discounts not applying
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTests}
            className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 font-medium"
          >
            🧪 Run Tests
          </button>
          <button
            onClick={handleShipFix}
            className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg shadow-green-900/30 transition-all duration-200 hover:scale-105"
          >
            🚀 Ship Fix
          </button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: File Tree */}
        <div className="w-56 flex-shrink-0 border-r border-[#3e3e3e]">
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 min-w-0">
          <CodeEditor
            filename={selectedFile}
            code={files[selectedFile] || ''}
            onChange={handleCodeChange}
          />
        </div>

        {/* Right: Agent Chat */}
        <div className="relative flex-shrink-0 border-l border-[#3e3e3e]" style={{ width: '384px', minWidth: '280px', maxWidth: '600px', resize: 'horizontal', overflow: 'auto' }}>
          <AgentChat onSendMessage={handleSendMessage} disabled={false} />
        </div>

        {/* Test output modal */}
        {testOutput && (
          <>
            <div className="absolute inset-0 z-10" onClick={() => setTestOutput(null)}></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] border border-[#3e3e3e] rounded-lg shadow-2xl z-20 w-[600px] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e3e]">
                <span className="text-xs font-semibold text-[#888]">🧪 Test Output</span>
                <button
                  onClick={() => setTestOutput(null)}
                  className="px-3 py-1 bg-[#444] text-white text-xs rounded hover:bg-[#555]"
                >
                  ✕ Close
                </button>
              </div>
              <div className="p-4 overflow-y-auto font-mono text-sm text-[#d4d4d4]" style={{ maxHeight: '200px' }}>
                <pre className="whitespace-pre-wrap">{testOutput}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}