import { memo } from 'react';
import { Msg } from '../types';

export const MessageBubble = memo(function MessageBubble({ m, pending }: { m: Msg; pending: boolean }) {
  const isUser = m.role === 'user';
  return (
    <div
      className={
        'message-bubble max-w-[90%] sm:max-w-[85%] md:max-w-[75%] rounded-2xl px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base leading-relaxed ' +
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
