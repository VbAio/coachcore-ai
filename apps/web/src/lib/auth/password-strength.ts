export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const score = Math.min(passed, 4);

  return { score, label: labels[score], checks };
}

export function isPasswordStrongEnough(password: string): boolean {
  const { checks } = getPasswordStrength(password);
  return Object.values(checks).every(Boolean);
}
