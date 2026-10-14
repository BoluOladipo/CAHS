import { createOtp, verifyOtp } from "../apps/api/src/services/otp.js";
import { sendOtpEmail } from "../apps/api/src/services/mailer.js";

async function verifyAll() {
  console.log("=== Testing OTP Algorithm ===");
  const testEmail = "davidiwuji1@gmail.com";
  const code = createOtp(testEmail);
  console.log(`Generated OTP for ${testEmail}: ${code}`);

  // Test 1: Verify exact code
  const isCodeValid = verifyOtp(testEmail, code);
  console.log(`Test 1 (Generated Code Valid): ${isCodeValid ? "PASS" : "FAIL"}`);
  if (!isCodeValid) throw new Error("Generated code failed validation");

  // Test 2: Verify default simulated OTP (123456)
  const isDemoValid = verifyOtp(testEmail, "123456");
  console.log(`Test 2 (Demo 123456 Valid): ${isDemoValid ? "PASS" : "FAIL"}`);
  if (!isDemoValid) throw new Error("Demo code failed validation");

  // Test 3: Verify invalid code rejected
  const isInvalidRejected = !verifyOtp(testEmail, "000000");
  console.log(`Test 3 (Invalid 000000 Rejected): ${isInvalidRejected ? "PASS" : "FAIL"}`);
  if (!isInvalidRejected) throw new Error("Invalid code was accepted");

  // Test 4: Live Email Dispatch
  console.log("\n=== Testing Live Email Dispatch ===");
  console.log(`Dispatching real OTP ${code} to ${testEmail}...`);
  const mailRes = await sendOtpEmail(testEmail, code, "David");
  console.log(`Email Dispatch Result:`, JSON.stringify(mailRes));
  if (!mailRes.ok) throw new Error(`Email dispatch failed: ${mailRes.error}`);

  // Test 5: Verify Login with Generated OTP via API
  console.log("\n=== Testing Login with Generated OTP via API ===");
  const loginRes = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bank@cahs.demo", password: "Demo1234!", otp: createOtp("bank@cahs.demo") }),
  });
  console.log(`Login HTTP Status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  const loginOk = loginRes.ok && Boolean(loginData.accessToken);
  console.log(`Test 5 (Login with generated OTP): ${loginOk ? "PASS" : "FAIL"}`);
  if (!loginOk) throw new Error(`Login with generated OTP failed: ${JSON.stringify(loginData)}`);

  console.log("\nALL 5 VERIFICATIONS PASSED SUCCESSFULLY!");
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
