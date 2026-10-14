const POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export function isStrongPassword(password) {
    return POLICY.test(password);
}
export const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase and a number.";
