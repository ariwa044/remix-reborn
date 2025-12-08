import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { ArrowLeft, CreditCard, Shield, Wifi, Lock, CheckCircle } from 'lucide-react';

interface CardData {
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  cvv: string;
  card_type: string;
  status: string;
}

export default function ATMCard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [card, setCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchCard = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('atm_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCard(data);
      }
      setIsLoading(false);
    };

    fetchCard();
  }, [user]);

  const formatCardNumber = (num: string) => {
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={bitpayLogo} alt="Heritage Bank" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">My Card</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {card ? (
          <>
            {/* Card Display with Flip Animation */}
            <div className="mb-8">
              <p className="text-center text-muted-foreground text-sm mb-4">Tap card to view CVV</p>
              <div 
                className="relative w-full max-w-[340px] mx-auto cursor-pointer"
                style={{ perspective: '1000px' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className="relative w-full transition-transform duration-700"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front of Card */}
                  <div 
                    className="w-full aspect-[1.586/1] rounded-2xl p-5 shadow-2xl"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                    }}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 overflow-hidden rounded-2xl">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <p className="text-white/60 text-xs font-medium tracking-wider">HERITAGE BANK</p>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-5 w-5 text-white/60 rotate-90" />
                          <div className="w-9 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md" />
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="my-4">
                        <p className="text-white text-lg md:text-xl font-mono tracking-[0.2em]">
                          {formatCardNumber(card.card_number)}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-white/50 text-[10px] uppercase mb-1">Card Holder</p>
                          <p className="text-white font-semibold text-sm uppercase tracking-wide">{card.card_holder_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/50 text-[10px] uppercase mb-1">Expires</p>
                          <p className="text-white font-mono text-sm">{card.expiry_date}</p>
                        </div>
                        {/* Visa Logo */}
                        <div className="flex flex-col items-end">
                          <svg viewBox="0 0 48 16" className="h-8 w-auto">
                            <path fill="#fff" d="M19.4 1.3L15.3 14.7H12.1L9.4 4.2C9.2 3.5 9.1 3.2 8.5 2.9C7.5 2.4 5.9 2 4.5 1.7L4.6 1.3H10C10.9 1.3 11.6 1.9 11.8 2.9L13.4 11.5L16.5 1.3H19.4ZM32.7 10.5C32.7 7 27.8 6.8 27.9 5.2C27.9 4.7 28.4 4.1 29.4 4C29.9 3.9 31.4 3.9 33 4.6L33.6 1.7C32.7 1.4 31.6 1 30.2 1C27.4 1 25.4 2.5 25.4 4.6C25.4 6.2 26.8 7.1 27.9 7.6C29 8.2 29.4 8.5 29.4 9C29.3 9.8 28.4 10.1 27.5 10.1C25.7 10.1 24.6 9.6 23.8 9.3L23.2 12.3C24.1 12.7 25.6 13 27.2 13C30.2 13 32.7 11.6 32.7 10.5ZM40.6 14.7H43.4L41 1.3H38.4C37.6 1.3 37 1.7 36.7 2.4L32.3 14.7H35.5L36.1 13H40L40.6 14.7ZM37 10.6L38.5 5.9L39.4 10.6H37ZM24.8 1.3L22.3 14.7H19.2L21.7 1.3H24.8Z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div 
                    className="absolute inset-0 w-full aspect-[1.586/1] rounded-2xl shadow-2xl"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                    }}
                  >
                    {/* Magnetic Stripe */}
                    <div className="absolute top-8 left-0 right-0 h-10 bg-gray-900" />
                    
                    {/* CVV Section */}
                    <div className="absolute top-24 left-4 right-4">
                      <div className="flex items-center">
                        <div className="flex-1 h-8 bg-white rounded-l flex items-center justify-end pr-2">
                          <div className="flex gap-0.5">
                            {[...Array(16)].map((_, i) => (
                              <span key={i} className="text-gray-400 text-xs">X</span>
                            ))}
                          </div>
                        </div>
                        <div className="w-12 h-8 bg-white flex items-center justify-center rounded-r border-l border-gray-300">
                          <span className="text-gray-900 font-mono font-bold text-sm">{card.cvv}</span>
                        </div>
                      </div>
                      <p className="text-white/50 text-[10px] mt-2 text-right">CVV</p>
                    </div>

                    {/* Card Info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white/40 text-[8px] leading-relaxed">
                        This card is property of Heritage Bank. Use of this card is subject to the card member agreement.
                        If found, please return to any Heritage Bank branch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Status */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${card.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-foreground font-medium">Card Status</span>
              </div>
              <span className={`capitalize font-semibold ${card.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                {card.status}
              </span>
            </div>

            {/* Card Features */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-foreground">Card Features</h3>
              
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="bg-primary/10 rounded-lg p-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Fraud Protection</p>
                  <p className="text-sm text-muted-foreground">24/7 monitoring for suspicious activity</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="bg-primary/10 rounded-lg p-3">
                  <Wifi className="h-5 w-5 text-primary rotate-90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Contactless Payments</p>
                  <p className="text-sm text-muted-foreground">Tap to pay at supported terminals</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="bg-green-500/10 rounded-lg p-3">
                  <Lock className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Chip & PIN Security</p>
                  <p className="text-sm text-muted-foreground">EMV chip for secure transactions</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>

            <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Card Found</h2>
            <p className="text-muted-foreground mb-6">Your virtual card is being generated. Please check back later.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}