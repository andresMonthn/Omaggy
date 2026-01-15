import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Mic, AudioLines } from 'lucide-react';

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (t: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasAudioBridge, setHasAudioBridge] = useState(false);
  const unsubscribeRef = useRef<null | (() => void)>(null);

  const stopListening = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).audio) {
      try {
        (window as any).audio.stop();
      } catch {
      }
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).audio) {
      return;
    }

    const audio = (window as any).audio;

    if (!isListening) {
      try {
        audio.start({ source: 'mic' });
      } catch {
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (typeof audio.onTranscript === 'function') {
        const unsubscribe = audio.onTranscript((text: string) => {
          if (typeof text === 'string') {
            setValue(text);
          }
        });

        if (typeof unsubscribe === 'function') {
          unsubscribeRef.current = unsubscribe;
        }
      }

      setIsListening(true);
    } else {
      stopListening();
    }
  }, [isListening, stopListening]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const t = value.trim();
      if (!t) return;
       if (isListening) {
        stopListening();
      }
      setValue('');
      await onSend(t);
    },
    [value, onSend, isListening, stopListening]
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).audio) {
      setHasAudioBridge(true);
    } else {
      setHasAudioBridge(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return (
    <form onSubmit={submit} className="relative group w-full">
      <div
        className={`relative flex items-center w-full bg-[#1a1a1a] hover:bg-[#222] focus-within:bg-[#222] transition-colors rounded-full border border-white/10 focus-within:border-white/20 shadow-lg shadow-black/20 ${
          isListening && hasAudioBridge && !disabled
            ? 'border-emerald-400/60 shadow-[0_0_0_1px_rgba(52,211,153,0.8)]'
            : ''
        }`}
      >
        <button
          type="button"
          className="p-3 sm:p-4 text-neutral-400 hover:text-white transition-colors rounded-full"
          aria-label="Add attachment"
        >
        
        </button>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Inicia la entrevista"
          className="flex-1 bg-transparent border-none outline-none text-gray-300 placeholder:text-neutral-500 text-base sm:text-lg py-3 sm:py-4 min-w-0"
          disabled={disabled}
        />

        <div className="flex items-center pr-2 sm:pr-3 gap-1 sm:gap-2">
          <button
            type="button"
            disabled={!hasAudioBridge || disabled}
            className={`p-2 sm:p-3 transition-colors rounded-full ${
              !hasAudioBridge || disabled
                ? 'text-neutral-500 cursor-not-allowed'
                : isListening
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
            aria-label="Voice input"
            onClick={hasAudioBridge ? toggleMic : undefined}
          >
            <Mic
              className={`w-5 h-5 sm:w-5 sm:h-5 ${
                isListening && hasAudioBridge && !disabled ? 'text-emerald-300 animate-pulse' : ''
              }`}
            />
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
      {isListening && hasAudioBridge && !disabled && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Micrófono escuchando...</span>
        </div>
      )}
    </form>
  );
});
