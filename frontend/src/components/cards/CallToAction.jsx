import { ArrowRight } from 'lucide-react';
import Button from '../common/Button';

/** Closing call-to-action band, shared by every public page. */
export default function CallToAction({
  eyebrow = 'Begin today',
  title = (
    <>
      Learn with purpose. <em className="text-plum italic">Grow with direction.</em>
    </>
  ),
  description = 'Build your profile in a few minutes and receive a roadmap shaped around your goals and your week.',
}) {
  return (
    <section className="px-5 pb-24 md:px-8 md:pb-32">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-line bg-paper px-6 py-20 text-center md:py-24">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-blush/70 blur-[90px]" />
          <div className="absolute right-[12%] -bottom-24 h-72 w-72 rounded-full bg-lavender/70 blur-[90px]" />
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-[42px] leading-[1.04] font-medium md:text-[60px]">{title}</h2>
        <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-muted">{description}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button to="/signup" size="lg" rightIcon={ArrowRight}>
            Start Your Journey
          </Button>
          <Button to="/login" size="lg" variant="secondary">
            I already have an account
          </Button>
        </div>
      </div>
    </section>
  );
}
