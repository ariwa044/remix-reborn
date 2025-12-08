import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { ArrowLeft, Eye, EyeOff, CreditCard, Shield, Wifi, Lock, CheckCircle } from 'lucide-react';

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
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);

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
    if (showCardNumber) {
      return num.replace(/(.{4})/g, '$1 ').trim();
    }
    return '**** **** **** ' + num.slice(-4);
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
            {/* Virtual Card Display */}
            <div className="mb-8">
              <div className="relative aspect-[1.586/1] w-full max-w-[400px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                  </div>

                  {/* Card Header */}
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Heritage Bank</p>
                      <p className="text-white font-semibold">VISA Debit</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-6 w-6 text-white/60 rotate-90" />
                      <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded" />
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-white text-xl font-mono tracking-wider">
                        {formatCardNumber(card.card_number)}
                      </p>
                      <button 
                        onClick={() => setShowCardNumber(!showCardNumber)}
                        className="text-white/60 hover:text-white"
                      >
                        {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="relative z-10 flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Card Holder</p>
                      <p className="text-white font-semibold uppercase">{card.card_holder_name}</p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-white/60 text-xs mb-1">Expires</p>
                        <p className="text-white font-mono">{card.expiry_date}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs mb-1">CVV</p>
                        <div className="flex items-center gap-1">
                          <p className="text-white font-mono">{showCVV ? card.cvv : '***'}</p>
                          <button 
                            onClick={() => setShowCVV(!showCVV)}
                            className="text-white/60 hover:text-white"
                          >
                            {showCVV ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-2xl font-bold italic">VISA</p>
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
                <div className="bg-accent/10 rounded-lg p-3">
                  <Wifi className="h-5 w-5 text-accent rotate-90" />
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