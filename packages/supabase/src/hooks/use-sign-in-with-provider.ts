import type { SignInWithOAuthCredentials } from '@supabase/supabase-js';

import { useMutation } from '@tanstack/react-query';

import { useSupabase } from './use-supabase';

/** Hook para iniciar sesión con proveedores OAuth (Google, GitHub, etc.). */
export function useSignInWithProvider() {
  const client = useSupabase();
  const mutationKey = ['auth', 'sign-in-with-provider'];

  const mutationFn = async (credentials: SignInWithOAuthCredentials) => {
    const response = await client.auth.signInWithOAuth(credentials);

    if (response.error) {
      throw response.error.message;
    }

    return response.data;
  };

  return useMutation({
    mutationFn,
    mutationKey,
  });
}
