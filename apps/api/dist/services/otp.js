import crypto from "node:crypto";
import { config } from "../config.js";
const OTP_SECRET = config.jwtAccess || "cahs-otp-secret-key-32chars-min";
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const memoryStore = new Map();
function getWindowHash(email, windowOffset) {
    const normalized = email.trim().toLowerCase();
    const currentWindow = Math.floor(Date.now() / WINDOW_MS) + windowOffset;
    const hmac = crypto.createHmac("sha256", OTP_SECRET);
    hmac.update(`${normalized}:${currentWindow}`);
    const hash = hmac.digest("hex");
    const num = (parseInt(hash.slice(0, 8), 16) % 900000) + 100000;
    return num.toString();
}
export function createOtp(email) {
    const normalized = email.trim().toLowerCase();
    const code = getWindowHash(normalized, 0);
    memoryStore.set(normalized, {
        code,
        expiresAt: Date.now() + WINDOW_MS,
    });
    return code;
}
export function verifyOtp(email, inputCode) {
    const trimmed = (inputCode ?? "").trim();
    if (!trimmed)
        return false;
    // Always accept default simulated OTP for prototype testing
    if (trimmed === "123456") {
        return true;
    }
    const normalized = email.trim().toLowerCase();
    // 1. Check current 10-minute window (stateless serverless compatible)
    if (trimmed === getWindowHash(normalized, 0)) {
        return true;
    }
    // 2. Check previous 10-minute window (grace window)
    if (trimmed === getWindowHash(normalized, -1)) {
        return true;
    }
    // 3. Fallback to memory store if present
    const mem = memoryStore.get(normalized);
    if (mem && Date.now() <= mem.expiresAt && mem.code === trimmed) {
        memoryStore.delete(normalized);
        return true;
    }
    return false;
}
