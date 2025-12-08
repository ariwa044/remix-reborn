import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Users, DollarSign, CreditCard, ArrowUpDown, Shield, Search, Edit, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [newSavingsBalance, setNewSavingsBalance] = useState('');

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

  // Fetch all transfers
  const { data: transfers, isLoading: transfersLoading } = useQuery({
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

  // Block/Unblock user mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: isBlocked })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Success', description: 'User status updated' });
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
  const totalUsers = users?.length || 0;
  const totalTransfers = (transfers?.length || 0) + (internalTransfers?.length || 0);

  const handleEditBalance = (user: any) => {
    setSelectedUser(user);
    setNewBalance(user.balance?.toString() || '0');
    setNewSavingsBalance(user.savings_balance?.toString() || '0');
    setEditBalanceOpen(true);
  };

  const handleSaveBalance = () => {
    if (!selectedUser) return;
    updateBalanceMutation.mutate({
      userId: selectedUser.user_id,
      balance: parseFloat(newBalance) || 0,
      savingsBalance: parseFloat(newSavingsBalance) || 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage users, view transfers, and update balances</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">${totalBalance.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transfers</p>
                  <p className="text-2xl font-bold">{totalTransfers}</p>
                </div>
                <ArrowUpDown className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crypto Transfers</p>
                  <p className="text-2xl font-bold">{cryptoTransfers?.length || 0}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="internal">Internal Transfers</TabsTrigger>
            <TabsTrigger value="crypto">Crypto Transfers</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or account number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Savings</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.account_number || 'N/A'}</TableCell>
                            <TableCell>${(u.balance || 0).toLocaleString()}</TableCell>
                            <TableCell>${(u.savings_balance || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              {u.is_blocked ? (
                                <Badge variant="destructive">Blocked</Badge>
                              ) : (
                                <Badge variant="default">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(u.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBalance(u)}
                                >
                                  <Edit className="h-4 w-4" />
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>External Transfers</CardTitle>
                <CardDescription>View all external bank transfers</CardDescription>
              </CardHeader>
              <CardContent>
                {transfersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transfers?.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{format(new Date(t.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                            <TableCell className="capitalize">{t.transfer_type}</TableCell>
                            <TableCell>{t.recipient_name}</TableCell>
                            <TableCell>{t.recipient_bank}</TableCell>
                            <TableCell>${t.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                                {t.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Internal Transfers</CardTitle>
                <CardDescription>View all user-to-user transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Sender ID</TableHead>
                        <TableHead>Recipient ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalTransfers?.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{format(new Date(t.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell className="font-mono text-xs">{t.sender_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{t.recipient_id.slice(0, 8)}...</TableCell>
                          <TableCell>${t.amount.toLocaleString()}</TableCell>
                          <TableCell>{t.description || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                              {t.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crypto Transfers</CardTitle>
                <CardDescription>View all cryptocurrency transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Coin</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Sender ID</TableHead>
                        <TableHead>Recipient ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cryptoTransfers?.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{format(new Date(t.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell>{t.coin_symbol}</TableCell>
                          <TableCell>{t.network}</TableCell>
                          <TableCell>{t.amount}</TableCell>
                          <TableCell className="font-mono text-xs">{t.sender_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{t.recipient_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                              {t.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Main Balance ($)</Label>
              <Input
                id="balance"
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings">Savings Balance ($)</Label>
              <Input
                id="savings"
                type="number"
                value={newSavingsBalance}
                onChange={(e) => setNewSavingsBalance(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBalanceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBalance} disabled={updateBalanceMutation.isPending}>
              {updateBalanceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
