import { CreditCard, Home, TrendingUp, Briefcase, PiggyBank, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const services = [
  {
    icon: CreditCard,
    title: 'Personal Banking',
    description: 'Checking, savings, and premium account options with competitive rates and no hidden fees.',
    features: ['Zero monthly fees', 'Global ATM access', 'Mobile check deposit', '24/7 customer support'],
  },
  {
    icon: Home,
    title: 'Home Loans & Mortgages',
    description: 'Competitive mortgage rates and personalized home financing solutions for your dream home.',
    features: ['Low interest rates', 'Quick pre-approval', 'First-time buyer programs', 'Refinancing options'],
  },
  {
    icon: TrendingUp,
    title: 'Investment Services',
    description: 'Comprehensive wealth management and investment advisory services to grow your portfolio.',
    features: ['Portfolio management', 'Retirement planning', 'Risk assessment', 'Market insights'],
  },
  {
    icon: Briefcase,
    title: 'Business Banking',
    description: 'Tailored banking solutions for businesses of all sizes, from startups to enterprises.',
    features: ['Business accounts', 'Commercial loans', 'Payroll services', 'Merchant solutions'],
  },
  {
    icon: PiggyBank,
    title: 'Savings & CDs',
    description: 'High-yield savings accounts and certificates of deposit to maximize your returns.',
    features: ['Competitive APY', 'No minimum balance', 'Flexible terms', 'FDIC insured'],
  },
  {
    icon: Shield,
    title: 'Security & Insurance',
    description: 'Comprehensive insurance products and advanced security features to protect what matters.',
    features: ['Identity protection', 'Fraud monitoring', 'Insurance coverage', 'Secure transactions'],
  },
];

export const ServicesSection = () => {
  return (
    <section id="services" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Premium Banking Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From everyday banking to complex financial planning, we provide comprehensive solutions tailored to your unique needs and goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-background border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300"
            >
              <service.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-4">{service.description}</p>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10 p-0">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
