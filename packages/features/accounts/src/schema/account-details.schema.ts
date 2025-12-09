/** Esquema Zod para actualizar detalles del perfil de la cuenta. */
import { z } from 'zod';

export const AccountDetailsSchema = z.object({
  displayName: z.string().min(2).max(100),
});
