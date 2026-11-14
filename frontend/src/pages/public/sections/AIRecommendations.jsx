import { Sparkles, Scale, MessageSquareText, RefreshCw } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import { RecommendationList } from '../../../components/cards/PreviewCards';

const POINTS = [
  { icon: Scale, title: 'Weighed against your target role', body: 'Gaps that matter most for the career you chose come first.' },
  { icon: MessageSquareText, title: 'Always explained', body: 'Every course, project and certification says why it was suggested.' },
  { icon: RefreshCw, title: 'Refreshed as you learn', body: 'Completing milestones and quizzes updates what comes next.' },
];

export default function AIRecommendations() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="AI-powered recommendations"
            title={
              <>
                Recommendations that <em>explain themselves.</em>
              </>
            }
            description="LUMORA’s recommendation engine compares your profile with your target role and suggests the courses, projects and certifications that close the most important gaps first."
          />
          <ul className="mt-10 space-y-6">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender/70 text-lavender-deep">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[15.5px] font-medium">{title}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -inset-6 -z-10 rounded-[40px] bg-lavender/35" />
          <p className="mb-4 flex items-center gap-2 text-[13px] font-medium text-plum">
            <Sparkles className="h-4 w-4" /> Recommended for you this week
          </p>
          <RecommendationList />
        </div>
      </div>
    </section>
  );
}
