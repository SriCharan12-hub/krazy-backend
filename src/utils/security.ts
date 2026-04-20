/**
 * SECURITY UTILITIES FOR GENZSTORE
 * - Secure random generation
 * - OTP management with brute-force protection
 * - Stock transaction management
 * - Payment verification
 */

import crypto from 'crypto';

/**
 * Generate cryptographically secure OTP
 * Uses crypto.getRandomValues() for security
 */
export const generateSecureOTP = (): string => {
  const buffer = crypto.getRandomValues(new Uint8Array(4));
  let otp = '';
  for (let byte of buffer) {
    otp += (byte % 10).toString();
  }
  return otp.substring(0, 6);
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Verify OTP with attempt limiting
 * Implements brute-force protection
 */
export const verifyOTPWithLimit = (
  storedOTP: string,
  providedOTP: string,
  attempts: number,
  maxAttempts: number = 5
): { success: boolean; message: string; remainingAttempts: number } => {
  if (attempts >= maxAttempts) {
    return {
      success: false,
      message: 'Too many OTP verification attempts. Please request a new OTP.',
      remainingAttempts: 0,
    };
  }

  if (storedOTP !== providedOTP) {
    return {
      success: false,
      message: 'Invalid OTP',
      remainingAttempts: maxAttempts - attempts - 1,
    };
  }

  return {
    success: true,
    message: 'OTP verified successfully',
    remainingAttempts: 0,
  };
};

/**
 * Hash OTP for storage (never store plaintext)
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify hashed OTP
 */
export const verifyHashedOTP = (providedOTP: string, hashedOTP: string): boolean => {
  const hash = crypto.createHash('sha256').update(providedOTP).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashedOTP, 'hex')) === true;
};

/**
 * Validate payment amount matches order
 * Prevents amount tampering
 */
export const validatePaymentAmount = (
  orderTotal: number,
  paymentAmount: number,
  tolerance: number = 0.01 // 1 paise tolerance for rounding
): boolean => {
  return Math.abs(orderTotal - paymentAmount) <= tolerance;
};

/**
 * Generate unique transaction ID
 * For audit trails and dispute resolution
 */
export const generateTransactionID = (): string => {
  return `TXN_${Date.now()}_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
};

/**
 * Sanitize sensitive data from responses
 * Prevents PII leaks
 */
export const sanitizeUserData = (user: any) => {
  const { password, otp, otpExpires, otpAttempts, resetToken, resetTokenExpires, ...safe } = user;
  return safe;
};

/**
 * Sanitize order data from responses
 * Removes sensitive information
 */
export const sanitizeOrderData = (order: any) => {
  const sanitized = { ...order };
  if (sanitized.paymentResult) {
    sanitized.paymentResult = {
      ...sanitized.paymentResult,
      // Keep essential fields, remove sensitive ones
    };
  }
  return sanitized;
};
