/**
 * Minimal pastel illustration for the auth screens:
 * layered hills, a winding learning path with milestones, and a rising light.
 * Pure SVG + design tokens, so it stays crisp and on-palette.
 */
export default function PathIllustration({ className }) {
  return (
    <svg viewBox="0 0 480 360" className={className} role="img" aria-label="A winding path over soft hills towards a rising light">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-paper)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-paper)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* light */}
      <circle cx="318" cy="118" r="120" fill="url(#glow)" />
      <circle cx="318" cy="118" r="44" fill="var(--color-mauve)" opacity="0.55" />
      <circle cx="318" cy="118" r="62" fill="none" stroke="var(--color-mauve)" strokeOpacity="0.35" />
      <circle cx="318" cy="118" r="84" fill="none" stroke="var(--color-mauve)" strokeOpacity="0.18" />

      {/* hills */}
      <path d="M0 236 C 90 196, 170 206, 250 228 S 400 250, 480 214 L480 360 L0 360 Z" fill="var(--color-lavender)" />
      <path d="M0 270 C 110 238, 210 250, 300 270 S 430 286, 480 262 L480 360 L0 360 Z" fill="var(--color-blush)" />
      <path d="M0 308 C 120 284, 240 294, 340 312 S 450 322, 480 306 L480 360 L0 360 Z" fill="var(--color-sage)" />

      {/* path */}
      <path
        d="M70 352 C 120 320, 210 330, 220 296 S 170 252, 236 236 S 300 214, 312 168"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M70 352 C 120 320, 210 330, 220 296 S 170 252, 236 236 S 300 214, 312 168"
        fill="none"
        stroke="var(--color-plum)"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />

      {/* milestones */}
      {[
        [124, 330, 'var(--color-sage-deep)'],
        [214, 300, 'var(--color-sage-deep)'],
        [238, 236, 'var(--color-plum)'],
        [306, 182, 'var(--color-paper)'],
      ].map(([x, y, fill], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="9" fill="var(--color-paper)" stroke="var(--color-plum)" strokeOpacity="0.35" />
          <circle cx={x} cy={y} r="4" fill={fill} stroke={i === 3 ? 'var(--color-plum)' : 'none'} strokeOpacity="0.5" />
        </g>
      ))}

      {/* small sparkles */}
      {[
        [120, 92],
        [404, 196],
        [190, 150],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 7} L${x + 1.6} ${y - 1.6} L${x + 7} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 7} L${x - 1.6} ${y + 1.6} L${x - 7} ${y} L${x - 1.6} ${y - 1.6} Z`} fill="var(--color-mauve)" opacity="0.6" />
      ))}
    </svg>
  );
}
