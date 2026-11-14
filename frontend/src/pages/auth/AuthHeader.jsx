/** Heading block shared by every auth screen. */
export default function AuthHeader({ icon: Icon, tint = 'bg-blush/70 text-plum', eyebrow, title, description }) {
  return (
    <div className="mb-8">
      {Icon && (
        <span className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full ${tint}`}>
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
      )}
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-[40px] leading-[1.05] font-medium sm:text-[44px] [&_em]:text-plum [&_em]:italic">{title}</h1>
      {description && <div className="mt-3 text-[15px] leading-relaxed text-muted">{description}</div>}
    </div>
  );
}
