export function validatePasswordRules(password) {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(rules).every(Boolean);

  return { rules, isValid };
}
