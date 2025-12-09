import { useMemo } from 'react';

import { getSupabaseBrowserClient } from '../clients/browser-client';
import { Database } from '../database.types';

/** Hook que devuelve una instancia de Supabase para el navegador. */
export function useSupabase<Db = Database>() {
  return useMemo(() => getSupabaseBrowserClient<Db>(), []);
}
