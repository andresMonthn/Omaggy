'use client';

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
        body: JSON.stringify({ prompt: text }),
      });
      if (!res.body) {
        throw new Error('no-stream');
      }
      const reader = res.body.getReader();
      const td = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = td.decode(value);
        startTransition(() => {
          setMessages((m) =>
            m.map((x) => (x.id === assistant.id ? { ...x, content: x.content + chunk } : x)),
          );
        });
      }
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

  const rendered = useMemo(() => {
    return deferredMessages.map((m) => {
      const isUser = m.role === 'user';
      return (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={isUser ? 'flex justify-end' : 'flex justify-start'}
        >
          <MessageBubble m={m} pending={pending} />
        </motion.div>
      );
    });
  }, [deferredMessages, pending]);

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-6 space-y-4">
      <h1 className="text-lg font-semibold">Chat AI</h1>
      <div
        ref={scrollRef}
        className="h-[65vh] w-full overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900 space-y-3"
      >
        <AnimatePresence initial={false}>
          {rendered}
        </AnimatePresence>
        {!pending && messages.length === 0 ? (
          <div className="text-xs text-neutral-500">Escribe un mensaje para comenzar.</div>
        ) : null}
      </div>
      <ChatInput onSend={send} disabled={pending} />
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ m, pending }: { m: Msg; pending: boolean }) {
  const isUser = m.role === 'user';
  return (
    <motion.div
      layout
      className={
        'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ' +
        (isUser
          ? 'bg-blue-600 text-white'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100')
      }
    >
      {m.content}
      {!isUser && pending && m.content.length === 0 ? (
        <span className="inline-block w-3 h-3 ml-2 align-[-0.2em] rounded-full bg-neutral-400 animate-ping" />
      ) : null}
    </motion.div>
  );
});

const ChatInput = memo(function ChatInput({ onSend, disabled }: { onSend: (t: string) => void | Promise<void>; disabled?: boolean }) {
  const [value, setValue] = useState('');
  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    setValue('');
    await onSend(t);
  }, [value, onSend]);
  return (
    <form onSubmit={submit} className="flex gap-2 w-full">
      <input
        type="text"
        value={value}
        onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value), [])}
        placeholder="Escribe tu mensaje..."
        className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
});
