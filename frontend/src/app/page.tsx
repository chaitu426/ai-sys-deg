import { NavbarDemo } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import FeaturesSectionDemo from '../components/ui/features-section-demo-2';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { CallToAction } from './components/Calltoact';
import { Footer } from './components/Footer';
import { PricingSection } from './components/Pricing';
export default function Home() {
  return (
    <>
      <NavbarDemo />

      <main className="min-h-screen">
        <Hero />
        <Features />
        <FeaturesSectionDemo />
        <section id="pricing">
          <PricingSection />
        </section>
        <Testimonials />
        <FAQ />
        <CallToAction />
        <Footer />
      </main>
    </>
  );
}
