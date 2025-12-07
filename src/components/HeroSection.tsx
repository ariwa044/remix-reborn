import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import bitpayLogo from '@/assets/bitpay-logo.png';

const features = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Advanced encryption and fraud protection',
  },
  {
    icon: TrendingUp,
    title: 'Investment Growth',
    description: 'Portfolio management and wealth building',
  },
  {
    icon: Globe,
    title: 'Global Banking',
    description: 'International transfers and currency exchange',
  },
  {
    icon: Smartphone,
    title: '24/7 Digital Access',
    description: 'Mobile banking and instant notifications',
  },
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOpenAccount = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleViewAccount = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-background/90" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-2xl">
            <img src={bitpayLogo} alt="BitPay" className="h-16 w-auto" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
          The Future of Digital Finance
        </h1>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6">
          <span className="text-foreground">Your Financial Future </span>
          <span className="text-primary">Starts Here</span>
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Experience premium banking with cutting-edge technology, personalized service, and the trust of generations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            onClick={handleOpenAccount}
          >
            {user ? 'Go to Dashboard' : 'Open an Account'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-foreground/30 text-foreground hover:bg-foreground/10"
            onClick={handleViewAccount}
          >
            VIEW ACCOUNT
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-colors"
            >
              <feature.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
