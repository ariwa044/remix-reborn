import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { 
  ArrowLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  recipient_name: string | null;
  recipient_account: string | null;
  status: string;
  created_at: string;
  currency: string;
  crypto_symbol: string | null;
}

export default function TransactionHistory() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['transactionHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      return data as Transaction[];
    },
    enabled: !!user
  });

  const isCredit = (type: string) => {
    return ['internal_transfer_in', 'deposit', 'credit', 'receive'].includes(type.toLowerCase());
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      (tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       tx.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       tx.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'credit') return matchesSearch && isCredit(tx.transaction_type);
    if (filterType === 'debit') return matchesSearch && !isCredit(tx.transaction_type);
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTransactionType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
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
          <img src={bitpayLogo} alt="BitPay" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">Transaction History</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'credit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('credit')}
              className="gap-1"
            >
              <ArrowDownLeft className="h-3 w-3" /> Credit
            </Button>
            <Button
              variant={filterType === 'debit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('debit')}
              className="gap-1"
            >
              <ArrowUpRight className="h-3 w-3" /> Debit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Credit</span>
            </div>
            <p className="text-xl font-bold text-green-500">
              ${transactions
                .filter(tx => isCredit(tx.transaction_type))
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Total Debit</span>
            </div>
            <p className="text-xl font-bold text-red-500">
              ${transactions
                .filter(tx => !isCredit(tx.transaction_type))
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Download className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchQuery ? 'Try a different search term' : 'Start making transactions to see them here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx) => {
                const credit = isCredit(tx.transaction_type);
                return (
                  <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 ${credit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {credit ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {tx.recipient_name || formatTransactionType(tx.transaction_type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tx.description || formatTransactionType(tx.transaction_type)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${credit ? 'text-green-500' : 'text-red-500'}`}>
                          {credit ? '+' : '-'}
                          {tx.crypto_symbol ? `${tx.amount} ${tx.crypto_symbol}` : `$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' 
                            ? 'bg-green-500/10 text-green-500' 
                            : tx.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full mt-6">
          Back to Dashboard
        </Button>
      </main>
    </div>
  );
}
