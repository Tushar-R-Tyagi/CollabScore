'use client';

import { useState, useRef, useEffect } from 'react';
import { logEvent } from '../lib/api';

interface Message {
  role: 'user' | 'agent';
  content: string;
}

interface AgentChatProps {
  onSendMessage: (message: string) => Promise<string>;
  disabled: boolean;
}

export default function AgentChat({ onSendMessage, disabled }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: "Hi! I'm your AI assistant. I can help you investigate the billing system. What would you like to look at first?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionStates, setActionStates] = useState<Record<number, 'accepted' | 'rejected' | null>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading || disabled) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await onSendMessage(userMessage);
      setMessages((prev) => [...prev, { role: 'agent', content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: 'Sorry, something went wrong. Try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const handleAcceptDiff = async (index: number, content: string) => {
    setActionStates(prev => ({ ...prev, [index]: 'accepted' }));
    await logEvent('agent_diff_accepted', { suggestion: content });
  };

  const handleRejectDiff = async (index: number, content: string) => {
    setActionStates(prev => ({ ...prev, [index]: 'rejected' }));
    await logEvent('agent_diff_rejected', { suggestion: content });
  };

  const containsCode = (content: string): boolean => {
    return content.includes('```') || content.includes('diff') || content.includes('@@');
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold border-b border-[#3e3e3e] bg-[#252526] flex-shrink-0">
        🤖 AI Agent
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-1">
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[95%] rounded-lg px-2 py-1.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2d2d2d] text-[#d4d4d4]'
                }`}
                style={{ wordBreak: 'break-word' }}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            </div>
            {msg.role === 'agent' && containsCode(msg.content) && (
              <div className="flex justify-start gap-2 ml-2">
                {actionStates[i] === 'accepted' ? (
                  <span className="px-2 py-0.5 bg-green-900 text-green-300 text-xs rounded flex items-center gap-1">
                    ✅ Accepted
                  </span>
                ) : actionStates[i] === 'rejected' ? (
                  <span className="px-2 py-0.5 bg-red-900 text-red-300 text-xs rounded flex items-center gap-1">
                    ❌ Rejected
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAcceptDiff(i, msg.content)}
                      className="px-2 py-0.5 bg-green-800 text-green-200 text-xs rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => handleRejectDiff(i, msg.content)}
                      className="px-2 py-0.5 bg-red-800 text-red-200 text-xs rounded hover:bg-red-700 flex items-center gap-1"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#2d2d2d] rounded-lg px-3 py-2 text-xs text-[#888]">
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-2 border-t border-[#3e3e3e] flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI agent..."
          rows={2}
          disabled={disabled}
          className="w-full bg-[#2d2d2d] text-[#d4d4d4] rounded-md px-3 py-2 text-sm resize-none border border-[#3e3e3e] focus:outline-none focus:border-blue-500 placeholder-[#6a6a6a]"
          style={{ maxHeight: '150px', minHeight: '44px' }}
        />
      </div>
    </div>
  );
}