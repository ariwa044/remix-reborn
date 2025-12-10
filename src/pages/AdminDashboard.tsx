import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, DollarSign, CreditCard, ArrowUpDown, Shield, Search, Edit, Ban, CheckCircle, 
  Plus, Settings, Bitcoin, LayoutDashboard, Wallet, ArrowLeftRight, Receipt, Building, LogOut,
  Eye, ArrowDownCircle, ArrowUpCircle, X, Minus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const CRYPTO_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether', network: 'Ethereum' },
  { symbol: 'PI', name: 'Pi Network', network: 'Pi Network' },
  { symbol: 'BNB', name: 'Binance Coin', network: 'BSC' },
  { symbol: 'XRP', name: 'Ripple', network: 'Ripple' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana' },
  { symbol: 'DOGE', name: 'Dogecoin', network: 'Dogecoin' },
];

type AdminSection = 'dashboard' | 'users' | 'balances' | 'crypto-funding' | 'wallets' | 'pending-transfers' | 'crypto-fees' | 'bank-fees' | 'settings';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);
  const [fundAccountOpen, setFundAccountOpen] = useState(false);
  const [fundCryptoOpen, setFundCryptoOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [walletEditOpen, setWalletEditOpen] = useState(false);
  const [selectedWalletCoin, setSelectedWalletCoin] = useState<any>(null);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newSavingsBalance, setNewSavingsBalance] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundDescription, setFundDescription] = useState('');
  const [fundOperation, setFundOperation] = useState<'add' | 'subtract'>('add');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [transferFee, setTransferFee] = useState('');
  const [cryptoFeeAmounts, setCryptoFeeAmounts] = useState<Record<string, string>>({});

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch transfer fee setting
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch crypto fee settings
  const { data: cryptoFeeSettings } = useQuery({
    queryKey: ['crypto-fee-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_fee_settings')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch deposit addresses
  const { data: depositAddresses } = useQuery({
    queryKey: ['deposit-addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_addresses')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all transfers
  const { data: transfers } = useQuery({
    queryKey: ['admin-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all internal transfers
  const { data: internalTransfers } = useQuery({
    queryKey: ['admin-internal-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all crypto transfers
  const { data: cryptoTransfers } = useQuery({
    queryKey: ['admin-crypto-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all crypto wallets
  const { data: cryptoWallets } = useQuery({
    queryKey: ['admin-crypto-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch transaction history for selected user
  const { data: userTransactions } = useQuery({
    queryKey: ['user-transactions', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser?.user_id) return [];
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('user_id', selectedUser.user_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser?.user_id && userDetailsOpen,
  });

  // Update user balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, balance, savingsBalance }: { userId: string; balance: number; savingsBalance: number }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ balance, savings_balance: savingsBalance })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Success', description: 'User balance updated successfully' });
      setEditBalanceOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Fund account mutation (add or subtract)
  const fundAccountMutation = useMutation({
    mutationFn: async ({ userId, amount, description, operation }: { userId: string; amount: number; description: string; operation: 'add' | 'subtract' }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance, full_name')
        .eq('user_id', userId)
        .single();

      if (!profile) throw new Error('User not found');

      const newBalance = operation === 'add' 
        ? (profile.balance || 0) + amount 
        : (profile.balance || 0) - amount;

      if (newBalance < 0) throw new Error('Insufficient balance for this operation');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('transaction_history')
        .insert({
          user_id: userId,
          transaction_type: operation === 'add' ? 'credit' : 'debit',
          amount: amount,
          description: description || (operation === 'add' ? 'Account Funded by Admin' : 'Funds Deducted by Admin'),
          status: 'completed'
        });

      if (historyError) throw historyError;

      await supabase.from('admin_logs').insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: operation === 'add' ? 'fund_account' : 'deduct_funds',
        details: { amount, description, operation }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Success', description: 'Account updated successfully' });
      setFundAccountOpen(false);
      setSelectedUser(null);
      setFundAmount('');
      setFundDescription('');
      setFundOperation('add');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Fund crypto mutation
  const fundCryptoMutation = useMutation({
    mutationFn: async ({ userId, coinSymbol, amount }: { userId: string; coinSymbol: string; amount: number }) => {
      const coin = CRYPTO_COINS.find(c => c.symbol === coinSymbol);
      if (!coin) throw new Error('Invalid coin');

      const { data: existingWallet } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('coin_symbol', coinSymbol)
        .maybeSingle();

      if (existingWallet) {
        const { error } = await supabase
          .from('crypto_wallets')
          .update({ balance: (existingWallet.balance || 0) + amount })
          .eq('id', existingWallet.id);
        if (error) throw error;
      } else {
        const walletAddress = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const { error } = await supabase
          .from('crypto_wallets')
          .insert({
            user_id: userId,
            coin_symbol: coinSymbol,
            coin_name: coin.name,
            network: coin.network,
            wallet_address: walletAddress,
            balance: amount
          });
        if (error) throw error;
      }

      await supabase.from('transaction_history').insert({
        user_id: userId,
        transaction_type: 'crypto_credit',
        amount: 0,
        crypto_amount: amount,
        crypto_symbol: coinSymbol,
        description: `${coinSymbol} credited by Admin`,
        status: 'completed'
      });

      await supabase.from('admin_logs').insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: 'fund_crypto',
        details: { coin: coinSymbol, amount }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-crypto-wallets'] });
      toast({ title: 'Success', description: 'Crypto funded successfully' });
      setFundCryptoOpen(false);
      setSelectedUser(null);
      setCryptoAmount('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Block/Unblock user mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: isBlocked })
        .eq('user_id', userId);
      
      if (error) throw error;

      await supabase.from('admin_logs').insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: isBlocked ? 'block_user' : 'unblock_user',
        details: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Success', description: 'User status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Approve transfer mutation
  const approveTransferMutation = useMutation({
    mutationFn: async ({ transferId, userId }: { transferId: string; userId: string }) => {
      // Update transfer status to completed
      const { error: transferError } = await supabase
        .from('transfers')
        .update({ status: 'completed' })
        .eq('id', transferId);
      
      if (transferError) throw transferError;

      // Update transaction history for this user
      const { error: historyError } = await supabase
        .from('transaction_history')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (historyError) console.error('History update error:', historyError);

      await supabase.from('admin_logs').insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: 'approve_transfer',
        details: { transfer_id: transferId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['user-transactions'] });
      toast({ title: 'Success', description: 'Transfer approved and marked as completed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update transfer fee mutation
  const updateTransferFeeMutation = useMutation({
    mutationFn: async (fee: string) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'transfer_fee')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ setting_value: fee })
          .eq('setting_key', 'transfer_fee');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ setting_key: 'transfer_fee', setting_value: fee });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ title: 'Success', description: 'Transfer fee updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update/Create crypto fee mutation
  const updateCryptoFeeMutation = useMutation({
    mutationFn: async ({ coinSymbol, coinName, feeAmount }: { coinSymbol: string; coinName: string; feeAmount: number }) => {
      const { data: existing } = await supabase
        .from('crypto_fee_settings')
        .select('*')
        .eq('coin_symbol', coinSymbol)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('crypto_fee_settings')
          .update({ fee_amount: feeAmount })
          .eq('coin_symbol', coinSymbol);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crypto_fee_settings')
          .insert({ coin_symbol: coinSymbol, coin_name: coinName, fee_amount: feeAmount });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto-fee-settings'] });
      toast({ title: 'Success', description: 'Crypto fee updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update/Create deposit address mutation
  const updateDepositAddressMutation = useMutation({
    mutationFn: async ({ coinSymbol, coinName, network, walletAddress }: { coinSymbol: string; coinName: string; network: string; walletAddress: string }) => {
      const { data: existing } = await supabase
        .from('deposit_addresses')
        .select('*')
        .eq('coin_symbol', coinSymbol)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('deposit_addresses')
          .update({ wallet_address: walletAddress })
          .eq('coin_symbol', coinSymbol);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('deposit_addresses')
          .insert({ coin_symbol: coinSymbol, coin_name: coinName, network, wallet_address: walletAddress });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-addresses'] });
      toast({ title: 'Success', description: 'Deposit address updated' });
      setWalletEditOpen(false);
      setSelectedWalletCoin(null);
      setNewWalletAddress('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const filteredUsers = users?.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.account_number?.includes(searchTerm)
  );

  const totalBalance = users?.reduce((acc, u) => acc + (u.balance || 0), 0) || 0;
  const totalSavings = users?.reduce((acc, u) => acc + (u.savings_balance || 0), 0) || 0;
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => !u.is_blocked)?.length || 0;
  const totalTransfers = (transfers?.length || 0) + (internalTransfers?.length || 0);
  const pendingTransfers = transfers?.filter(t => t.status === 'pending') || [];
  const currentTransferFee = settings?.find(s => s.setting_key === 'transfer_fee')?.setting_value || '25';

  const handleEditBalance = (user: any) => {
    setSelectedUser(user);
    setNewBalance(user.balance?.toString() || '0');
    setNewSavingsBalance(user.savings_balance?.toString() || '0');
    setEditBalanceOpen(true);
  };

  const handleFundAccount = (user: any) => {
    setSelectedUser(user);
    setFundAmount('');
    setFundDescription('');
    setFundOperation('add');
    setFundAccountOpen(true);
  };

  const handleFundCrypto = (user: any) => {
    setSelectedUser(user);
    setCryptoAmount('');
    setSelectedCrypto('BTC');
    setFundCryptoOpen(true);
  };

  const handleSaveBalance = () => {
    if (!selectedUser) return;
    updateBalanceMutation.mutate({
      userId: selectedUser.user_id,
      balance: parseFloat(newBalance) || 0,
      savingsBalance: parseFloat(newSavingsBalance) || 0,
    });
  };

  const handleFundSubmit = () => {
    if (!selectedUser || !fundAmount) return;
    fundAccountMutation.mutate({
      userId: selectedUser.user_id,
      amount: parseFloat(fundAmount),
      description: fundDescription,
      operation: fundOperation,
    });
  };

  const handleFundCryptoSubmit = () => {
    if (!selectedUser || !cryptoAmount || !selectedCrypto) return;
    fundCryptoMutation.mutate({
      userId: selectedUser.user_id,
      coinSymbol: selectedCrypto,
      amount: parseFloat(cryptoAmount),
    });
  };

  const handleEditWalletAddress = (coin: typeof CRYPTO_COINS[0]) => {
    setSelectedWalletCoin(coin);
    const existing = depositAddresses?.find(d => d.coin_symbol === coin.symbol);
    setNewWalletAddress(existing?.wallet_address || '');
    setWalletEditOpen(true);
  };

  const handleSaveWalletAddress = () => {
    if (!selectedWalletCoin || !newWalletAddress) return;
    updateDepositAddressMutation.mutate({
      coinSymbol: selectedWalletCoin.symbol,
      coinName: selectedWalletCoin.name,
      network: selectedWalletCoin.network,
      walletAddress: newWalletAddress,
    });
  };

  const sidebarItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminSection, label: 'Manage Users', icon: Users },
    { id: 'balances' as AdminSection, label: 'Edit Balances', icon: DollarSign },
    { id: 'crypto-funding' as AdminSection, label: 'Crypto Funding', icon: Bitcoin },
    { id: 'wallets' as AdminSection, label: 'Wallet Addresses', icon: Wallet },
    { id: 'pending-transfers' as AdminSection, label: 'Pending Transfers', icon: ArrowLeftRight },
    { id: 'crypto-fees' as AdminSection, label: 'Crypto Fees', icon: Receipt },
    { id: 'bank-fees' as AdminSection, label: 'Bank Fees', icon: Building },
    { id: 'settings' as AdminSection, label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getUserName = (userId: string) => {
    const u = users?.find(u => u.user_id === userId);
    return u?.full_name || u?.email || userId.slice(0, 8);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview of your banking platform</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold">{totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-3xl font-bold">{activeUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Deposits</p>
                      <p className="text-3xl font-bold">${totalBalance.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Transfers</p>
                      <p className="text-3xl font-bold">{pendingTransfers.length}</p>
                    </div>
                    <ArrowUpDown className="h-8 w-8 text-orange-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Savings</p>
                      <p className="text-3xl font-bold">${totalSavings.toLocaleString()}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Crypto Wallets</p>
                      <p className="text-3xl font-bold">{cryptoWallets?.length || 0}</p>
                    </div>
                    <Bitcoin className="h-8 w-8 text-orange-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
              <p className="text-muted-foreground">View and manage all registered users</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or account number..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Account #</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                        <TableCell>{u.email || 'N/A'}</TableCell>
                        <TableCell>{u.account_number || 'N/A'}</TableCell>
                        <TableCell>${(u.balance || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={u.is_blocked ? 'destructive' : 'default'}>
                            {u.is_blocked ? 'Blocked' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={u.is_blocked ? 'default' : 'destructive'}
                              onClick={() => toggleBlockMutation.mutate({ userId: u.user_id, isBlocked: !u.is_blocked })}
                            >
                              {u.is_blocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'balances':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Balances</h1>
              <p className="text-muted-foreground">Add or subtract funds from user accounts</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Main Balance</TableHead>
                      <TableHead>Savings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                        <TableCell>{u.email || 'N/A'}</TableCell>
                        <TableCell>${(u.balance || 0).toLocaleString()}</TableCell>
                        <TableCell>${(u.savings_balance || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditBalance(u)}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button size="sm" onClick={() => handleFundAccount(u)}>
                              <Plus className="h-4 w-4 mr-1" /> Fund
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'crypto-funding':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crypto Funding</h1>
              <p className="text-muted-foreground">Fund user cryptocurrency wallets</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Account #</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                        <TableCell>{u.email || 'N/A'}</TableCell>
                        <TableCell>{u.account_number || 'N/A'}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleFundCrypto(u)}>
                            <Bitcoin className="h-4 w-4 mr-1" /> Fund Crypto
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'wallets':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Deposit Wallet Addresses</h1>
              <p className="text-muted-foreground">Manage website deposit addresses that users see</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Configure Deposit Addresses</CardTitle>
                <CardDescription>Set wallet addresses for each cryptocurrency. Users will see these when making deposits.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {CRYPTO_COINS.map((coin) => {
                    const existingAddress = depositAddresses?.find(d => d.coin_symbol === coin.symbol);
                    return (
                      <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-base px-3 py-1">{coin.symbol}</Badge>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-muted-foreground">{coin.network}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {existingAddress ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate">
                              {existingAddress.wallet_address}
                            </code>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not configured</span>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleEditWalletAddress(coin)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'pending-transfers':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pending Transfers</h1>
              <p className="text-muted-foreground">Review and approve pending transfers</p>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No pending transfers
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingTransfers?.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell>{format(new Date(transfer.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell>{getUserName(transfer.user_id)}</TableCell>
                          <TableCell>{transfer.recipient_name}</TableCell>
                          <TableCell>{transfer.recipient_bank}</TableCell>
                          <TableCell>${transfer.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{transfer.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => approveTransferMutation.mutate({ 
                                transferId: transfer.id, 
                                userId: transfer.user_id 
                              })}
                              disabled={approveTransferMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'crypto-fees':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crypto Fees</h1>
              <p className="text-muted-foreground">Set fees for each cryptocurrency</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Crypto Transfer Fees</CardTitle>
                <CardDescription>Configure fees for each cryptocurrency. Users can choose to pay with any of these coins.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {CRYPTO_COINS.map((coin) => {
                    const existingFee = cryptoFeeSettings?.find(f => f.coin_symbol === coin.symbol);
                    const currentValue = cryptoFeeAmounts[coin.symbol] ?? (existingFee?.fee_amount?.toString() || '0');
                    return (
                      <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-base px-3 py-1">{coin.symbol}</Badge>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-muted-foreground">Current fee: {existingFee?.fee_amount || 0} {coin.symbol}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="0"
                            className="w-32"
                            value={currentValue}
                            onChange={(e) => setCryptoFeeAmounts(prev => ({ ...prev, [coin.symbol]: e.target.value }))}
                          />
                          <Button 
                            size="sm"
                            onClick={() => updateCryptoFeeMutation.mutate({
                              coinSymbol: coin.symbol,
                              coinName: coin.name,
                              feeAmount: parseFloat(cryptoFeeAmounts[coin.symbol] || '0')
                            })}
                            disabled={updateCryptoFeeMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'bank-fees':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bank Fees</h1>
              <p className="text-muted-foreground">Manage bank transfer fees</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer Fee</CardTitle>
                <CardDescription>Set the fee for bank transfers (local and international)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <Label>Current Bank Fee ($)</Label>
                    <Input
                      type="number"
                      value={transferFee || currentTransferFee}
                      onChange={(e) => setTransferFee(e.target.value)}
                      placeholder="25"
                    />
                  </div>
                  <Button 
                    className="mt-6"
                    onClick={() => updateTransferFeeMutation.mutate(transferFee || currentTransferFee)}
                    disabled={updateTransferFeeMutation.isPending}
                  >
                    Update Fee
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current fee: ${currentTransferFee}
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Platform configuration</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Admin Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Admin Email:</strong> {user?.email}</p>
                  <p><strong>Admin ID:</strong> {user?.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.id === 'pending-transfers' && pendingTransfers.length > 0 && (
                <Badge variant="destructive" className="ml-auto">{pendingTransfers.length}</Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>

      {/* Edit Balance Dialog */}
      <Dialog open={editBalanceOpen} onOpenChange={setEditBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Balance</DialogTitle>
            <DialogDescription>
              Update balance for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Main Balance ($)</Label>
              <Input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
            <div>
              <Label>Savings Balance ($)</Label>
              <Input
                type="number"
                value={newSavingsBalance}
                onChange={(e) => setNewSavingsBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBalanceOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBalance} disabled={updateBalanceMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Account Dialog */}
      <Dialog open={fundAccountOpen} onOpenChange={setFundAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund/Deduct Account</DialogTitle>
            <DialogDescription>
              Add or subtract funds for {selectedUser?.full_name || selectedUser?.email}
              <br />
              <span className="text-foreground">Current Balance: ${(selectedUser?.balance || 0).toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Operation</Label>
              <Select value={fundOperation} onValueChange={(v: 'add' | 'subtract') => setFundOperation(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-500" />
                      Add Funds
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-500" />
                      Subtract Funds
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={fundDescription}
                onChange={(e) => setFundDescription(e.target.value)}
                placeholder="Reason for funding"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundAccountOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleFundSubmit} 
              disabled={fundAccountMutation.isPending}
              variant={fundOperation === 'subtract' ? 'destructive' : 'default'}
            >
              {fundOperation === 'add' ? 'Add Funds' : 'Deduct Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Crypto Dialog */}
      <Dialog open={fundCryptoOpen} onOpenChange={setFundCryptoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Crypto Wallet</DialogTitle>
            <DialogDescription>
              Add cryptocurrency for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cryptocurrency</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTO_COINS.map((coin) => (
                    <SelectItem key={coin.symbol} value={coin.symbol}>
                      {coin.name} ({coin.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.0001"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundCryptoOpen(false)}>Cancel</Button>
            <Button onClick={handleFundCryptoSubmit} disabled={fundCryptoMutation.isPending}>
              Fund Crypto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Address Dialog */}
      <Dialog open={walletEditOpen} onOpenChange={setWalletEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deposit Address</DialogTitle>
            <DialogDescription>
              Set the deposit address for {selectedWalletCoin?.name} ({selectedWalletCoin?.symbol})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Wallet Address</Label>
              <Input
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWalletAddress} disabled={updateDepositAddressMutation.isPending}>
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>User Details: {selectedUser?.full_name || 'N/A'}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium font-mono">{selectedUser.account_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.is_blocked ? 'destructive' : 'default'}>
                    {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{format(new Date(selectedUser.created_at), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Main Balance</p>
                    <p className="text-2xl font-bold">${(selectedUser.balance || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Savings Balance</p>
                    <p className="text-2xl font-bold">${(selectedUser.savings_balance || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="font-semibold mb-3">Transaction History</h3>
                <ScrollArea className="h-64 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userTransactions?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        userTransactions?.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.created_at), 'MMM dd, HH:mm')}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {tx.transaction_type.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-32 truncate">{tx.description || '-'}</TableCell>
                            <TableCell>
                              {tx.crypto_amount ? (
                                <span>{tx.crypto_amount} {tx.crypto_symbol}</span>
                              ) : (
                                <span className={tx.transaction_type.includes('out') || tx.transaction_type === 'debit' ? 'text-red-500' : 'text-green-500'}>
                                  {tx.transaction_type.includes('out') || tx.transaction_type === 'debit' ? '-' : '+'}${tx.amount?.toLocaleString()}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                                {tx.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => { setUserDetailsOpen(false); handleFundAccount(selectedUser); }}>
                  <Plus className="h-4 w-4 mr-1" /> Fund Account
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setUserDetailsOpen(false); handleEditBalance(selectedUser); }}>
                  <Edit className="h-4 w-4 mr-1" /> Edit Balance
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setUserDetailsOpen(false); handleFundCrypto(selectedUser); }}>
                  <Bitcoin className="h-4 w-4 mr-1" /> Fund Crypto
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedUser.is_blocked ? 'default' : 'destructive'}
                  onClick={() => {
                    toggleBlockMutation.mutate({ userId: selectedUser.user_id, isBlocked: !selectedUser.is_blocked });
                    setUserDetailsOpen(false);
                  }}
                >
                  {selectedUser.is_blocked ? <CheckCircle className="h-4 w-4 mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                  {selectedUser.is_blocked ? 'Unblock' : 'Block'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
