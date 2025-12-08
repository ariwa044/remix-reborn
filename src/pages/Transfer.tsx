import { useState, useEffect } from 'react';
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
  Globe,
  Building2,
  User,
  CreditCard,
  DollarSign,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';

type TransferType = 'local' | 'international';
type Step = 'type' | 'details' | 'pin' | 'receipt';

interface TransferDetails {
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  amount: string;
  currency: string;
  swiftCode: string;
  routingNumber: string;
  description: string;
}

export default function Transfer() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('type');
  const [transferType, setTransferType] = useState<TransferType>('local');
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [transferDetails, setTransferDetails] = useState<TransferDetails>({
    recipientName: '',
    recipientAccount: '',
    recipientBank: '',
    amount: '',
    currency: 'USD',
    swiftCode: '',
    routingNumber: '',
    description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferId, setTransferId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkPin = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('transfer_pin')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasPin(!!data?.transfer_pin);
      }
    };
    checkPin();
  }, [user]);

  const handlePinInput = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value.slice(-1);
    
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    // Auto-focus next input
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
    const { data } = await supabase
      .from('profiles')
      .select('transfer_pin, balance')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (data?.transfer_pin !== pinString) {
      toast({ title: 'Error', description: 'Invalid PIN', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    const transferAmount = parseFloat(transferDetails.amount);
    
    // Check balance
    if ((data?.balance || 0) < transferAmount) {
      toast({ title: 'Insufficient Funds', description: 'You do not have enough balance for this transfer', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Deduct from sender balance
    await supabase
      .from('profiles')
      .update({ balance: (data?.balance || 0) - transferAmount })
      .eq('user_id', user!.id);

    // Process transfer
    const { data: transfer, error } = await supabase
      .from('transfers')
      .insert({
        user_id: user!.id,
        transfer_type: transferType,
        recipient_name: transferDetails.recipientName,
        recipient_account: transferDetails.recipientAccount,
        recipient_bank: transferDetails.recipientBank,
        amount: transferAmount,
        currency: transferDetails.currency,
        swift_code: transferDetails.swiftCode || null,
        routing_number: transferDetails.routingNumber || null,
        description: transferDetails.description || null
      })
      .select()
      .single();

    // Add to transaction history
    await supabase.from('transaction_history').insert({
      user_id: user!.id,
      transaction_type: transferType === 'local' ? 'local_transfer' : 'international_transfer',
      amount: transferAmount,
      recipient_name: transferDetails.recipientName,
      recipient_account: transferDetails.recipientAccount,
      recipient_bank: transferDetails.recipientBank,
      description: transferDetails.description || `${transferType} transfer`,
      currency: transferDetails.currency,
      status: 'completed'
    });

    if (error) {
      toast({ title: 'Error', description: 'Transfer failed', variant: 'destructive' });
    } else {
      setTransferId(transfer.id);
      setStep('receipt');
      toast({ title: 'Success', description: 'Transfer completed successfully' });
    }
    setIsProcessing(false);
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferDetails.recipientName || !transferDetails.recipientAccount || 
        !transferDetails.recipientBank || !transferDetails.amount) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (transferType === 'international' && !transferDetails.swiftCode) {
      toast({ title: 'Error', description: 'SWIFT code is required for international transfers', variant: 'destructive' });
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
          <button onClick={() => step === 'type' ? navigate('/dashboard') : setStep('type')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={bitpayLogo} alt="Heritage Bank" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">Money Transfer</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Step: Choose Transfer Type */}
        {step === 'type' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Send Money</h2>
              <p className="text-muted-foreground">Choose your transfer type</p>
            </div>

            <button
              onClick={() => { setTransferType('local'); setStep('details'); }}
              className="w-full bg-card border border-border rounded-xl p-6 flex items-center gap-4 hover:border-primary transition-colors"
            >
              <div className="bg-primary/10 rounded-lg p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Local Transfer</h3>
                <p className="text-sm text-muted-foreground">Send to domestic bank accounts</p>
              </div>
            </button>

            <button
              onClick={() => { setTransferType('international'); setStep('details'); }}
              className="w-full bg-card border border-border rounded-xl p-6 flex items-center gap-4 hover:border-primary transition-colors"
            >
              <div className="bg-accent/10 rounded-lg p-3">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">International Transfer</h3>
                <p className="text-sm text-muted-foreground">Send to banks worldwide</p>
              </div>
            </button>
          </div>
        )}

        {/* Step: Transfer Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmitDetails} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {transferType === 'local' ? 'Local' : 'International'} Transfer
              </h2>
              <p className="text-muted-foreground">Enter recipient details</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="recipientName" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Recipient Name *
                </Label>
                <Input
                  id="recipientName"
                  value={transferDetails.recipientName}
                  onChange={(e) => setTransferDetails({ ...transferDetails, recipientName: e.target.value })}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="recipientAccount" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Account Number *
                </Label>
                <Input
                  id="recipientAccount"
                  value={transferDetails.recipientAccount}
                  onChange={(e) => setTransferDetails({ ...transferDetails, recipientAccount: e.target.value })}
                  placeholder="Enter account number"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="recipientBank" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Bank Name *
                </Label>
                <Input
                  id="recipientBank"
                  value={transferDetails.recipientBank}
                  onChange={(e) => setTransferDetails({ ...transferDetails, recipientBank: e.target.value })}
                  placeholder="Enter bank name"
                  className="mt-1"
                />
              </div>

              {transferType === 'international' && (
                <>
                  <div>
                    <Label htmlFor="swiftCode" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" /> SWIFT/BIC Code *
                    </Label>
                    <Input
                      id="swiftCode"
                      value={transferDetails.swiftCode}
                      onChange={(e) => setTransferDetails({ ...transferDetails, swiftCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., CHASUS33"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number (Optional)</Label>
                    <Input
                      id="routingNumber"
                      value={transferDetails.routingNumber}
                      onChange={(e) => setTransferDetails({ ...transferDetails, routingNumber: e.target.value })}
                      placeholder="Enter routing number"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferDetails.amount}
                    onChange={(e) => setTransferDetails({ ...transferDetails, amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={transferDetails.currency}
                    onChange={(e) => setTransferDetails({ ...transferDetails, currency: e.target.value })}
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="NGN">NGN</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Description (Optional)
                </Label>
                <Input
                  id="description"
                  value={transferDetails.description}
                  onChange={(e) => setTransferDetails({ ...transferDetails, description: e.target.value })}
                  placeholder="What's this transfer for?"
                  className="mt-1"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">Continue</Button>
          </form>
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
        {step === 'receipt' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <span className="text-8xl font-bold text-foreground rotate-[-30deg]">HERITAGE</span>
              </div>

              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Transfer Successful!</h2>
                  <p className="text-muted-foreground">Your transfer has been processed</p>
                </div>

                <div className="border-t border-b border-border py-6 my-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-sm text-foreground">{transferId?.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer Type</span>
                    <span className="text-foreground capitalize">{transferType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="text-foreground">{transferDetails.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="text-foreground">****{transferDetails.recipientAccount.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="text-foreground">{transferDetails.recipientBank}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-primary">{transferDetails.currency} {parseFloat(transferDetails.amount).toFixed(2)}</span>
                  </div>
                  {transferDetails.description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description</span>
                      <span className="text-foreground">{transferDetails.description}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-green-500">Completed</span>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Heritage Bank • Secure Banking</p>
                </div>
              </div>
            </div>

            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}