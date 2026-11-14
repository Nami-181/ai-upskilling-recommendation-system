import { ArrowRight } from 'lucide-react';
import SectionHeading from '../../../components/common/SectionHeading';
import Accordion from '../../../components/common/Accordion';
import Button from '../../../components/common/Button';
import { FAQS } from '../../../data/publicContent';

const FEATURED = [0, 3, 4, 6, 9].map((i) => FAQS[i]);

export default function FaqPreview() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="FAQ"
            title={
              <>
                Questions, <em>answered.</em>
              </>
            }
            description="The things students ask most before they begin."
          />
          <Button to="/faq" variant="secondary" rightIcon={ArrowRight} className="mt-8">
            View all questions
          </Button>
        </div>
        <Accordion items={FEATURED} />
      </div>
    </section>
  );
}
