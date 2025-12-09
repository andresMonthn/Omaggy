import 'server-only';

import {
  AuthError,
  type EmailOtpType,
  SupabaseClient,
} from '@supabase/supabase-js';

/**
 * @name createAuthCallbackService
 * @description Crea una instancia del servicio de callbacks de autenticación.
 * @param client
 */
export function createAuthCallbackService(client: SupabaseClient) {
  return new AuthCallbackService(client);
}

/**
 * @name AuthCallbackService
 * @description Servicio para gestionar callbacks de autenticación en Supabase.
 */
class AuthCallbackService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * @name verifyTokenHash
   * @description Verifica `token_hash` y tipo, y decide la ruta de redirección.
   * Se usa para validar el email del usuario mediante enlaces de verificación.
   * @param request
   * @param params
   */
  async verifyTokenHash(
    request: Request,
    params: {
      joinTeamPath: string;
      redirectPath: string;
      errorPath?: string;
    },
  ): Promise<URL> {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const host = request.headers.get('host');

    // set the host to the request host since outside of Vercel it gets set as "localhost" or "0.0.0.0"
    this.adjustUrlHostForLocalDevelopment(url, host);

    url.pathname = params.redirectPath;

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const callbackParam =
      searchParams.get('next') ?? searchParams.get('callback');

    let nextPath: string | null = null;
    const callbackUrl = callbackParam ? new URL(callbackParam) : null;

    // if we have a callback url, we check if it has a next path
    if (callbackUrl) {
      // if we have a callback url, we check if it has a next path
      const callbackNextPath = callbackUrl.searchParams.get('next');

      // if we have a next path in the callback url, we use that
      if (callbackNextPath) {
        nextPath = callbackNextPath;
      } else {
        nextPath = callbackUrl.pathname;
      }
    }

    const inviteToken = callbackUrl?.searchParams.get('invite_token');
    const errorPath = params.errorPath ?? '/auth/callback/error';

    // remove the query params from the url
    searchParams.delete('token_hash');
    searchParams.delete('type');
    searchParams.delete('next');

    // if we have a next path, we redirect to that path
    if (nextPath) {
      url.pathname = nextPath;
    }

    // if we have an invite token, we append it to the redirect url
    if (inviteToken) {
      // if we have an invite token, we redirect to the join team page
      // instead of the default next url. This is because the user is trying
      // to join a team and we want to make sure they are redirected to the
      // correct page.
      url.pathname = params.joinTeamPath;
      searchParams.set('invite_token', inviteToken);

      const emailParam = callbackUrl?.searchParams.get('email');

      if (emailParam) {
        searchParams.set('email', emailParam);
      }
    }

    if (token_hash && type) {
      const { error } = await this.client.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return url;
      }

      if (error.code) {
        url.searchParams.set('code', error.code);
      }

      const errorMessage = getAuthErrorMessage({
        error: error.message,
        code: error.code,
      });

      url.searchParams.set('error', errorMessage);
    }

    // return the user to an error page with some instructions
    url.pathname = errorPath;

    return url;
  }

  /**
   * @name exchangeCodeForSession
   * @description Intercambia el código de auth por sesión y decide la redirección.
   * @param request
   * @param params
   */
  async exchangeCodeForSession(
    request: Request,
    params: {
      joinTeamPath: string;
      redirectPath: string;
      errorPath?: string;
    },
  ): Promise<{
    nextPath: string;
  }> {
    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;

    const authCode = searchParams.get('code');
    const error = searchParams.get('error');
    const nextUrlPathFromParams = searchParams.get('next');
    const inviteToken = searchParams.get('invite_token');
    const errorPath = params.errorPath ?? '/auth/callback/error';

    let nextUrl = nextUrlPathFromParams ?? params.redirectPath;

    // if we have an invite token, we redirect to the join team page
    // instead of the default next url. This is because the user is trying
    // to join a team and we want to make sure they are redirected to the
    // correct page.
    if (inviteToken) {
      const emailParam = searchParams.get('email');

      const urlParams = new URLSearchParams({
        invite_token: inviteToken,
        email: emailParam ?? '',
      });

      nextUrl = `${params.joinTeamPath}?${urlParams.toString()}`;
    }

    if (authCode) {
      try {
        const { error } =
          await this.client.auth.exchangeCodeForSession(authCode);

        // if we have an error, we redirect to the error page
        if (error) {
          return onError({
            code: error.code,
            error: error.message,
            path: errorPath,
          });
        }
      } catch (error) {
        console.error(
          {
            error,
            name: `auth.callback`,
          },
          `An error occurred while exchanging code for session`,
        );

        const message = error instanceof Error ? error.message : error;

        return onError({
          code: (error as AuthError)?.code,
          error: message as string,
          path: errorPath,
        });
      }
    }

    if (error) {
      return onError({
        error,
        path: errorPath,
      });
    }

    return {
      nextPath: nextUrl,
    };
  }

  private adjustUrlHostForLocalDevelopment(url: URL, host: string | null) {
    if (this.isLocalhost(url.host) && !this.isLocalhost(host)) {
      url.host = host as string;
      url.port = '';
    }
  }

  private isLocalhost(host: string | null) {
    if (!host) {
      return false;
    }

    return (
      host.includes('localhost:') ||
      host.includes('0.0.0.0:') ||
      host.includes('127.0.0.1:')
    );
  }
}

function onError({
  error,
  path,
  code,
}: {
  error: string;
  path: string;
  code?: string;
}) {
  const errorMessage = getAuthErrorMessage({ error, code });

  console.error(
    {
      error: JSON.stringify(error).replace(/["\\]/g, '\\$&'),
      name: `auth.callback`,
    },
    `An error occurred while signing user in`,
  );

  const searchParams = new URLSearchParams({
    error: errorMessage,
    code: code ?? '',
  });

  const nextPath = `${path}?${searchParams.toString()}`;

  return {
    nextPath,
  };
}

  /**
   * Determina si el mensaje indica error del verificador (flujo PKCE).
   * Suele ocurrir al abrir el enlace en un navegador distinto al originario.
   */
  function isVerifierError(error: string) {
  return error.includes('both auth code and code verifier should be non-empty');
}

function getAuthErrorMessage(params: { error: string; code?: string }) {
  // this error arises when the user tries to sign in with an expired email link
  if (params.code) {
    if (params.code === 'otp_expired') {
      return 'auth:errors.otp_expired';
    }
  }

  // this error arises when the user is trying to sign in with a different
  // browser than the one they used to request the sign in link
  if (isVerifierError(params.error)) {
    return 'auth:errors.codeVerifierMismatch';
  }

  // fallback to the default error message
  return `auth:authenticationErrorAlertBody`;
}
