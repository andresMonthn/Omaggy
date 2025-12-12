/**
 * Ruta pública de marketing.
 * Función: Página principal del sitio (landing/introducción).
 */


'use client';
import ChatAI from '../chatAI/page';

export default function MarketingPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <h1>OMaggy</h1>
      <ChatAI />
    </div>
  );
}
