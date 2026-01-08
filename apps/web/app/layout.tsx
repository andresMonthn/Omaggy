/**
 * Layout raíz de la aplicación (App Router).
 * Función: Proveedores globales (tema, i18n, fuentes), UI compartida y metadatos.
 */
import { headers } from 'next/headers';
import { Toaster } from '@kit/ui/sonner';
import { RootProviders } from '~/components/root-providers';
import { getFontsClassName } from '~/lib/fonts';
import ChatBotOverlayGuard from "~/components/chat-bot/chatbot-overlay-guard";
import MobileBottomBar from './_components/mobile-bottom-bar';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { generateRootMetadata } from '~/lib/root-metdata';
import { getRootTheme } from '~/lib/root-theme';

import '../styles/globals.css';
export const generateMetadata = () => {
  return generateRootMetadata();
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = await createI18nServerInstance();
  const theme = await getRootTheme();
  const className = getFontsClassName(theme);
  const nonce = await getCspNonce();

  return (
    <html lang={language} className={`${className} bg-transparent`}>
      <body className="bg-transparent">
        <RootProviders theme={theme} lang={language} nonce={nonce}>
          {children}
          {/* Overlay del ChatBot visible solo en rutas bajo /home */}
          <ChatBotOverlayGuard />
          {/* Barra inferior fija para móviles bajo rutas /home */}
          <MobileBottomBar />
        </RootProviders>

        <Toaster richColors={true} theme={theme} position="top-center" />
      </body>
    </html>
  );
}

async function getCspNonce() {
  const headersStore = await headers();

  return headersStore.get('x-nonce') ?? undefined;
}
