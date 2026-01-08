import { memo } from 'react';
import { Msg } from '../types';

export const MessageBubble = memo(function MessageBubble({ m, pending, isTransparentMode }: { m: Msg; pending: boolean; isTransparentMode?: boolean }) {
  const isUser = m.role === 'user';
  
  // Logic based on requirements:
  // - If isTransparentMode is true (Toggle Active): Black BG, White Text.
  // - If isTransparentMode is false (Default): Maintain original transparency (User=Dark, AI=Transparent).
  // Wait, user requirement: "Tener fondo negro y texto blanco únicamente cuando se active la función... Mantener su transparencia en todos los demás casos"
  // Does "Mantener su transparencia" mean standard styling?
  // Current Standard: User = bg-neutral-800 (Not transparent, opaque dark), AI = bg-transparent.
  // Maybe user implies "Mantener su transparencia" means "Stay as they are (which fits the transparent theme)".
  // Let's assume:
  // Active (Toggle): bg-black text-white (High Contrast / Opaque).
  // Inactive (Default): Current styles.
  
  const bubbleClass = isTransparentMode
    ? 'bg-black text-white border border-white/20' // Active Mode
    : isUser
        ? 'bg-neutral-800/80 backdrop-blur-sm text-neutral-200' // Default User (added blur for better transparency feel)
        : 'bg-transparent text-neutral-300'; // Default AI

  return (
    <div
      className={
        `message-bubble max-w-[90%] sm:max-w-[85%] md:max-w-[75%] rounded-2xl px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base leading-relaxed ${bubbleClass}`
      }
    >
      {m.content}
      {!isUser && pending && m.content.length === 0 ? (
        <span className="inline-block w-2 h-2 ml-1 rounded-full bg-neutral-500 animate-pulse" />
      ) : null}
    </div>
  );
});
