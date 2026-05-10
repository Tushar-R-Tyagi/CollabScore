'use client';

import { useState, useEffect, useCallback } from 'react';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import AgentChat from '@/components/Agentchat';
import EvaluationDashboard from '@/components/EvaluationDashboard';
import { fetchFiles, sendAgentMessage, logEvent, getEvaluation, runTests } from '@/lib/api';

export default function Home() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [shipped, setShipped] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  // Load files on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchFiles();
        setFiles(data);
        // Select first non-init file
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

  // Handle ship fix
  const handleShipFix = async () => {
    await logEvent('task_complete', {});
    const evalData = await getEvaluation(files);
    setEvaluation(evalData);
    setShipped(true);
  };

  // Reset
  const handleReset = async () => {
    const data = await fetchFiles();
    setFiles(data);
    setShipped(false);
    setEvaluation(null);
  };

  // Run tests
  const handleRunTests = async () => {
  setTestOutput("Running tests...");
  const result = await runTests(files);
  setTestOutput(result.output || result.errors);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-[#6a6a6a] text-lg">Loading billing module...</div>
      </div>
    );
  }

  if (shipped && evaluation) {
    return <EvaluationDashboard data={evaluation} onReset={handleReset} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      {/* Top bar */}
      <div className="h-12 bg-[#323233] border-b border-[#3e3e3e] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            🐛 Billing System Debug
          </span>
          <span className="text-xs text-[#888]">
            Production issue: Family plan discounts not applying
          </span>
        </div>
        <button
          onClick={handleShipFix}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 font-medium"
        >
          🚀 Ship Fix
        </button>
      </div>
        <button
          onClick={handleRunTests}
          className="px-4 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 font-medium"
        >
          🧪 Run Tests
        </button>
      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: File Tree */}
        <div className="w-56 flex-shrink-0">
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1">
          <CodeEditor
            filename={selectedFile}
            code={files[selectedFile] || ''}
            onChange={handleCodeChange}
          />
        </div>

        {/* Right: Agent Chat */}
        <div className="w-80 flex-shrink-0" style={{ maxWidth: '320px' }}>
          <AgentChat onSendMessage={handleSendMessage} disabled={false} />
        </div>
        {/* Replace the current test output panel with this */}
        {testOutput && (
          <div className="absolute bottom-0 left-56 right-80 bg-[#1e1e1e] border-t border-[#3e3e3e] p-4 overflow-y-auto font-mono text-sm text-[#d4d4d4] z-10 h-40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#888]">Test Output</span>
              <button 
                onClick={() => setTestOutput(null)}
                className="px-2 py-0.5 bg-[#333] text-xs rounded hover:bg-[#444]"
              >
                ✕
              </button>
            </div>
            <pre className="whitespace-pre-wrap">{testOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
}