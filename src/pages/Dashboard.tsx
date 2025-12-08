import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { CreditCard, Wallet, TrendingUp, Send, Download, ArrowUpRight, Bell, Settings, LogOut, Menu, X, Eye, EyeOff, RefreshCw, DollarSign, Landmark, PiggyBank, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Transfer {
  id: string;
  amount: number;
  transfer_type: string;
  status: string;
  recipient_name: string;
  created_at: string;
}

interface CryptoWallet {
  coin_symbol: string;
  coin_name: string;
  balance: number;
  network: string;
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch user profile with balance
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('balance, savings_balance')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  // Fetch user transfers
  const { data: transfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data || []) as Transfer[];
    },
    enabled: !!user
  });

  // Fetch internal transfers
  const { data: internalTransfers = [] } = useQuery({
    queryKey: ['internalTransfers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('internal_transfers')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user
  });

  // Fetch crypto wallets for total balance
  const { data: cryptoWallets = [] } = useQuery({
    queryKey: ['cryptoWallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', user.id);
      return (data || []) as CryptoWallet[];
    },
    enabled: !!user
  });

  // Fetch crypto prices
  const { data: cryptoPrices } = useQuery({
    queryKey: ['cryptoPricesDashboard'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,tether,solana,ripple,binancecoin&order=market_cap_desc'
      );
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 60000
  });

  // Calculate total crypto balance in USD
  const totalCryptoBalance = cryptoWallets.reduce((total, wallet) => {
    const coinMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'SOL': 'solana',
      'XRP': 'ripple',
      'BNB': 'binancecoin'
    };
    const priceData = cryptoPrices?.find((p: any) => p.id === coinMap[wallet.coin_symbol]);
    return total + (wallet.balance || 0) * (priceData?.current_price || (wallet.coin_symbol === 'USDT' || wallet.coin_symbol === 'PI' ? 1 : 0));
  }, 0);

  const bankBalance = profile?.balance || 0;
  const savingsBalance = profile?.savings_balance || 0;
  const totalBalance = bankBalance + savingsBalance + totalCryptoBalance;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={bitpayLogo} alt="BitPay" className="h-8 w-auto" />
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-muted-foreground">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border p-4 space-y-2 bg-card">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
              <Landmark className="h-4 w-4" /> Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate('/transfer'); setMenuOpen(false); }}>
              <Send className="h-4 w-4" /> Transfer
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate('/deposit'); setMenuOpen(false); }}>
              <Download className="h-4 w-4" /> Deposit
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate('/crypto'); setMenuOpen(false); }}>
              <TrendingUp className="h-4 w-4" /> Crypto
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate('/atm-card'); setMenuOpen(false); }}>
              <CreditCard className="h-4 w-4" /> ATM Card
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate('/profile'); setMenuOpen(false); }}>
              <Settings className="h-4 w-4" /> Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </Button>
            <Button variant="ghost" onClick={() => { handleSignOut(); setMenuOpen(false); }} className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">Here's your financial overview</p>
        </div>

        {/* Account Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-white/80" />
                <span className="text-white/80 text-sm">Checking Account</span>
              </div>
              <button onClick={() => setShowBalance(!showBalance)} className="text-white/80 hover:text-white">
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-3xl font-bold mb-4">
              {showBalance ? `$${bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/transfer')} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
                <Send className="h-3 w-3" /> Send
              </Button>
              <Button onClick={() => navigate('/deposit')} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
                <Download className="h-3 w-3" /> Receive
              </Button>
            </div>
          </div>

          {/* Savings Card */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-5 w-5 text-white/80" />
              <span className="text-white/80 text-sm">Savings Account</span>
            </div>
            <div className="text-3xl font-bold mb-4">
              {showBalance ? `$${savingsBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
            </div>
            <p className="text-white/60 text-xs">3.5% APY</p>
          </div>

          {/* Crypto Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-white/80" />
                <span className="text-white/80 text-sm">Crypto Assets</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-4">
              {showBalance ? `$${totalCryptoBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
            </div>
            <Button onClick={() => navigate('/crypto')} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
              <ArrowUpRight className="h-3 w-3" /> Trade
            </Button>
          </div>
        </div>

        {/* Total Balance Banner */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Net Worth</p>
            <p className="text-2xl font-bold text-foreground">
              {showBalance ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
            </p>
          </div>
          <DollarSign className="h-10 w-10 text-primary/20" />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <button onClick={() => navigate('/send')} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">Send</span>
          </button>
          <button onClick={() => navigate('/transfer')} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-center">
            <Send className="h-6 w-6 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">Transfer</span>
          </button>
          <button onClick={() => navigate('/deposit')} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-center">
            <Download className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">Deposit</span>
          </button>
          <button onClick={() => navigate('/profile')} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-center">
            <Settings className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">Profile</span>
          </button>
          <button onClick={() => navigate('/crypto')} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-center">
            <TrendingUp className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">Crypto</span>
          </button>
          <button onClick={() => navigate('/atm-card')} className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-center">
            <CreditCard className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground">ATM Card</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h2>
          {transfersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Fund your account to start making transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500/10 rounded-lg p-2">
                      <Send className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.recipient_name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-red-500">
                    -${transaction.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}