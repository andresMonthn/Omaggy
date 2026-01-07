'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Menu } from 'lucide-react';

import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { Button } from './components/Button';
import { Sidebar } from './Sidebar';

export default function ChatAIPage() {
  const { messages, pending, send, downloadConversation } = useChat();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const deferredMessages = useDeferredValue(messages);
  const hasMessages = messages.length > 0;
  const [isTransparent, setIsTransparent] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [deferredMessages.length, pending]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        setIsTransparent((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="relative flex min-h-screen bg-[#111] text-white overflow-hidden font-sans">
      
      {/* Sidebar Toggle - Moved outside of main content to be always top-left relative to screen */}
      <div className="absolute top-4 left-4 z-50">
           <AnimatePresence>
               {!isSidebarOpen && (
                  <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                  >
                      <Button
                          onClick={() => setIsSidebarOpen(true)}
                          variant="neutral"
                          size="sm"
                          iconLeft={<Menu className="w-4 h-4" />}
                          title="Abrir menú"
                      />
                  </motion.div>
               )}
           </AnimatePresence>
      </div>

      <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          isTransparent={isTransparent}
          setIsTransparent={setIsTransparent}
      />

      <div className="flex-1 flex flex-col relative min-w-0 transition-all duration-300">
          {/* RGB Background Effects */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-400/10 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-200/10 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-green-900/5 blur-[100px] rounded-full mix-blend-screen" />
          </div>

          <main className="relative z-10 flex flex-col flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 right-4 sm:right-8 z-30 mt-4 flex gap-2">
              {hasMessages && (
                <Button
                  onClick={downloadConversation}
                  variant="neutral"
                  size="sm"
                  iconLeft={<Download className="w-4 h-4" />}
                  title="Descargar conversación"
                />
              )}
            </div>
            
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
                    ¿En qué puedo ayudarte hoy?
                  </motion.h1>
                )}
              </AnimatePresence>
              <div className="w-full max-w-2xl">
                <ChatInput onSend={send} disabled={pending} />
              </div>
            </motion.div>
          </main>
      </div>
    </div>
  );
}
