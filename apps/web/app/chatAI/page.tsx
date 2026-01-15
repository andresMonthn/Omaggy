'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Menu, Eye, EyeOff, AudioLines } from 'lucide-react';

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
  const [hasAudioBridge, setHasAudioBridge] = useState(false);
  const [isSystemCapturing, setIsSystemCapturing] = useState(false);

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

  useEffect(() => {
    const check = () => {
      if (typeof window !== 'undefined' && (window as any).audio) {
        setHasAudioBridge(true);
      } else {
        setHasAudioBridge(false);
        setIsSystemCapturing(false);
      }
    };

    check();

    window.addEventListener('focus', check);
    return () => {
      window.removeEventListener('focus', check);
    };
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
          <MessageBubble m={m} pending={pending} isTransparentMode={isTransparent} />
        </motion.div>
      );
    });
  }, [deferredMessages, pending, isTransparent]);

  return (
    <div className="relative flex min-h-screen bg-transparent text-white overflow-hidden font-sans">
      
      {/* Draggable Background Area - Allows moving the frameless window */}
      <div 
        className="fixed inset-0 z-0" 
        style={{ WebkitAppRegion: 'drag' } as any} 
      />

      {/* Sidebar Toggle - Dynamic position based on sidebar state */}
      <motion.div 
        className="absolute top-4 z-50"
        initial={false}
        animate={{ left: isSidebarOpen ? 280 + 16 : 16 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <div className="flex gap-2">
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant="neutral"
            size="sm"
            iconLeft={
              isSidebarOpen ? (
                <Menu className="w-4 h-4 rotate-180" />
              ) : (
                <Menu className="w-4 h-4" />
              )
            }
            title={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          />
          <Button
            onClick={() => setIsTransparent(!isTransparent)}
            variant={isTransparent ? 'primary' : 'neutral'}
            size="sm"
            iconLeft={
              isTransparent ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )
            }
            title={
              isTransparent ? 'Desactivar transparencia' : 'Activar transparencia'
            }
          />
          <Button
            onClick={() => {
              if (!hasAudioBridge) {
                return;
              }

              if (!(window as any).audio) {
                return;
              }

              if (!isSystemCapturing) {
                (window as any).audio.start({ source: 'system' });
                setIsSystemCapturing(true);
              } else {
                (window as any).audio.stop();
                setIsSystemCapturing(false);
              }
            }}
            disabled={!hasAudioBridge}
            variant={isSystemCapturing ? 'primary' : 'neutral'}
            size="sm"
            iconLeft={<AudioLines className="w-4 h-4" />}
            title={
              !hasAudioBridge
                ? 'Captura de audio disponible solo en la app de escritorio'
                : isSystemCapturing
                ? 'Detener captura de audio del sistema'
                : 'Iniciar captura de audio del sistema'
            }
          />
        </div>
      </motion.div>

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

          <main 
            className="relative z-10 flex flex-col flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
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
                hasMessages ? 'opacity-100 pb-32' : 'opacity-0 hidden'
              }`}
            >
              {/* Gradient removed for full transparency */}
              <AnimatePresence initial={false} mode="popLayout">
                {rendered}
              </AnimatePresence>
              <div className="h-4" />
            </div>

            {/* Input Area - Centered initially, bottom when chatting */}
            <motion.div
              layout
              initial={false}
              className={`w-full flex flex-col items-center justify-center shrink-0 transition-all duration-500 ease-in-out ${
                hasMessages ? 'fixed bottom-0 left-0 right-0 z-50 py-4' : 'flex-1 pb-[20vh]'
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
                    Ommagy
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
