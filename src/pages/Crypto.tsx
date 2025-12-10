import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Copy, Check, TrendingUp, TrendingDown, RefreshCw, Wallet, X, ArrowRightLeft, Users, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}
interface CryptoWallet {
  id: string;
  coin_symbol: string;
  coin_name: string;
  wallet_address: string;
  network: string;
  balance: number;
}

// Company deposit addresses for users to receive crypto
const COMPANY_ADDRESSES: Record<string, string> = {
  'BTC-Bitcoin': 'bc1qhwutfxhl9062uxjswwgc7dr4zv8fwkekm4u42s',
  'ETH-ERC20': '0xc254e04bf79df093e821ba9e8e8f366e01b36d66',
  'BNB-BEP20': '0xc254e04bf79df093e821ba9e8e8f366e01b36d66',
  'USDT-BEP20': '0xc254e04bf79df093e821ba9e8e8f366e01b36d66',
  'USDT-ERC20': '0xc254e04bf79df093e821ba9e8e8f366e01b36d66',
  'SOL-Solana': 'HqZDakA7ELoKJ4vJH1NUXBC2B4qRra4JauDWvvmK4xqn',
  'USDT-TRC20': 'TVvsMrne5bPZE2rdAUCbDAfQCYvSZcdpYz',
  'PI-Pi Network': 'GAVBCFVO4BES4TI35D6Q6M6KDVUZVL2B5FHJNN3AZ76E5NI27VEBZCWJ',
  'XRP-Ripple': 'r4KpqYeisKn15n1Kr6dfYNPHj83WVBKCTZ'
};
const SUPPORTED_COINS = [{
  symbol: 'BTC',
  name: 'Bitcoin',
  network: 'Bitcoin',
  coingeckoId: 'bitcoin'
}, {
  symbol: 'ETH',
  name: 'Ethereum',
  network: 'ERC20',
  coingeckoId: 'ethereum'
}, {
  symbol: 'USDT',
  name: 'Tether (BNB)',
  network: 'BEP20',
  coingeckoId: 'tether'
}, {
  symbol: 'USDT',
  name: 'Tether (ERC20)',
  network: 'ERC20',
  coingeckoId: 'tether'
}, {
  symbol: 'USDT',
  name: 'Tether (TRC20)',
  network: 'TRC20',
  coingeckoId: 'tether'
}, {
  symbol: 'SOL',
  name: 'Solana',
  network: 'Solana',
  coingeckoId: 'solana'
}, {
  symbol: 'XRP',
  name: 'XRP',
  network: 'Ripple',
  coingeckoId: 'ripple'
}, {
  symbol: 'BNB',
  name: 'BNB',
  network: 'BEP20',
  coingeckoId: 'binancecoin'
}, {
  symbol: 'PI',
  name: 'Pi Network',
  network: 'Pi Network',
  coingeckoId: 'pi-network'
}];
export default function Crypto() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showInternalSendModal, setShowInternalSendModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CryptoWallet | null>(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [internalRecipientAccount, setInternalRecipientAccount] = useState('');
  const [internalSendAmount, setInternalSendAmount] = useState('');
  const [internalRecipient, setInternalRecipient] = useState<{
    user_id: string;
    full_name: string;
    account_number: string;
  } | null>(null);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');
  const [convertDirection, setConvertDirection] = useState<'toBank' | 'toCrypto'>('toBank');
  const [convertCoin, setConvertCoin] = useState<string>('');

  // Fetch crypto prices from CoinGecko
  const {
    data: prices,
    isLoading: pricesLoading,
    refetch: refetchPrices
  } = useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: async () => {
      const ids = [...new Set(SUPPORTED_COINS.map(c => c.coingeckoId))].join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`);
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json() as Promise<CryptoPrice[]>;
    },
    refetchInterval: 30000
  });
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  useEffect(() => {
    const fetchOrCreateWallets = async () => {
      if (!user) return;
      const {
        data: existingWallets
      } = await supabase.from('crypto_wallets').select('*').eq('user_id', user.id);
      if (existingWallets && existingWallets.length > 0) {
        setWallets(existingWallets);
      } else {
        const newWallets = SUPPORTED_COINS.map(coin => ({
          user_id: user.id,
          coin_symbol: coin.symbol,
          coin_name: coin.name,
          network: coin.network,
          wallet_address: COMPANY_ADDRESSES[`${coin.symbol}-${coin.network}`] || '',
          balance: 0
        }));
        const {
          data: insertedWallets,
          error
        } = await supabase.from('crypto_wallets').insert(newWallets).select();
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
    toast({
      title: 'Copied!',
      description: 'Address copied to clipboard'
    });
    setTimeout(() => setCopied(null), 2000);
  };
  const handleSend = () => {
    if (!sendAddress || !sendAmount) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }
    toast({
      title: 'Transfer Initiated',
      description: `Sending ${sendAmount} ${selectedCoin?.coin_symbol} to ${sendAddress.slice(0, 10)}...`
    });
    setShowSendModal(false);
    setSendAddress('');
    setSendAmount('');
  };
  const handleSearchInternalRecipient = async () => {
    if (!internalRecipientAccount || internalRecipientAccount.length !== 10) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit account number',
        variant: 'destructive'
      });
      return;
    }
    setIsSearchingRecipient(true);
    const {
      data,
      error
    } = await supabase.from('profiles').select('user_id, full_name, account_number').eq('account_number', internalRecipientAccount).maybeSingle();
    if (error || !data) {
      toast({
        title: 'Error',
        description: 'Account not found',
        variant: 'destructive'
      });
      setInternalRecipient(null);
    } else if (data.user_id === user?.id) {
      toast({
        title: 'Error',
        description: 'Cannot send to your own account',
        variant: 'destructive'
      });
      setInternalRecipient(null);
    } else {
      setInternalRecipient(data);
    }
    setIsSearchingRecipient(false);
  };
  const handleInternalCryptoSend = async () => {
    if (!selectedCoin || !internalRecipient || !internalSendAmount) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }
    const amount = parseFloat(internalSendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }
    if (selectedCoin.balance < amount) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${selectedCoin.balance} ${selectedCoin.coin_symbol}`,
        variant: 'destructive'
      });
      return;
    }

    // Deduct from sender
    const newSenderBalance = selectedCoin.balance - amount;
    await supabase.from('crypto_wallets').update({
      balance: newSenderBalance
    }).eq('id', selectedCoin.id);

    // Add to recipient wallet
    const {
      data: recipientWallet
    } = await supabase.from('crypto_wallets').select('*').eq('user_id', internalRecipient.user_id).eq('coin_symbol', selectedCoin.coin_symbol).eq('network', selectedCoin.network).maybeSingle();
    if (recipientWallet) {
      await supabase.from('crypto_wallets').update({
        balance: recipientWallet.balance + amount
      }).eq('id', recipientWallet.id);
    } else {
      await supabase.from('crypto_wallets').insert({
        user_id: internalRecipient.user_id,
        coin_symbol: selectedCoin.coin_symbol,
        coin_name: selectedCoin.coin_name,
        network: selectedCoin.network,
        wallet_address: COMPANY_ADDRESSES[`${selectedCoin.coin_symbol}-${selectedCoin.network}`] || '',
        balance: amount
      });
    }

    // Create crypto transfer record
    await supabase.from('crypto_transfers').insert({
      sender_id: user!.id,
      recipient_id: internalRecipient.user_id,
      coin_symbol: selectedCoin.coin_symbol,
      network: selectedCoin.network,
      amount: amount,
      status: 'completed'
    });

    // Update local state
    setWallets(wallets.map(w => w.id === selectedCoin.id ? {
      ...w,
      balance: newSenderBalance
    } : w));
    queryClient.invalidateQueries({
      queryKey: ['cryptoWallets']
    });
    toast({
      title: 'Success',
      description: `Sent ${amount} ${selectedCoin.coin_symbol} to ${internalRecipient.full_name}`
    });
    setShowInternalSendModal(false);
    setInternalRecipientAccount('');
    setInternalSendAmount('');
    setInternalRecipient(null);
    setSelectedCoin(null);
  };
  const handleConvert = async () => {
    if (!convertAmount || !convertCoin) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }
    const amount = parseFloat(convertAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }
    const [symbol, network] = convertCoin.split('-');
    const wallet = wallets.find(w => w.coin_symbol === symbol && w.network === network);
    const coinInfo = SUPPORTED_COINS.find(c => c.symbol === symbol && c.network === network);
    const priceData = coinInfo ? getPrice(coinInfo.coingeckoId) : null;
    const rate = priceData?.current_price || (symbol === 'USDT' ? 1 : 0);
    if (convertDirection === 'toBank') {
      // Convert crypto to bank balance
      if (!wallet || wallet.balance < amount) {
        toast({
          title: 'Error',
          description: 'Insufficient crypto balance',
          variant: 'destructive'
        });
        return;
      }
      const usdAmount = amount * rate;
      const newBalance = wallet.balance - amount;
      const {
        error
      } = await supabase.from('crypto_wallets').update({
        balance: newBalance
      }).eq('id', wallet.id);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to convert',
          variant: 'destructive'
        });
        return;
      }
      setWallets(wallets.map(w => w.id === wallet.id ? {
        ...w,
        balance: newBalance
      } : w));
      queryClient.invalidateQueries({
        queryKey: ['cryptoWallets']
      });
      toast({
        title: 'Conversion Successful',
        description: `Converted ${amount} ${symbol} to $${usdAmount.toFixed(2)} in your bank account`
      });
    } else {
      // Convert bank balance to crypto
      const cryptoAmount = amount / rate;
      const newBalance = (wallet?.balance || 0) + cryptoAmount;
      if (wallet) {
        const {
          error
        } = await supabase.from('crypto_wallets').update({
          balance: newBalance
        }).eq('id', wallet.id);
        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to convert',
            variant: 'destructive'
          });
          return;
        }
        setWallets(wallets.map(w => w.id === wallet.id ? {
          ...w,
          balance: newBalance
        } : w));
      }
      queryClient.invalidateQueries({
        queryKey: ['cryptoWallets']
      });
      toast({
        title: 'Conversion Successful',
        description: `Converted $${amount} to ${cryptoAmount.toFixed(8)} ${symbol}`
      });
    }
    setShowConvertModal(false);
    setConvertAmount('');
    setConvertCoin('');
  };

  // Calculate total crypto balance in USD
  const totalCryptoBalance = wallets.reduce((total, wallet) => {
    const coinInfo = SUPPORTED_COINS.find(c => c.symbol === wallet.coin_symbol && c.network === wallet.network);
    const priceData = coinInfo ? getPrice(coinInfo.coingeckoId) : null;
    const rate = priceData?.current_price || (wallet.coin_symbol === 'USDT' || wallet.coin_symbol === 'PI' ? 1 : 0);
    return total + (wallet.balance || 0) * rate;
  }, 0);
  if (loading || isLoadingWallets) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>;
  }
  if (!user) return null;
  return <div className="min-h-screen bg-background">
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
          <button onClick={() => refetchPrices()} className="text-muted-foreground hover:text-foreground" disabled={pricesLoading}>
            <RefreshCw className={`h-5 w-5 ${pricesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Total Crypto Balance */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 mb-8 text-center">
          <p className="text-white/80 text-sm mb-2">Total Crypto Balance</p>
          <p className="text-white text-4xl font-bold mb-4">
            ${totalCryptoBalance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          </p>
          
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button onClick={() => setShowReceiveModal(true)} className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-center hover:opacity-90 transition-opacity">
            <ArrowDownLeft className="h-6 w-6 text-white mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Receive</span>
          </button>
          <button onClick={() => setShowInternalSendModal(true)} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-center hover:opacity-90 transition-opacity">
            <Users className="h-6 w-6 text-white mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Send to User</span>
          </button>
          <button onClick={() => setShowSendModal(true)} className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 text-center hover:opacity-90 transition-opacity">
            <ArrowUpRight className="h-6 w-6 text-white mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">External</span>
          </button>
        </div>

        {/* Live Prices */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Live Prices</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {pricesLoading ? <div className="p-6 text-center text-muted-foreground">Loading prices...</div> : <div className="divide-y divide-border">
                {prices?.map(coin => <div key={coin.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-foreground">{coin.name}</p>
                        <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${coin.current_price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</p>
                      <p className={`text-sm flex items-center justify-end gap-1 ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </p>
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>

        {/* My Wallets */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">My Wallets</h2>
          <div className="space-y-3">
            {wallets.map((wallet, idx) => {
            const coinInfo = SUPPORTED_COINS.find(c => c.symbol === wallet.coin_symbol && c.network === wallet.network);
            const priceData = coinInfo ? getPrice(coinInfo.coingeckoId) : null;
            const companyAddress = COMPANY_ADDRESSES[`${wallet.coin_symbol}-${wallet.network}`];
            const rate = priceData?.current_price || (wallet.coin_symbol === 'USDT' || wallet.coin_symbol === 'PI' ? 1 : 0);
            return <div key={idx} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {priceData?.image ? <img src={priceData.image} alt={wallet.coin_name} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>}
                      <div>
                        <p className="font-semibold text-foreground">{wallet.coin_name}</p>
                        <p className="text-xs text-muted-foreground">{wallet.network} Network</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-foreground">{wallet.balance.toFixed(wallet.coin_symbol === 'USDT' ? 2 : 8)} {wallet.coin_symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        ${((wallet.balance || 0) * rate).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                    <code className="flex-1 text-xs text-muted-foreground truncate">{companyAddress || wallet.wallet_address}</code>
                    <button onClick={() => copyToClipboard(companyAddress || wallet.wallet_address, wallet.coin_symbol + wallet.network)} className="text-muted-foreground hover:text-primary">
                      {copied === wallet.coin_symbol + wallet.network ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </main>

      {/* Send Modal */}
      {showSendModal && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                <select value={selectedCoin ? `${selectedCoin.coin_symbol}-${selectedCoin.network}` : ''} onChange={e => {
              const [symbol, network] = e.target.value.split('-');
              const wallet = wallets.find(w => w.coin_symbol === symbol && w.network === network);
              setSelectedCoin(wallet || null);
            }} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select a coin</option>
                  {wallets.map((w, idx) => <option key={idx} value={`${w.coin_symbol}-${w.network}`}>
                      {w.coin_name} ({w.network}) - Balance: {w.balance}
                    </option>)}
                </select>
              </div>

              <div>
                <Label>Recipient Address</Label>
                <Input value={sendAddress} onChange={e => setSendAddress(e.target.value)} placeholder="Enter wallet address" className="mt-1" />
              </div>

              <div>
                <Label>Amount</Label>
                <Input type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>

              <Button onClick={handleSend} className="w-full">Send</Button>
            </div>
          </div>
        </div>}

      {/* Receive Modal */}
      {showReceiveModal && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Receive Crypto</h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-muted-foreground mb-4">Send crypto to these addresses to fund your account:</p>
            
            <div className="space-y-3">
              {wallets.map((wallet, idx) => {
            const companyAddress = COMPANY_ADDRESSES[`${wallet.coin_symbol}-${wallet.network}`];
            return <div key={idx} className="bg-secondary/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{wallet.coin_name}</span>
                      <span className="text-xs text-muted-foreground">{wallet.network}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-muted-foreground break-all">{companyAddress}</code>
                      <button onClick={() => copyToClipboard(companyAddress, `recv-${wallet.coin_symbol}-${wallet.network}`)} className="text-muted-foreground hover:text-primary shrink-0">
                        {copied === `recv-${wallet.coin_symbol}-${wallet.network}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>;
          })}
            </div>
          </div>
        </div>}

      {/* Convert Modal */}
      {showConvertModal && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Convert</h3>
              <button onClick={() => setShowConvertModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Direction Toggle */}
              <div className="flex gap-2">
                <Button variant={convertDirection === 'toBank' ? 'default' : 'outline'} className="flex-1" onClick={() => setConvertDirection('toBank')}>
                  Crypto → Bank
                </Button>
                <Button variant={convertDirection === 'toCrypto' ? 'default' : 'outline'} className="flex-1" onClick={() => setConvertDirection('toCrypto')}>
                  Bank → Crypto
                </Button>
              </div>

              <div>
                <Label>Select Cryptocurrency</Label>
                <select value={convertCoin} onChange={e => setConvertCoin(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select a coin</option>
                  {wallets.map((w, idx) => {
                const coinInfo = SUPPORTED_COINS.find(c => c.symbol === w.coin_symbol && c.network === w.network);
                const priceData = coinInfo ? getPrice(coinInfo.coingeckoId) : null;
                const rate = priceData?.current_price || (w.coin_symbol === 'USDT' ? 1 : 0);
                return <option key={idx} value={`${w.coin_symbol}-${w.network}`}>
                        {w.coin_name} ({w.network}) - Balance: {w.balance} (${(w.balance * rate).toFixed(2)})
                      </option>;
              })}
                </select>
              </div>

              <div>
                <Label>{convertDirection === 'toBank' ? 'Crypto Amount' : 'USD Amount'}</Label>
                <Input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)} placeholder="0.00" className="mt-1" />
                {convertCoin && convertAmount && <p className="text-sm text-muted-foreground mt-2">
                    {(() => {
                const [symbol, network] = convertCoin.split('-');
                const coinInfo = SUPPORTED_COINS.find(c => c.symbol === symbol && c.network === network);
                const priceData = coinInfo ? getPrice(coinInfo.coingeckoId) : null;
                const rate = priceData?.current_price || (symbol === 'USDT' ? 1 : 0);
                const amount = parseFloat(convertAmount) || 0;
                if (convertDirection === 'toBank') {
                  return `≈ $${(amount * rate).toFixed(2)} USD`;
                } else {
                  return `≈ ${(amount / rate).toFixed(8)} ${symbol}`;
                }
              })()}
                  </p>}
              </div>

              <Button onClick={handleConvert} className="w-full">Convert</Button>
            </div>
          </div>
        </div>}

      {/* Internal Send Modal */}
      {showInternalSendModal && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Send to Heritage User</h3>
              <button onClick={() => {
            setShowInternalSendModal(false);
            setInternalRecipient(null);
            setSelectedCoin(null);
          }} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Select Coin</Label>
                <select value={selectedCoin ? `${selectedCoin.coin_symbol}-${selectedCoin.network}` : ''} onChange={e => {
              const [symbol, network] = e.target.value.split('-');
              const wallet = wallets.find(w => w.coin_symbol === symbol && w.network === network);
              setSelectedCoin(wallet || null);
            }} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select a coin</option>
                  {wallets.filter(w => w.balance > 0).map((w, idx) => <option key={idx} value={`${w.coin_symbol}-${w.network}`}>
                      {w.coin_name} ({w.network}) - Balance: {w.balance}
                    </option>)}
                </select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" /> Recipient Account Number
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input value={internalRecipientAccount} onChange={e => setInternalRecipientAccount(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter 10-digit account" />
                  <Button onClick={handleSearchInternalRecipient} disabled={isSearchingRecipient} size="sm">
                    {isSearchingRecipient ? '...' : 'Find'}
                  </Button>
                </div>
              </div>

              {internalRecipient && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-medium text-sm">Recipient Found</span>
                  </div>
                  <p className="text-foreground font-medium">{internalRecipient.full_name || 'N/A'}</p>
                  <p className="text-muted-foreground text-sm font-mono">{internalRecipient.account_number}</p>
                </div>}

              {selectedCoin && internalRecipient && <div>
                  <Label>Amount ({selectedCoin.coin_symbol})</Label>
                  <Input type="number" value={internalSendAmount} onChange={e => setInternalSendAmount(e.target.value)} placeholder="0.00" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedCoin.balance} {selectedCoin.coin_symbol}
                  </p>
                </div>}

              <Button onClick={handleInternalCryptoSend} className="w-full" disabled={!selectedCoin || !internalRecipient || !internalSendAmount}>
                Send Crypto
              </Button>
            </div>
          </div>
        </div>}
    </div>;
}