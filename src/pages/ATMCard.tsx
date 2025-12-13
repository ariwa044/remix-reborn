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
    const fetchOrCreateCard = async () => {
      if (!user) return;

      const { data: existingCard } = await supabase
        .from('atm_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingCard) {
        setCard(existingCard);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const cardNumber = '5' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
      const now = new Date();
      const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
      const expiryYear = String((now.getFullYear() + 5) % 100).padStart(2, '0');
      const expiryDate = `${expiryMonth}/${expiryYear}`;
      const cvv = String(Math.floor(Math.random() * 900) + 100);

      const { data: newCard, error } = await supabase
        .from('atm_cards')
        .insert({
          user_id: user.id,
          card_number: cardNumber,
          card_holder_name: profile?.full_name || user.user_metadata?.full_name || 'CARD HOLDER',
          expiry_date: expiryDate,
          cvv: cvv,
          card_type: 'mastercard',
          status: 'active'
        })
        .select()
        .single();

      if (!error && newCard) {
        setCard(newCard);
      }
      setIsLoading(false);
    };

    fetchOrCreateCard();
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
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={bitpayLogo} alt="BitPay" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">My Card</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {card ? (
          <>
            <div className="mb-8">
              <p className="text-center text-muted-foreground text-sm mb-4">Tap card to view CVV</p>
              <div 
                className="relative w-full max-w-[380px] mx-auto cursor-pointer"
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
                    className="w-full aspect-[1.586/1] rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 30%, #2d2d2d 70%, #1a1a1a 100%)'
                    }}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-red-600/30 to-orange-500/20 rounded-full blur-3xl" />
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-yellow-500/20 to-red-600/30 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-white font-bold text-xl tracking-wider">BITPAY</h2>
                          <p className="text-white/50 text-[10px] tracking-widest">DIGITAL BANK</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Wifi className="h-5 w-5 text-white/70 rotate-90" />
                          <div className="w-12 h-9 rounded-md overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 relative">
                              <div className="absolute inset-1 grid grid-cols-3 gap-[1px]">
                                {[...Array(6)].map((_, i) => (
                                  <div key={i} className="bg-yellow-700/30 rounded-sm" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="my-6">
                        <p className="text-white text-xl md:text-2xl font-mono tracking-[0.25em] drop-shadow-lg">
                          {formatCardNumber(card.card_number)}
                        </p>
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Card Holder</p>
                            <p className="text-white font-semibold text-sm uppercase tracking-wider">
                              {card.card_holder_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider">Valid Thru</p>
                            <p className="text-white font-mono text-sm tracking-wider">{card.expiry_date}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="relative w-16 h-10">
                            <div className="absolute left-0 w-10 h-10 bg-red-600 rounded-full opacity-90" />
                            <div className="absolute right-0 w-10 h-10 bg-yellow-500 rounded-full opacity-90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back of Card */}
                  <div 
                    className="absolute inset-0 w-full aspect-[1.586/1] rounded-2xl shadow-2xl overflow-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)'
                    }}
                  >
                    <div className="absolute top-8 left-0 right-0 h-12 bg-gray-900" />
                    
                    <div className="absolute top-24 left-4 right-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-10 bg-gradient-to-r from-gray-100 to-white rounded flex items-center px-3">
                          <div className="flex-1">
                            <div className="text-gray-400 text-[10px] italic">Authorized Signature</div>
                          </div>
                        </div>
                        <div className="w-16 h-10 bg-white flex items-center justify-center rounded border-l-2 border-gray-200">
                          <span className="text-gray-900 font-mono font-bold text-lg">{card.cvv}</span>
                        </div>
                      </div>
                      <p className="text-white/50 text-[10px] mt-2 text-right uppercase tracking-wider">CVV / CVC</p>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-white/60 text-[10px] font-bold tracking-wider">BITPAY DIGITAL BANK</p>
                        <div className="flex items-center">
                          <div className="relative w-10 h-6">
                            <div className="absolute left-0 w-6 h-6 bg-red-600 rounded-full opacity-90" />
                            <div className="absolute right-0 w-6 h-6 bg-yellow-500 rounded-full opacity-90" />
                          </div>
                        </div>
                      </div>
                      <p className="text-white/30 text-[8px] leading-relaxed">
                        This card is property of BitPay Digital Bank. Use of this card is subject to the cardholder agreement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${card.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-foreground font-medium">Card Status</span>
              </div>
              <span className={`capitalize font-semibold ${card.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                {card.status}
              </span>
            </div>

            <div className="bg-gradient-to-r from-red-600/10 to-yellow-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Card Type</p>
                  <p className="text-lg font-bold text-foreground capitalize">{card.card_type}</p>
                </div>
                <div className="relative w-12 h-8">
                  <div className="absolute left-0 w-8 h-8 bg-red-600 rounded-full opacity-90" />
                  <div className="absolute right-0 w-8 h-8 bg-yellow-500 rounded-full opacity-90" />
                </div>
              </div>
            </div>

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

              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="bg-orange-500/10 rounded-lg p-3">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Worldwide Acceptance</p>
                  <p className="text-sm text-muted-foreground">Use anywhere Mastercard is accepted</p>
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