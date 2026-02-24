import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (t: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const hasAudioBridgeRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
      }
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
      }
      mediaStreamRef.current = null;
    }
    setIsListening(false);
  }, []);

  const sendToStt = useCallback(async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append('file', blob);
      form.append('language', 'es');
      const res = await fetch('http://127.0.0.1:8000/v1/speech/transcribe', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json().catch(() => ({}));
      let text: unknown =
        (data as any).text ??
        (data as any).transcript ??
        (data as any).result ??
        data;
      if (Array.isArray(text)) {
        text = text.join(' ');
      } else if (text && typeof text === 'object') {
        try {
          text = JSON.stringify(text);
        } catch {
          text = String(text);
        }
      }
      if (typeof text === 'string' && text.trim()) {
        setValue(text);
      }
    } catch {
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!isListening) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          mediaStreamRef.current = stream;
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };
          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            chunksRef.current = [];
            void sendToStt(blob);
          };
          try {
            recorder.start();
            setIsListening(true);
          } catch {
          }
        })
        .catch(() => {
        });
    } else {
      stopListening();
    }
  }, [isListening, stopListening, sendToStt]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) {
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const t = value.trim();
        if (!t) return;
        if (isListening) {
          stopListening();
        }
        setValue('');
        void onSend(t);
        return;
      }

      if (
        e.key === ' ' &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        value.trim() === '' &&
        hasVoiceSupport
      ) {
        e.preventDefault();
        toggleMic();
      }
    },
    [disabled, value, isListening, stopListening, onSend, hasVoiceSupport, toggleMic]
  );

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) {
      return;
    }

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    el.style.overflowY = 'hidden';
  }, [value]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setHasVoiceSupport(true);
    }

    if ((window as any).audio) {
      hasAudioBridgeRef.current = true;
      if (typeof (window as any).audio.onTranscript === 'function') {
        (window as any).audio.onTranscript((text: string) => {
          if (typeof text === 'string') {
            setValue(text);
          }
        });
      }
      if (typeof (window as any).audio.onError === 'function') {
        const off = (window as any).audio.onError((_msg: string) => {
          setIsListening(false);
        });
        // store cleanup in ref
        (recognitionRef as any).__offAudioError = off;
      }
      setHasVoiceSupport(true);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasVoiceSupport(true);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: any) => {
      let transcript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0] && typeof result[0].transcript === 'string') {
          transcript += result[0].transcript;
        }
      }

      setValue(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setHasVoiceSupport(true);

    return () => {
      const current = recognitionRef.current;

      if (current) {
        try {
          current.stop();
        } catch {
        }
      }

      recognitionRef.current = null;
      const off = (recognitionRef as any).__offAudioError;
      if (typeof off === 'function') {
        try {
          off();
        } catch { }
      }
    };
  }, []);

  return (
    <form onSubmit={submit} className="relative group w-full">
      <div
        className={`relative flex items-start w-full bg-[#1a1a1a] hover:bg-[#222] focus-within:bg-[#222] transition-colors rounded-full border border-white/10 focus-within:border-white/20 shadow-lg shadow-black/20 ${isListening && hasVoiceSupport && !disabled
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

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Inicia la entrevista"
          className="flex-1 bg-transparent border-none outline-none text-gray-300 placeholder:text-neutral-500 text-base sm:text-lg py-3 sm:py-4 min-w-0 resize-none transition-[height] duration-200 ease-in-out"
          disabled={disabled}
        />

        <div className="flex items-end flex-shrink-0 pr-2 sm:pr-3 gap-1 sm:gap-2">
          <button
            type="button"
            disabled={!hasVoiceSupport || disabled}
            className={`p-2 sm:p-3 transition-colors rounded-full ${
              !hasVoiceSupport || disabled
                ? 'text-neutral-500 cursor-not-allowed'
                : isListening
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white'
            }`}
            aria-label="Voice input"
            onClick={hasVoiceSupport ? toggleMic : undefined}
          >
            <Mic
              className={`w-5 h-5 sm:w-5 sm:h-5 ${
                isListening && hasVoiceSupport && !disabled ? 'text-emerald-300 animate-pulse' : ''
              }`}
            />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className={`p-2 sm:p-3 rounded-full transition-colors ${disabled || !value.trim()
              ? 'text-neutral-500 cursor-not-allowed bg-white/5'
              : 'text-white bg-white/10 hover:bg-white/20'
              }`}
            aria-label="Enviar mensaje"
          >
            <Send className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
      {isListening && hasVoiceSupport && !disabled && (
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
