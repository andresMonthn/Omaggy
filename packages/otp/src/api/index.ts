/** API de OTP: expone métodos para crear, verificar, revocar y enviar por email. */
import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@kit/supabase/database';

import { createOtpEmailService } from '../server/otp-email.service';
import { createOtpService } from '../server/otp.service';
import {
  CreateNonceParams,
  GetNonceStatusParams,
  RevokeNonceParams,
  SendOtpEmailParams,
  VerifyNonceParams,
} from '../types';

/**
 * @name createOtpApi
 * @description Create an instance of the OTP API
 * @param client
 */
export function createOtpApi(client: SupabaseClient<Database>) {
  return new OtpApi(client);
}

/**
 * @name OtpApi
 * @description API for working with one-time tokens/passwords
 */
class OtpApi {
  private readonly service: ReturnType<typeof createOtpService>;
  private readonly emailService: ReturnType<typeof createOtpEmailService>;

  constructor(client: SupabaseClient<Database>) {
    this.service = createOtpService(client);
    this.emailService = createOtpEmailService();
  }

  /**
   * @name sendOtpEmail
   * @description Sends an OTP email to the user
   * @param params
   */
  sendOtpEmail(params: SendOtpEmailParams) {
    return this.emailService.sendOtpEmail(params);
  }

  /**
   * @name createToken
   * @description Creates a new one-time token
   * @param params
   */
  createToken(params: CreateNonceParams) {
    return this.service.createNonce(params);
  }

  /**
   * @name verifyToken
   * @description Verifies a one-time token
   * @param params
   */
  verifyToken(params: VerifyNonceParams) {
    return this.service.verifyNonce(params);
  }

  /**
   * @name revokeToken
   * @description Revokes a one-time token to prevent its use
   * @param params
   */
  revokeToken(params: RevokeNonceParams) {
    return this.service.revokeNonce(params);
  }

  /**
   * @name getTokenStatus
   * @description Gets the status of a one-time token
   * @param params
   */
  getTokenStatus(params: GetNonceStatusParams) {
    return this.service.getNonceStatus(params);
  }
}
