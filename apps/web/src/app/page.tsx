import { PlatformNavbar } from '@/shared/components/layout/platform-navbar';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/landing/hero';
import { FeaturesSection } from '@/components/landing/features';
import { TestimonialsSection } from '@/components/landing/testimonials';
import { PricingSection } from '@/components/landing/pricing';
import { FAQSection } from '@/components/landing/faq';

export default function HomePage() {
  return (
    <>
      <PlatformNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
