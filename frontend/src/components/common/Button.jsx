import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-ink text-cream hover:bg-ink-soft shadow-[0_8px_20px_-10px_rgba(57,52,61,0.55)]',
  secondary:
    'bg-paper text-ink border border-line hover:border-mauve/70 hover:bg-white',
  soft: 'bg-blush/70 text-ink hover:bg-blush',
  ghost: 'text-ink hover:bg-sand/50',
  link: 'text-plum underline-offset-4 hover:underline px-0! h-auto!',
};

const SIZES = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-[15px] gap-2.5',
  icon: 'h-10 w-10 justify-center',
};

/**
 * One button for the whole app.
 * - `to`   → renders a React Router <Link>
 * - `href` → renders an <a> (anchors, external links)
 * - otherwise a <button>
 */
export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  const classes = cn(
    'group inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
    'transition-all duration-300 ease-out select-none',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const content = (
    <>
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      )}
      {children}
      {RightIcon && !loading && (
        <RightIcon
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
          strokeWidth={1.75}
          aria-hidden
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {content}
      </a>
    );
  }

  const Component = as || 'button';
  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </Component>
  );
}
