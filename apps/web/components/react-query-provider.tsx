'use client';

/** Proveedor React Query. Función: Configura `QueryClient` con opciones por defecto y expone el contexto para consultas y caché. */

import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function ReactQueryProvider(props: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
