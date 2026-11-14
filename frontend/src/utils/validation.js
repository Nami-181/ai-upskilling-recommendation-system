/** Reusable validation rules. Each returns an error message or '' when valid. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const rules = {
  required: (label) => (value) => (String(value ?? '').trim() ? '' : `${label} is required.`),

  email: (value) => {
    if (!String(value ?? '').trim()) return 'Email address is required.';
    return EMAIL_RE.test(value.trim()) ? '' : 'Enter a valid email address, like name@university.edu.';
  },

  fullName: (value) => {
    const v = String(value ?? '').trim();
    if (!v) return 'Full name is required.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    if (!/^[\p{L}\s.'-]+$/u.test(v)) return 'Name can only contain letters, spaces and . \' -';
    return '';
  },

  loginPassword: (value) => (value ? '' : 'Password is required.'),

  newPassword: (value) => {
    if (!value) return 'Password is required.';
    const failed = passwordChecks(value).filter((c) => !c.met);
    return failed.length ? `Password needs ${failed.map((c) => c.short).join(', ')}.` : '';
  },

  matches: (otherValue, label = 'Passwords') => (value) => {
    if (!value) return 'Please confirm your password.';
    return value === otherValue ? '' : `${label} don’t match.`;
  },

  minLength: (label, min) => (value) =>
    String(value ?? '').trim().length >= min ? '' : `${label} must be at least ${min} characters.`,
};

export function passwordChecks(password = '') {
  return [
    { id: 'length', label: 'At least 8 characters', short: '8+ characters', met: password.length >= 8 },
    { id: 'case', label: 'Upper and lowercase letters', short: 'upper and lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'number', label: 'At least one number', short: 'a number', met: /\d/.test(password) },
    { id: 'symbol', label: 'At least one symbol', short: 'a symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

/** 0 = empty, 1 = weak … 4 = strong */
export function passwordScore(password = '') {
  if (!password) return 0;
  const met = passwordChecks(password).filter((c) => c.met).length;
  const bonus = password.length >= 12 ? 1 : 0;
  return Math.max(1, Math.min(4, met + bonus - (met < 4 ? 1 : 0)));
}

/** Runs a { field: ruleFn } schema against values → { field: message } for failures only. */
export function validate(values, schema) {
  return Object.entries(schema).reduce((errors, [field, rule]) => {
    const message = rule(values[field], values);
    if (message) errors[field] = message;
    return errors;
  }, {});
}
