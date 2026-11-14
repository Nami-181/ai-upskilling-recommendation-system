import Hero from './sections/Hero';
import AboutIntro from './sections/AboutIntro';
import WhyLumora from './sections/WhyLumora';
import Features from './sections/Features';
import HowItWorks from './sections/HowItWorks';
import AIRecommendations from './sections/AIRecommendations';
import PreviewShowcase from './sections/PreviewShowcase';
import Benefits from './sections/Benefits';
import Testimonials from './sections/Testimonials';
import FaqPreview from './sections/FaqPreview';
import CallToAction from '../../components/cards/CallToAction';

/** SCREEN 1 — Landing page */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <AboutIntro />
      <WhyLumora />
      <Features />
      <HowItWorks />
      <AIRecommendations />
      <PreviewShowcase />
      <Benefits />
      <Testimonials />
      <FaqPreview />
      <CallToAction />
    </>
  );
}
