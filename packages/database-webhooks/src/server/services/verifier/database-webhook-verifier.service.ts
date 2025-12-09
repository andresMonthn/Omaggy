/** Contexto: Verificador de firma. Función: Contrato para validar encabezado de firma del webhook y lanzar error si inválido. */
export abstract class DatabaseWebhookVerifierService {
  abstract verifySignatureOrThrow(header: string): Promise<boolean>;
}
