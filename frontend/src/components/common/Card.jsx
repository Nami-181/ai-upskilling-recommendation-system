import { cn } from '../../utils/cn';

const TINTS = {
  paper: 'bg-paper/80 border-line',
  white: 'bg-white border-line',
  pink: 'bg-blush/45 border-blush',
  lavender: 'bg-lavender/45 border-lavender',
  sage: 'bg-sage/55 border-sage',
  sand: 'bg-sand/45 border-sand',
};

const PADDING = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

/** Surface for grouped content. Use sparingly — not every section needs a box. */
export default function Card({
  as: Component = 'div',
  tint = 'paper',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'rounded-2xl border',
        TINTS[tint],
        PADDING[padding],
        interactive &&
          'transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:border-mauve/50',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
