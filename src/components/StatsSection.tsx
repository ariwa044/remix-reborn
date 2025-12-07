const stats = [
  {
    value: '2.5M+',
    label: 'Trusted Customers',
    description: 'Banking with confidence',
  },
  {
    value: '$145B',
    label: 'Assets Under Management',
    description: 'Growing your wealth',
  },
  {
    value: '4.8%',
    label: 'Average Savings APY',
    description: 'Competitive returns',
  },
  {
    value: '135+',
    label: 'Years of Excellence',
    description: 'Digital finance innovation',
  },
];

export const StatsSection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Banking Excellence by the Numbers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our commitment to financial excellence is reflected in our growth, customer satisfaction, and the trust placed in us by millions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{stat.label}</h3>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
