import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { StatsSection } from '@/components/StatsSection';
import { ExperienceSection } from '@/components/ExperienceSection';
import { ServicesSection } from '@/components/ServicesSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ExperienceSection />
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
