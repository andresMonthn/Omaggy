/** Esquema Zod para recuperar el estado de una sesión de checkout. */
import { z } from 'zod';

export const RetrieveCheckoutSessionSchema = z.object({
  sessionId: z.string(),
});
