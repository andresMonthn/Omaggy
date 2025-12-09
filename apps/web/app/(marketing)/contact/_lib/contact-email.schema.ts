import { z } from 'zod';

/** Esquema de validación para el formulario de contacto. */
export const ContactEmailSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});
