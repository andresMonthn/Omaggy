'use client';

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Plus, Mic, AudioLines, Download } from 'lucide-react';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function ChatAIPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const deferredMessages = useDeferredValue(messages);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [deferredMessages.length, pending]);

  const send = useCallback(async (text: string) => {
    const user: Msg = { id: uid(), role: 'user', content: text };
    const assistant: Msg = { id: uid(), role: 'assistant', content: '' };
    setMessages((m) => [...m, user, assistant]);
    setPending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, max_tokens: 500 }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setMessages((m) =>
        m.map((x) =>
          x.id === assistant.id ? { ...x, content: data.answer } : x
        )
      );
    } catch {
      setMessages((m) =>
        m.map((x) =>
          x.id === assistant.id ? { ...x, content: 'Error de red al llamar al modelo.' } : x,
        ),
      );
    } finally {
      setPending(false);
    }
  }, []);

  const downloadConversation = useCallback(() => {
    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  const rendered = useMemo(() => {
    return deferredMessages.map((m) => {
      const isUser = m.role === 'user';
      return (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          <MessageBubble m={m} pending={pending} />
        </motion.div>
      );
    });
  }, [deferredMessages, pending]);

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#111] text-white overflow-hidden font-sans">
      {/* RGB Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-400/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-200/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-green-900/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <main className="relative z-10 flex flex-col flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {hasMessages && (
          <div className="absolute top-0 right-4 sm:right-8 z-30 mt-4">
            <button
              onClick={downloadConversation}
              className="p-2 text-neutral-400 hover:text-white bg-[#1a1a1a]/80 hover:bg-[#222] backdrop-blur-sm border border-white/10 rounded-full transition-colors"
              title="Descargar conversación"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Messages Area */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto scroll-smooth py-6 space-y-6 ${
            hasMessages ? 'opacity-100' : 'opacity-0 hidden'
          }`}
        >
          {hasMessages && (
            <div className="absolute top-0 left-0 right-0 h-8 sm:h-12 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none" />
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {rendered}
          </AnimatePresence>
          <div className="h-4" />
        </div>

        {/* Input Area - Centered initially, bottom when chatting */}
        <motion.div
          layout
          initial={false}
          className={`w-full flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
            hasMessages ? 'py-4' : 'flex-1 pb-[20vh]'
          }`}
        >
          <AnimatePresence>
            {!hasMessages && (
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl sm:text-4xl font-medium text-white/90 mb-8 tracking-tight text-center"
              >
                Omaggy
              </motion.h1>
            )}
          </AnimatePresence>

          <div className="w-full max-w-2xl">
            <ChatInput onSend={send} disabled={pending} />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ m, pending }: { m: Msg; pending: boolean }) {
  const isUser = m.role === 'user';
  return (
    <div
      className={
        'max-w-[90%] sm:max-w-[85%] md:max-w-[75%] rounded-2xl px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base leading-relaxed ' +
        (isUser
          ? 'bg-neutral-800 text-neutral-200'
          : 'bg-transparent text-neutral-300')
      }
    >
      {m.content}
      {!isUser && pending && m.content.length === 0 ? (
        <span className="inline-block w-2 h-2 ml-1 rounded-full bg-neutral-500 animate-pulse" />
      ) : null}
    </div>
  );
});

const ChatInput = memo(function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (t: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  
  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const t = value.trim();
      if (!t) return;
      setValue('');
      await onSend(t);
    },
    [value, onSend]
  );

  return (
    <form onSubmit={submit} className="relative group w-full">
      <div className="relative flex items-center w-full bg-[#1a1a1a] hover:bg-[#222] focus-within:bg-[#222] transition-colors rounded-full border border-white/10 focus-within:border-white/20 shadow-lg shadow-black/20">
        <button
          type="button"
          className="p-3 sm:p-4 text-neutral-400 hover:text-white transition-colors rounded-full"
          aria-label="Add attachment"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
        </button>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Pregunta lo que quieras"
          className="flex-1 bg-transparent border-none outline-none text-gray-300 placeholder:text-neutral-500 text-base sm:text-lg py-3 sm:py-4 min-w-0"
          disabled={disabled}
        />

        <div className="flex items-center pr-2 sm:pr-3 gap-1 sm:gap-2">
          <button
            type="button"
            className="p-2 sm:p-3 text-neutral-400 hover:text-white transition-colors rounded-full"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

          <button
            type="button"
            className="p-2 sm:p-3 text-neutral-400 hover:text-white transition-colors rounded-full bg-white/5 hover:bg-white/10"
            aria-label="Audio mode"
          >
            <AudioLines className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </form>
  );
});
