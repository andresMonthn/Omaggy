'use client';

import { useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';

import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';

export default function ChatAIPage() {
  const { messages, pending, send, downloadConversation } = useChat();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const deferredMessages = useDeferredValue(messages);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [deferredMessages.length, pending]);

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
