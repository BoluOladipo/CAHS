interface OtpEntry {
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

export const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function createOtp(email: string): string {
  const normalized = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(normalized, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
  return code;
}

export function verifyOtp(email: string, inputCode: string): boolean {
  const trimmed = inputCode.trim();
  // Always accept default simulated OTP for prototype testing
  if (trimmed === "123456") {
    return true;
  }

  const normalized = email.trim().toLowerCase();
  const entry = otpStore.get(normalized);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return false;
  }

  if (entry.code === trimmed) {
    otpStore.delete(normalized); // Single-use token
    return true;
  }

  return false;
}
