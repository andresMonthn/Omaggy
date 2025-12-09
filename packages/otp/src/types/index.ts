/** Parámetros para crear un nonce (token de un solo uso). */
export interface CreateNonceParams {
  userId?: string;
  purpose: string;
  expiresInSeconds?: number;
  metadata?: Record<string, unknown>;
  description?: string;
  tags?: string[];
  scopes?: string[];
  revokePrevious?: boolean;
}

/** Parámetros para verificar un nonce. */
export interface VerifyNonceParams {
  token: string;
  purpose: string;
  userId?: string;
  requiredScopes?: string[];
  maxVerificationAttempts?: number;
}

/** Parámetros para revocar un nonce. */
export interface RevokeNonceParams {
  id: string;
  reason?: string;
}

/** Resultado de crear un nonce. */
export interface CreateNonceResult {
  id: string;
  token: string;
  expires_at: string;
  revoked_previous_count?: number;
}

/** Resultado válido al verificar un nonce. */
type ValidNonceResult = {
  valid: boolean;
  user_id?: string;
  metadata?: Record<string, unknown>;
  message?: string;
  scopes?: string[];
  purpose?: string;
};

/** Resultado inválido al verificar un nonce. */
type InvalidNonceResult = {
  valid: false;
  message: string;
  max_attempts_exceeded?: boolean;
};

/** Tipo unión de resultados de verificación de nonce. */
export type VerifyNonceResult = ValidNonceResult | InvalidNonceResult;

/** Parámetros para obtener el estado de un nonce. */
export interface GetNonceStatusParams {
  id: string;
}

/** Resultado exitoso al obtener estado de un nonce. */
type SuccessGetNonceStatusResult = {
  exists: true;
  purpose?: string;
  user_id?: string;
  created_at?: string;
  expires_at?: string;
  used_at?: string;
  revoked?: boolean;
  revoked_reason?: string;
  verification_attempts?: number;
  last_verification_at?: string;
  last_verification_ip?: string;
  is_valid?: boolean;
};

/** Resultado fallido al obtener estado de un nonce. */
type FailedGetNonceStatusResult = {
  exists: false;
};

/** Tipo unión de resultados al obtener estado de un nonce. */
export type GetNonceStatusResult =
  | SuccessGetNonceStatusResult
  | FailedGetNonceStatusResult;

/** Parámetros para enviar un email con OTP. */
export interface SendOtpEmailParams {
  email: string;
  otp: string;
}
