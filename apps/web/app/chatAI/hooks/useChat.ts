import { useState, useCallback } from 'react';
import { Msg } from '../types';
import { uid } from '../utils';
import { downloadConversation as downloadFn } from '../utils/download';
import { fetchChatResponse } from '../lib/chat-api';

export function useChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);

  const send = useCallback(async (text: string) => {
    const user: Msg = { id: uid(), role: 'user', content: text };
    const assistant: Msg = { id: uid(), role: 'assistant', content: '' };
    setMessages((m) => [...m, user, assistant]);
    setPending(true);

    try {
      const fullAnswer = await fetchChatResponse(text);
      
      // Simulate streaming (Typewriter effect)
      let displayedContent = '';
      const chunkSize = 2; // Characters per update
      const delay = 10; // Milliseconds delay

      for (let i = 0; i < fullAnswer.length; i += chunkSize) {
        displayedContent += fullAnswer.slice(i, i + chunkSize);
        
        setMessages((m) =>
          m.map((x) =>
            x.id === assistant.id ? { ...x, content: displayedContent } : x
          )
        );
        
        await new Promise((resolve) => setTimeout(resolve, delay));
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

  const downloadConversation = useCallback(() => {
    downloadFn(messages);
  }, [messages]);

  return { messages, pending, send, downloadConversation };
}
