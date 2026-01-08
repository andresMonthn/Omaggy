import { memo, useState, useCallback } from 'react';
import {  Mic, AudioLines } from 'lucide-react';

export const ChatInput = memo(function ChatInput({
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
