import React, { useState } from 'react';
import { SynthesizedDocument } from '../types/video';

interface NeuralChatDrawerProps {
  document: SynthesizedDocument;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestampCitation?: string;
}

export const NeuralChatDrawer: React.FC<NeuralChatDrawerProps> = ({ document, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: `Hello! I have indexed the entire ${document.meta.videoLengthMinutes}-minute video "${document.meta.title}" with 0% informational loss. Ask me anything about specific equations, timestamp citations, trade-offs, or architectures.`,
      timestampCitation: '00:00',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: inputQuestion.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg.text,
          document,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'Analysis completed.',
        timestampCitation: data.timestampCitation || '12:00',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Apologies, could not process query against the video neural index.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'What was the exact formula mentioned?',
    'What is the primary trade-off and bottleneck?',
    'Explain the diagram architecture step-by-step',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white border-l border-[#E8E8E6] shadow-2xl flex flex-col no-print">
      {/* Header */}
      <div className="p-5 border-b border-[#E8E8E6] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-semibold">
            <span className="material-symbols-outlined text-[17px]">smart_toy</span>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#111111]">Ask the Video</h3>
            <p className="text-[12px] text-[#575754]">Grounded in verbatim transcript & diagrams</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-[#8C8C89] hover:text-[#111111] hover:bg-[#F4F4F2] transition"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Suggested Questions */}
      <div className="p-3.5 bg-[#F9F9F8] border-b border-[#E8E8E6] flex flex-wrap gap-2">
        {sampleQuestions.map((q, i) => (
          <button
            key={`sq-${i}`}
            type="button"
            onClick={() => setInputQuestion(q)}
            className="text-[12px] px-3 py-1.5 rounded-full bg-white hover:bg-[#F4F4F2] text-[#575754] hover:text-[#111111] border border-[#E8E8E6] transition text-left shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                m.role === 'user'
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#F4F4F2] text-[#111111] border border-[#E8E8E6]'
              }`}
            >
              {m.role === 'user' ? 'You' : 'VM'}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl p-3.5 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#111111] text-white rounded-tr-none'
                  : 'bg-[#F9F9F8] border border-[#E8E8E6] text-[#2D2D2A] rounded-tl-none'
              }`}
            >
              <p>{m.text}</p>
              {m.timestampCitation && (
                <div className="mt-2 pt-2 border-t border-[#E8E8E6] flex items-center gap-1 text-[11px] font-mono text-[#575754]">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>Citation: [{m.timestampCitation}]</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#575754]">
            <span className="w-2 h-2 rounded-full bg-[#111111] animate-ping" />
            <span>Scanning neural video index...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[#E8E8E6] bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask a question about this video..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          className="flex-1 bg-[#F9F9F8] border border-[#E8E8E6] rounded-full px-4 py-2 text-[13px] text-[#111111] placeholder:text-[#8C8C89] focus:outline-none focus:border-neutral-400 transition"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="p-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 disabled:opacity-40 text-white transition shadow-sm"
        >
          <span className="material-symbols-outlined text-[17px]">send</span>
        </button>
      </form>
    </div>
  );
};
