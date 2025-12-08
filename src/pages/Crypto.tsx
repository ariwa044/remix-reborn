import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import bitpayLogo from '@/assets/bitpay-logo.png';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

interface CryptoWallet {
  coin_symbol: string;
  coin_name: string;
  wallet_address: string;
  network: string;
  balance: number;
}

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', network: 'ERC20', coingeckoId: 'ethereum' },
  { symbol: 'USDT', name: 'Tether (BNB)', network: 'BEP20', coingeckoId: 'tether' },
  { symbol: 'USDT', name: 'Tether (ERC20)', network: 'ERC20', coingeckoId: 'tether' },
  { symbol: 'USDT', name: 'Tether (TRC20)', network: 'TRC20', coingeckoId: 'tether' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', coingeckoId: 'solana' },
  { symbol: 'XRP', name: 'XRP', network: 'Ripple', coingeckoId: 'ripple' },
  { symbol: 'BNB', name: 'BNB', network: 'BEP20', coingeckoId: 'binancecoin' },
  { symbol: 'PI', name: 'Pi Network', network: 'Pi Network', coingeckoId: 'pi-network' }
];

const generateWalletAddress = (symbol: string, network: string): string => {
  const chars = 'abcdef0123456789';
  let prefix = '';
  let length = 40;
  
  if (symbol === 'BTC') {
    prefix = 'bc1q';
    length = 38;
  } else if (network === 'TRC20') {
    prefix = 'T';
    length = 33;
  } else if (symbol === 'XRP') {
    prefix = 'r';
    length = 33;
  } else if (symbol === 'SOL') {
    const solChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let addr = '';
    for (let i = 0; i < 44; i++) addr += solChars[Math.floor(Math.random() * solChars.length)];
    return addr;
  } else {
    prefix = '0x';
  }
  
  let addr = prefix;
  for (let i = 0; i < length; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
};

export default function Crypto() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CryptoWallet | null>(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  // Fetch crypto prices from CoinGecko
  const { data: prices, isLoading: pricesLoading, refetch: refetchPrices } = useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: async () => {
      const ids = [...new Set(SUPPORTED_COINS.map(c => c.coingeckoId))].join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`
      );
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json() as Promise<CryptoPrice[]>;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchOrCreateWallets = async () => {
      if (!user) return;

      const { data: existingWallets } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', user.id);

      if (existingWallets && existingWallets.length > 0) {
        setWallets(existingWallets);
      } else {
        // Generate wallets for all supported coins
        const newWallets = SUPPORTED_COINS.map(coin => ({
          user_id: user.id,
          coin_symbol: coin.symbol,
          coin_name: coin.name,
          network: coin.network,
          wallet_address: generateWalletAddress(coin.symbol, coin.network),
          balance: 0
        }));

        const { data: insertedWallets, error } = await supabase
          .from('crypto_wallets')
          .insert(newWallets)
          .select();

        if (!error && insertedWallets) {
          setWallets(insertedWallets);
        }
      }
      setIsLoadingWallets(false);
    };

    fetchOrCreateWallets();
  }, [user]);

  const getPrice = (coingeckoId: string) => {
    return prices?.find(p => p.id === coingeckoId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied!', description: 'Address copied to clipboard' });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSend = () => {
    if (!sendAddress || !sendAmount) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    toast({ title: 'Transfer Initiated', description: `Sending ${sendAmount} ${selectedCoin?.coin_symbol} to ${sendAddress.slice(0, 10)}...` });
    setShowSendModal(false);
    setSendAddress('');
    setSendAmount('');
  };

  if (loading || isLoadingWallets) {
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src={bitpayLogo} alt="Heritage Bank" className="h-8 w-auto" />
            <h1 className="text-lg font-semibold text-foreground">Crypto Services</h1>
          </div>
          <button 
            onClick={() => refetchPrices()} 
            className="text-muted-foreground hover:text-foreground"
            disabled={pricesLoading}
          >
            <RefreshCw className={`h-5 w-5 ${pricesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowReceiveModal(true)}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-center hover:opacity-90 transition-opacity"
          >
            <ArrowDownLeft className="h-8 w-8 text-white mx-auto mb-2" />
            <span className="text-white font-semibold">Receive Crypto</span>
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-gradient-to-br from-primary to-accent rounded-xl p-6 text-center hover:opacity-90 transition-opacity"
          >
            <ArrowUpRight className="h-8 w-8 text-white mx-auto mb-2" />
            <span className="text-white font-semibold">Send Crypto</span>
          </button>
        </div>

        {/* Live Prices */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Live Prices</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {pricesLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading prices...</div>
            ) : (
              <div className="divide-y divide-border">
                {prices?.map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-foreground">{coin.name}</p>
                        <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className={`text-sm flex items-center justify-end gap-1 ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Wallets */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">My Wallets</h2>
          <div className="space-y-3">
            {wallets.map((wallet, idx) => {
              const coinInfo = SUPPORTED_COINS.find(c => c.symbol === wallet.coin_symbol && c.network === wallet.network);
              const priceData = coinInfo ? getPrice(coinInfo.coingeckoId) : null;
              
              return (
                <div key={idx} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {priceData?.image ? (
                        <img src={priceData.image} alt={wallet.coin_name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{wallet.coin_name}</p>
                        <p className="text-xs text-muted-foreground">{wallet.network} Network</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{wallet.balance} {wallet.coin_symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        ${(wallet.balance * (priceData?.current_price || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                    <code className="flex-1 text-xs text-muted-foreground truncate">{wallet.wallet_address}</code>
                    <button
                      onClick={() => copyToClipboard(wallet.wallet_address, wallet.coin_symbol)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {copied === wallet.coin_symbol ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Send Crypto</h3>
              <button onClick={() => setShowSendModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Select Coin</Label>
                <select
                  value={selectedCoin ? `${selectedCoin.coin_symbol}-${selectedCoin.network}` : ''}
                  onChange={(e) => {
                    const [symbol, network] = e.target.value.split('-');
                    const wallet = wallets.find(w => w.coin_symbol === symbol && w.network === network);
                    setSelectedCoin(wallet || null);
                  }}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a coin</option>
                  {wallets.map((w, idx) => (
                    <option key={idx} value={`${w.coin_symbol}-${w.network}`}>
                      {w.coin_name} ({w.network})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Recipient Address</Label>
                <Input
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <Button onClick={handleSend} className="w-full">Send</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Receive Crypto</h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-muted-foreground mb-4">Select a wallet to receive funds:</p>
            
            <div className="space-y-3">
              {wallets.map((wallet, idx) => (
                <div key={idx} className="bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{wallet.coin_name}</span>
                    <span className="text-xs text-muted-foreground">{wallet.network}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-muted-foreground break-all">{wallet.wallet_address}</code>
                    <button
                      onClick={() => copyToClipboard(wallet.wallet_address, `recv-${wallet.coin_symbol}-${wallet.network}`)}
                      className="text-muted-foreground hover:text-primary shrink-0"
                    >
                      {copied === `recv-${wallet.coin_symbol}-${wallet.network}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}