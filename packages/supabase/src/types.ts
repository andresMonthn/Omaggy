/**
 * @name JWTUserData
 * @description Datos de usuario mapeados desde los claims del JWT.
 */
export type JWTUserData = {
  is_anonymous: boolean;
  aal: `aal1` | `aal2`;
  email: string;
  phone: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  id: string;
};
