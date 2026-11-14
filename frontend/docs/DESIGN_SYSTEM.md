# LUMORA — Design System

*Pastel academia · minimalist editorial · calm productivity.*

All tokens are defined once in `src/index.css` (`@theme { … }`). Tailwind v4 generates utilities
from them automatically, so `--color-blush` becomes `bg-blush`, `text-blush`, `border-blush/60`, etc.

## Colour

| Role | Token | Hex | Typical use |
|------|-------|-----|-------------|
| Background | `cream` | `#F8F3EF` | Page background |
| Secondary background | `linen` | `#F2EBE8` | Alternate bands, auth side panel, inputs at rest |
| Dusty pink | `blush` | `#EADCE8` | Active nav, highlights, soft buttons |
| Lavender | `lavender` | `#DDD7EF` | AI / assistant surfaces, info |
| Sage | `sage` | `#DCE8DF` | Success, completion, growth |
| Soft beige | `sand` | `#E8E0D5` | Tracks, neutral chips, hover fills |
| Muted mauve | `mauve` | `#B9A6B8` | Focus rings, progress fills, dividers accent |
| Dark text | `ink` | `#39343D` | Body text, primary buttons |
| Secondary text | `muted` | `#827B84` | Captions, helper text |
| White | `white` / `paper` | `#FFFFFF` / `#FCFAF8` | Raised surfaces |

Supporting tones (for readable text/icons *on* pastel fills): `plum #6F5B6E`, `blush-deep #A2788F`,
`lavender-deep #7B72A4`, `sage-deep #64836D`, `sand-deep #9A8770`, `line #E7DED7` (hairlines).

Semantic mapping: **success → sage**, **error → blush-deep**, **info / AI → lavender**, **warning → sand-deep**.
No neon, no dark mode, gradients only as soft blurred light washes.

## Typography

| Style | Font | Size / leading | Use |
|-------|------|----------------|-----|
| Display | Cormorant Garamond 500 | 52–80px / 0.98 | Hero headlines |
| H2 | Cormorant Garamond 500 | 40–52px / 1.05 | Section titles |
| H3 | Cormorant Garamond 500 | 24–32px / 1.15 | Card & feature titles |
| Body | DM Sans 400 | 15–17px / 1.6 | Paragraphs |
| UI | DM Sans 500 | 13–14px | Buttons, labels, nav |
| Eyebrow | DM Sans 500 caps, 0.22em tracking | 11px | Labels above headings |

Italic serif in `plum` is the signature accent for a phrase in headings: *“of its own.”*

## Shape, space, elevation

- Radius: inputs & buttons fully rounded (pills) or `rounded-xl`; cards `rounded-2xl`; feature panels `rounded-3xl`.
- Borders: 1px `line`. Prefer hairline grids and dividers over stacking boxes.
- Shadows: `shadow-hair`, `shadow-soft` (cards on hover, popovers), `shadow-lift` (modals, toasts, previews).
- Spacing: 4px base; sections `py-24`–`py-32`; card padding 24–40px.

## Motion

- `animate-fade-up` (entrances), `animate-fade-in` (overlays), `animate-toast-in`, `animate-scale-in` (modals).
- Durations 200–700ms with `--ease-soft`. Hover: `-translate-y-0.5`, colour shifts, arrow nudges.
- `prefers-reduced-motion` disables animation globally.

## Components (src/components)

| Folder | Components |
|--------|-----------|
| `common/` | Button, Badge, Card, Logo, SectionHeading, ProgressBar, ProgressRing, Spinner, ScrollToTop |
| `forms/` | TextField, PasswordField, Checkbox, PasswordStrength, FormAlert, TextArea |
| `modals/` | Modal, ConfirmDialog |
| `navigation/` | Navbar (public), Sidebar, Topbar, ProfileMenu, NotificationsMenu |
| `layout/` | PublicLayout, AuthLayout, DashboardLayout, Footer |
| `cards/` | FeatureVisuals, preview cards (reused on landing & features) |
| `charts/` | Recharts wrappers (Phase 3+) |

## States checklist (every interactive component)

Default · Hover · Active/pressed · Focus-visible (mauve outline) · Disabled (50% opacity, no pointer) ·
Loading (spinner, `aria-busy`) · Error (blush-deep border + message) · Success (sage).
