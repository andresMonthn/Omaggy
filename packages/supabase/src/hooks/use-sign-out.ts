import { useMutation } from '@tanstack/react-query';

import { useSupabase } from './use-supabase';

/** Hook para cerrar sesión del usuario actual. */
export function useSignOut() {
  const client = useSupabase();

  return useMutation({
    mutationFn: () => {
      return client.auth.signOut();
    },
  });
}
