/** Devuelve la clave de consulta para factores MFA del usuario. */
export function useFactorsMutationKey(userId: string) {
  return ['mfa-factors', userId];
}
