import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Send, 
  Download, 
  ArrowUpRight,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const transactions = [
    { id: 1, type: 'received', name: 'Salary Deposit', amount: 5000, date: 'Dec 1, 2024' },
    { id: 2, type: 'sent', name: 'Electric Bill', amount: 150, date: 'Dec 2, 2024' },
    { id: 3, type: 'received', name: 'Freelance Payment', amount: 800, date: 'Dec 3, 2024' },
    { id: 4, type: 'sent', name: 'Groceries', amount: 85, date: 'Dec 4, 2024' },
  ];

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
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-muted-foreground"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-2">
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

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80">Total Balance</span>
            <button onClick={() => setShowBalance(!showBalance)} className="text-white/80 hover:text-white">
              {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          <div className="text-4xl md:text-5xl font-bold mb-6">
            {showBalance ? '$12,458.50' : '••••••••'}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
              <Send className="h-4 w-4" /> Send
            </Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
              <Download className="h-4 w-4" /> Receive
            </Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
              <ArrowUpRight className="h-4 w-4" /> Invest
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Savings</p>
                <p className="text-xl font-bold text-foreground">{showBalance ? '$8,250.00' : '••••••'}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Investments</p>
                <p className="text-xl font-bold text-foreground">{showBalance ? '$3,125.00' : '••••••'}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/10 rounded-lg p-3">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Credit</p>
                <p className="text-xl font-bold text-foreground">{showBalance ? '$1,083.50' : '••••••'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-2 ${transaction.type === 'received' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {transaction.type === 'received' ? (
                      <Download className={`h-4 w-4 text-green-500`} />
                    ) : (
                      <Send className={`h-4 w-4 text-red-500`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transaction.name}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <span className={`font-semibold ${transaction.type === 'received' ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === 'received' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
