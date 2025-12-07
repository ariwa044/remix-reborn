import heritageBankBuilding from '@/assets/heritage-bank-building.jpg';
import peopleInBank from '@/assets/people-in-bank.jpg';
import mobileBankingUsers from '@/assets/mobile-banking-users.jpg';

const experiences = [
  {
    image: heritageBankBuilding,
    title: 'Blockchain-Powered Security',
    description: 'BITPAY INC uses cutting-edge blockchain technology to ensure your transactions are secure, transparent, and instant.',
  },
  {
    image: peopleInBank,
    title: 'Global Payment Solutions',
    description: 'Send money anywhere in the world instantly with low fees. We support both traditional and cryptocurrency payments.',
  },
  {
    image: mobileBankingUsers,
    title: 'Crypto-Friendly Banking',
    description: 'Access your BITPAY INC account anywhere, anytime. Buy, sell, and trade crypto alongside traditional banking services.',
  },
];

export const ExperienceSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Experience Digital Banking
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover why millions trust BITPAY INC for their financial journey. From crypto-friendly banking to instant global payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">{exp.title}</h3>
                <p className="text-muted-foreground">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
