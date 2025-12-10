import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TransferReceipt } from '@/components/TransferReceipt';
import { BlockedAccountModal } from '@/components/BlockedAccountModal';
import { sendTransactionAlert } from '@/hooks/useTransactionAlert';
import bitpayLogo from '@/assets/bitpay-logo.png';
import {
  ArrowLeft,
  Users,
  DollarSign,
  FileText,
  Check,
  AlertCircle,
  Search
} from 'lucide-react';

type Step = 'search' | 'details' | 'pin' | 'receipt';

interface RecipientInfo {
  user_id: string;
  full_name: string;
  email: string;
  account_number: string;
}

export default function InternalTransfer() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('search');
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [accountSearch, setAccountSearch] = useState('');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('transfer_pin, balance')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasPin(!!data?.transfer_pin);
        setUserBalance(data?.balance || 0);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSearchAccount = async () => {
    if (!accountSearch || accountSearch.length !== 10) {
      setSearchError('Please enter a valid 10-digit account number');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, account_number')
      .eq('account_number', accountSearch)
      .maybeSingle();

    if (error || !data) {
      setSearchError('Account not found. Please check the account number.');
      setRecipient(null);
    } else if (data.user_id === user?.id) {
      setSearchError('You cannot transfer to your own account.');
      setRecipient(null);
    } else {
      setRecipient(data);
      setSearchError('');
    }
    setIsSearching(false);
  };

  const handlePinInput = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value.slice(-1);
    
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    if (value && index < 3) {
      const nextInput = document.getElementById(`${isConfirm ? 'confirm-' : ''}pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCreatePin = async () => {
    const pinString = pin.join('');
    const confirmPinString = confirmPin.join('');

    if (pinString.length !== 4) {
      toast({ title: 'Error', description: 'Please enter a 4-digit PIN', variant: 'destructive' });
      return;
    }

    if (pinString !== confirmPinString) {
      toast({ title: 'Error', description: 'PINs do not match', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ transfer_pin: pinString })
      .eq('user_id', user!.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to create PIN', variant: 'destructive' });
    } else {
      setHasPin(true);
      setIsCreatingPin(false);
      toast({ title: 'Success', description: 'Transfer PIN created successfully' });
    }
    setIsProcessing(false);
  };

  const handleVerifyPin = async () => {
    const pinString = pin.join('');

    if (pinString.length !== 4) {
      toast({ title: 'Error', description: 'Please enter your 4-digit PIN', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('transfer_pin, balance, is_blocked')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (profileData?.transfer_pin !== pinString) {
      toast({ title: 'Error', description: 'Invalid PIN', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Check if account is blocked
    if (profileData?.is_blocked) {
      setShowBlockedModal(true);
      setIsProcessing(false);
      return;
    }

    const transferAmount = parseFloat(amount);
    
    // Check balance
    if ((profileData?.balance || 0) < transferAmount) {
      toast({ title: 'Insufficient Funds', description: 'You do not have enough balance for this transfer', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Deduct from sender
    const { error: senderError } = await supabase
      .from('profiles')
      .update({ balance: (profileData?.balance || 0) - transferAmount })
      .eq('user_id', user!.id);

    if (senderError) {
      toast({ title: 'Error', description: 'Transfer failed', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Add to recipient
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', recipient!.user_id)
      .maybeSingle();

    await supabase
      .from('profiles')
      .update({ balance: (recipientProfile?.balance || 0) + transferAmount })
      .eq('user_id', recipient!.user_id);

    // Create internal transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('internal_transfers')
      .insert({
        sender_id: user!.id,
        recipient_id: recipient!.user_id,
        amount: transferAmount,
        description: description || null,
        status: 'completed'
      })
      .select()
      .single();

    // Add to transaction history for sender
    await supabase.from('transaction_history').insert({
      user_id: user!.id,
      transaction_type: 'internal_transfer_out',
      amount: transferAmount,
      recipient_name: recipient!.full_name,
      recipient_account: recipient!.account_number,
      description: description || 'Internal Transfer',
      status: 'completed'
    });

    // Add to transaction history for recipient
    await supabase.from('transaction_history').insert({
      user_id: recipient!.user_id,
      transaction_type: 'internal_transfer_in',
      amount: transferAmount,
      recipient_name: user?.user_metadata?.full_name || user?.email,
      description: description || 'Internal Transfer Received',
      status: 'completed'
    });

    if (transferError) {
      toast({ title: 'Error', description: 'Transfer failed', variant: 'destructive' });
    } else {
      setTransferId(transfer.id);
      setStep('receipt');
      toast({ title: 'Success', description: 'Transfer completed successfully' });
      
      // Send debit alert to sender
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, email, balance')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (senderProfile?.email) {
        sendTransactionAlert({
          email: senderProfile.email,
          fullName: senderProfile.full_name || 'Customer',
          type: 'debit',
          amount: transferAmount,
          currency: 'USD',
          description: description || `Transfer to ${recipient.full_name}`,
          balance: senderProfile.balance || 0,
          transactionId: transfer.id,
          recipientName: recipient.full_name || 'N/A',
          recipientAccount: recipient.account_number,
        });
      }
      
      // Send credit alert to recipient
      const { data: recipientFullProfile } = await supabase
        .from('profiles')
        .select('full_name, email, balance')
        .eq('user_id', recipient.user_id)
        .maybeSingle();
      
      if (recipientFullProfile?.email) {
        sendTransactionAlert({
          email: recipientFullProfile.email,
          fullName: recipientFullProfile.full_name || 'Customer',
          type: 'credit',
          amount: transferAmount,
          currency: 'USD',
          description: description || 'Internal Transfer Received',
          balance: recipientFullProfile.balance || 0,
          transactionId: transfer.id,
        });
      }
    }
    setIsProcessing(false);
  };

  const handleContinue = () => {
    if (!recipient || !amount) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (transferAmount > userBalance) {
      toast({ title: 'Insufficient Funds', description: `Your balance is $${userBalance.toFixed(2)}`, variant: 'destructive' });
      return;
    }

    if (!hasPin) {
      setIsCreatingPin(true);
    }
    setStep('pin');
  };

  if (loading || hasPin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => step === 'search' ? navigate('/dashboard') : setStep('search')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={bitpayLogo} alt="Heritage Bank" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">Send to User</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Balance Display */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 mb-6 text-white text-center">
          <p className="text-sm text-white/80">Available Balance</p>
          <p className="text-2xl font-bold">${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Step: Search Account */}
        {step === 'search' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Send to Heritage User</h2>
              <p className="text-muted-foreground">Enter recipient's 10-digit account number</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="accountSearch" className="flex items-center gap-2">
                  <Search className="h-4 w-4" /> Account Number
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="accountSearch"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit account number"
                    className="flex-1"
                  />
                  <Button onClick={handleSearchAccount} disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Find'}
                  </Button>
                </div>
                {searchError && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {searchError}
                  </p>
                )}
              </div>

              {recipient && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500/10 rounded-full p-2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-green-500 font-medium">Account Found</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="text-foreground font-medium">{recipient.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account</span>
                      <span className="text-foreground font-mono">{recipient.account_number}</span>
                    </div>
                  </div>
                </div>
              )}

              {recipient && (
                <>
                  <div>
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Amount *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Description (Optional)
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this transfer for?"
                      className="mt-1"
                    />
                  </div>

                  <Button onClick={handleContinue} className="w-full">Continue</Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step: PIN */}
        {step === 'pin' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isCreatingPin ? 'Create Transfer PIN' : 'Enter Transfer PIN'}
              </h2>
              <p className="text-muted-foreground">
                {isCreatingPin 
                  ? 'Create a 4-digit PIN to secure your transfers' 
                  : 'Enter your 4-digit PIN to confirm transfer'}
              </p>
            </div>

            {isCreatingPin ? (
              <div className="space-y-6">
                <div>
                  <Label className="block text-center mb-3">Enter New PIN</Label>
                  <div className="flex justify-center gap-3">
                    {pin.map((digit, idx) => (
                      <Input
                        key={idx}
                        id={`pin-${idx}`}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinInput(idx, e.target.value)}
                        className="w-14 h-14 text-center text-2xl"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="block text-center mb-3">Confirm PIN</Label>
                  <div className="flex justify-center gap-3">
                    {confirmPin.map((digit, idx) => (
                      <Input
                        key={idx}
                        id={`confirm-pin-${idx}`}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinInput(idx, e.target.value, true)}
                        className="w-14 h-14 text-center text-2xl"
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreatePin} disabled={isProcessing} className="w-full">
                  {isProcessing ? 'Creating PIN...' : 'Create PIN & Continue'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center gap-3">
                  {pin.map((digit, idx) => (
                    <Input
                      key={idx}
                      id={`pin-${idx}`}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinInput(idx, e.target.value)}
                      className="w-14 h-14 text-center text-2xl"
                    />
                  ))}
                </div>

                <Button onClick={handleVerifyPin} disabled={isProcessing} className="w-full">
                  {isProcessing ? 'Processing...' : 'Confirm Transfer'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Receipt */}
        {step === 'receipt' && transferId && recipient && (
          <TransferReceipt
            amount={parseFloat(amount)}
            recipientName={recipient.full_name || 'N/A'}
            recipientAccount={recipient.account_number}
            recipientBank="Heritage Bank"
            transferType="internal"
            transactionId={transferId}
            date={new Date()}
            description={description}
            currency="USD"
            onClose={() => navigate('/dashboard')}
          />
        )}
      </main>

      {/* Blocked Account Modal */}
      <BlockedAccountModal 
        isOpen={showBlockedModal} 
        onClose={() => setShowBlockedModal(false)} 
      />
    </div>
  );
}
