import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import Button from '../../../components/common/Button';
import { AssistantPreview } from '../../../components/cards/PreviewCards';
import { FEATURES } from '../../../data/publicContent';

export default function Features() {
  const grid = FEATURES.filter((f) => f.id !== 'assistant');

  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything you need to grow, <em>thoughtfully arranged.</em>
            </>
          }
        />
        <div className="max-w-sm md:pb-2">
          <p className="text-[15px] leading-relaxed text-muted">
            Each tool works from the same profile, so your skill gaps, roadmap and recommendations always agree with
            each other.
          </p>
          <Button to="/features" variant="link" rightIcon={ArrowRight} className="mt-4">
            Explore every feature
          </Button>
        </div>
      </div>

      {/* Hairline grid — editorial, not a stack of boxes */}
      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {grid.map(({ id, icon: Icon, tint, title, short }) => (
          <Link key={id} to={`/features#${id}`} className="group bg-cream p-8 transition-colors duration-500 hover:bg-paper md:p-10">
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${tint} transition-transform duration-500 group-hover:scale-105`}>
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <h3 className="mt-7 text-[26px] leading-tight font-medium">{title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{short}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-plum opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid items-center gap-10 overflow-hidden rounded-3xl bg-lavender/45 p-8 md:grid-cols-[1fr_auto] md:p-12">
        <div className="max-w-lg">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper text-lavender-deep">
            <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <h3 className="mt-6 text-[32px] leading-tight font-medium">AI Learning Assistant</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Ask why a course was recommended, what to learn next, or for a weekly schedule that respects your
            timetable. Answers draw on your own profile and roadmap.
          </p>
          <Button to="/features#assistant" variant="link" rightIcon={ArrowRight} className="mt-6">
            How the assistant works
          </Button>
        </div>
        <AssistantPreview />
      </div>
    </section>
  );
}
