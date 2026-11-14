/** Keep only the fields the session needs from a full profile response (no skills/courses lists). */
const SESSION_KEYS = ['id', 'firstName', 'lastName', 'email', 'role', 'verified', 'onboardingComplete',
  'profileCompletion', 'targetRole', 'targetRoleId', 'program', 'year', 'weeklyHoursGoal', 'createdAt'];

export function sessionUser(profile) {
  return Object.fromEntries(SESSION_KEYS.filter((k) => k in profile).map((k) => [k, profile[k]]));
}
