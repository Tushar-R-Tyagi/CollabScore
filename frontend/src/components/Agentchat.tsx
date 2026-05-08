'use client';

import { useState, useRef, useEffect } from 'react';

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

  return (
    <div className="h-full bg-[#1e1e1e] border-l border-[#3e3e3e] flex flex-col">
      <div className="px-4 py-3 text-sm font-semibold border-b border-[#3e3e3e] bg-[#252526]">
        🤖 AI Agent
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[95%] rounded-lg px-2 py-1.5 text-xs${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2d2d2d] text-[#d4d4d4]'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#888]">
              Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-[#3e3e3e]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI agent..."
          rows={2}
          disabled={disabled}
          className="w-full bg-[#2d2d2d] text-[#d4d4d4] rounded-md px-3 py-2 text-sm resize-none border border-[#3e3e3e] focus:outline-none focus:border-blue-500 placeholder-[#6a6a6a]"
        />
      </div>
    </div>
  );
}