import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTransferFee } from '@/hooks/useTransferFee';
import { TransferReceipt } from '@/components/TransferReceipt';
import { BlockedAccountModal } from '@/components/BlockedAccountModal';
import { sendTransactionAlert } from '@/hooks/useTransactionAlert';
import bitpayLogo from '@/assets/bitpay-logo.png';
import {
  ArrowLeft,
  Globe,
  Building2,
  User,
  CreditCard,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';

type TransferType = 'local' | 'international';
type Step = 'type' | 'details' | 'fee' | 'pin' | 'receipt';

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
  const { transferFee, isLoading: feeLoading } = useTransferFee();
  
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

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
          .select('transfer_pin, balance, is_blocked')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasPin(!!data?.transfer_pin);
        setIsBlocked(data?.is_blocked || false);
        setUserBalance(data?.balance || 0);
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
    
    // Check if account is blocked
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('transfer_pin, balance, is_blocked')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (profileCheck?.transfer_pin !== pinString) {
      toast({ title: 'Error', description: 'Invalid PIN', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Check if blocked
    if (profileCheck?.is_blocked) {
      setShowBlockedModal(true);
      setIsProcessing(false);
      return;
    }

    const transferAmount = parseFloat(transferDetails.amount);
    const totalAmount = transferAmount + transferFee;
    
    // Check balance including fee
    if ((profileCheck?.balance || 0) < totalAmount) {
      toast({ title: 'Insufficient Funds', description: `You need $${totalAmount.toFixed(2)} (including $${transferFee} fee)`, variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    // Deduct from sender balance (amount + fee)
    await supabase
      .from('profiles')
      .update({ balance: (profileCheck?.balance || 0) - totalAmount })
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

    // Add fee transaction
    if (transferFee > 0) {
      await supabase.from('transaction_history').insert({
        user_id: user!.id,
        transaction_type: 'transfer_fee',
        amount: transferFee,
        description: 'Transfer fee',
        status: 'completed'
      });
    }

    if (error) {
      toast({ title: 'Error', description: 'Transfer failed', variant: 'destructive' });
    } else {
      setTransferId(transfer.id);
      setStep('receipt');
      toast({ title: 'Success', description: 'Transfer completed successfully' });
      
      // Send debit alert email
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
          currency: transferDetails.currency,
          description: transferDetails.description || `${transferType} transfer to ${transferDetails.recipientName}`,
          balance: senderProfile.balance || 0,
          transactionId: transfer.id,
          recipientName: transferDetails.recipientName,
          recipientAccount: transferDetails.recipientAccount,
        });
      }
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

    const transferAmount = parseFloat(transferDetails.amount);
    const totalAmount = transferAmount + transferFee;

    if (userBalance < totalAmount) {
      toast({ 
        title: 'Insufficient Funds', 
        description: `You need $${totalAmount.toFixed(2)} (Amount: $${transferAmount.toFixed(2)} + Fee: $${transferFee.toFixed(2)})`, 
        variant: 'destructive' 
      });
      return;
    }

    setStep('fee');
  };

  const handleConfirmFee = () => {
    if (!hasPin) {
      setIsCreatingPin(true);
    }
    setStep('pin');
  };

  if (loading || hasPin === null || feeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const transferAmount = parseFloat(transferDetails.amount) || 0;
  const totalAmount = transferAmount + transferFee;

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
        {/* Balance Display */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 mb-6 text-white text-center">
          <p className="text-sm text-white/80">Available Balance</p>
          <p className="text-2xl font-bold">${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>

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
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm overflow-y-auto"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="NZD">NZD - New Zealand Dollar</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="HKD">HKD - Hong Kong Dollar</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                    <option value="ARS">ARS - Argentine Peso</option>
                    <option value="CLP">CLP - Chilean Peso</option>
                    <option value="COP">COP - Colombian Peso</option>
                    <option value="PEN">PEN - Peruvian Sol</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="GHS">GHS - Ghanaian Cedi</option>
                    <option value="MAD">MAD - Moroccan Dirham</option>
                    <option value="TZS">TZS - Tanzanian Shilling</option>
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="XOF">XOF - CFA Franc BCEAO</option>
                    <option value="XAF">XAF - CFA Franc BEAC</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="QAR">QAR - Qatari Riyal</option>
                    <option value="KWD">KWD - Kuwaiti Dinar</option>
                    <option value="BHD">BHD - Bahraini Dinar</option>
                    <option value="OMR">OMR - Omani Rial</option>
                    <option value="JOD">JOD - Jordanian Dinar</option>
                    <option value="ILS">ILS - Israeli Shekel</option>
                    <option value="TRY">TRY - Turkish Lira</option>
                    <option value="RUB">RUB - Russian Ruble</option>
                    <option value="UAH">UAH - Ukrainian Hryvnia</option>
                    <option value="PLN">PLN - Polish Zloty</option>
                    <option value="CZK">CZK - Czech Koruna</option>
                    <option value="HUF">HUF - Hungarian Forint</option>
                    <option value="RON">RON - Romanian Leu</option>
                    <option value="BGN">BGN - Bulgarian Lev</option>
                    <option value="HRK">HRK - Croatian Kuna</option>
                    <option value="SEK">SEK - Swedish Krona</option>
                    <option value="NOK">NOK - Norwegian Krone</option>
                    <option value="DKK">DKK - Danish Krone</option>
                    <option value="ISK">ISK - Icelandic Krona</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="THB">THB - Thai Baht</option>
                    <option value="MYR">MYR - Malaysian Ringgit</option>
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="PHP">PHP - Philippine Peso</option>
                    <option value="VND">VND - Vietnamese Dong</option>
                    <option value="TWD">TWD - Taiwan Dollar</option>
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="BDT">BDT - Bangladeshi Taka</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="NPR">NPR - Nepalese Rupee</option>
                    <option value="MMK">MMK - Myanmar Kyat</option>
                    <option value="KHR">KHR - Cambodian Riel</option>
                    <option value="LAK">LAK - Lao Kip</option>
                    <option value="BND">BND - Brunei Dollar</option>
                    <option value="FJD">FJD - Fiji Dollar</option>
                    <option value="PGK">PGK - Papua New Guinea Kina</option>
                    <option value="WST">WST - Samoan Tala</option>
                    <option value="TOP">TOP - Tongan Paʻanga</option>
                    <option value="VUV">VUV - Vanuatu Vatu</option>
                    <option value="SBD">SBD - Solomon Islands Dollar</option>
                    <option value="JMD">JMD - Jamaican Dollar</option>
                    <option value="TTD">TTD - Trinidad Dollar</option>
                    <option value="BBD">BBD - Barbadian Dollar</option>
                    <option value="BSD">BSD - Bahamian Dollar</option>
                    <option value="BZD">BZD - Belize Dollar</option>
                    <option value="GTQ">GTQ - Guatemalan Quetzal</option>
                    <option value="HNL">HNL - Honduran Lempira</option>
                    <option value="NIO">NIO - Nicaraguan Córdoba</option>
                    <option value="CRC">CRC - Costa Rican Colón</option>
                    <option value="PAB">PAB - Panamanian Balboa</option>
                    <option value="DOP">DOP - Dominican Peso</option>
                    <option value="HTG">HTG - Haitian Gourde</option>
                    <option value="CUP">CUP - Cuban Peso</option>
                    <option value="AWG">AWG - Aruban Florin</option>
                    <option value="ANG">ANG - Netherlands Antillean Guilder</option>
                    <option value="SRD">SRD - Surinamese Dollar</option>
                    <option value="GYD">GYD - Guyanese Dollar</option>
                    <option value="BOB">BOB - Bolivian Boliviano</option>
                    <option value="PYG">PYG - Paraguayan Guarani</option>
                    <option value="UYU">UYU - Uruguayan Peso</option>
                    <option value="VES">VES - Venezuelan Bolívar</option>
                    <option value="IRR">IRR - Iranian Rial</option>
                    <option value="IQD">IQD - Iraqi Dinar</option>
                    <option value="SYP">SYP - Syrian Pound</option>
                    <option value="LBP">LBP - Lebanese Pound</option>
                    <option value="YER">YER - Yemeni Rial</option>
                    <option value="AFN">AFN - Afghan Afghani</option>
                    <option value="KZT">KZT - Kazakhstani Tenge</option>
                    <option value="UZS">UZS - Uzbekistani Som</option>
                    <option value="TMT">TMT - Turkmenistani Manat</option>
                    <option value="KGS">KGS - Kyrgyzstani Som</option>
                    <option value="TJS">TJS - Tajikistani Somoni</option>
                    <option value="AZN">AZN - Azerbaijani Manat</option>
                    <option value="GEL">GEL - Georgian Lari</option>
                    <option value="AMD">AMD - Armenian Dram</option>
                    <option value="BYN">BYN - Belarusian Ruble</option>
                    <option value="MDL">MDL - Moldovan Leu</option>
                    <option value="RSD">RSD - Serbian Dinar</option>
                    <option value="MKD">MKD - Macedonian Denar</option>
                    <option value="BAM">BAM - Bosnia-Herzegovina Mark</option>
                    <option value="ALL">ALL - Albanian Lek</option>
                    <option value="MNT">MNT - Mongolian Tugrik</option>
                    <option value="ETB">ETB - Ethiopian Birr</option>
                    <option value="SDG">SDG - Sudanese Pound</option>
                    <option value="LYD">LYD - Libyan Dinar</option>
                    <option value="TND">TND - Tunisian Dinar</option>
                    <option value="DZD">DZD - Algerian Dinar</option>
                    <option value="MRU">MRU - Mauritanian Ouguiya</option>
                    <option value="GMD">GMD - Gambian Dalasi</option>
                    <option value="SLL">SLL - Sierra Leonean Leone</option>
                    <option value="GNF">GNF - Guinean Franc</option>
                    <option value="LRD">LRD - Liberian Dollar</option>
                    <option value="CVE">CVE - Cape Verdean Escudo</option>
                    <option value="BWP">BWP - Botswanan Pula</option>
                    <option value="NAD">NAD - Namibian Dollar</option>
                    <option value="SZL">SZL - Swazi Lilangeni</option>
                    <option value="LSL">LSL - Lesotho Loti</option>
                    <option value="MWK">MWK - Malawian Kwacha</option>
                    <option value="ZMW">ZMW - Zambian Kwacha</option>
                    <option value="ZWL">ZWL - Zimbabwean Dollar</option>
                    <option value="MZN">MZN - Mozambican Metical</option>
                    <option value="AOA">AOA - Angolan Kwanza</option>
                    <option value="CDF">CDF - Congolese Franc</option>
                    <option value="RWF">RWF - Rwandan Franc</option>
                    <option value="BIF">BIF - Burundian Franc</option>
                    <option value="DJF">DJF - Djiboutian Franc</option>
                    <option value="ERN">ERN - Eritrean Nakfa</option>
                    <option value="SOS">SOS - Somali Shilling</option>
                    <option value="SCR">SCR - Seychellois Rupee</option>
                    <option value="MUR">MUR - Mauritian Rupee</option>
                    <option value="MVR">MVR - Maldivian Rufiyaa</option>
                    <option value="BTN">BTN - Bhutanese Ngultrum</option>
                    <option value="KPW">KPW - North Korean Won</option>
                    <option value="MOP">MOP - Macanese Pataca</option>
                    <option value="XCD">XCD - East Caribbean Dollar</option>
                    <option value="XPF">XPF - CFP Franc</option>
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

        {/* Step: Fee Confirmation */}
        {step === 'fee' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Transfer Fee</h2>
              <p className="text-muted-foreground">Review transfer details and fee</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Amount</span>
                <span className="text-foreground font-medium">${transferAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Fee</span>
                <span className="text-foreground font-medium">${transferFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-foreground font-semibold">Total Amount</span>
                  <span className="text-primary font-bold text-xl">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  A transfer fee of ${transferFee.toFixed(2)} will be charged for this transaction. This fee is non-refundable.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirmFee} className="flex-1">
                Confirm & Pay
              </Button>
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
        {step === 'receipt' && transferId && (
          <TransferReceipt
            amount={parseFloat(transferDetails.amount)}
            recipientName={transferDetails.recipientName}
            recipientAccount={transferDetails.recipientAccount}
            recipientBank={transferDetails.recipientBank}
            transferType={transferType}
            transactionId={transferId}
            date={new Date()}
            description={transferDetails.description}
            currency={transferDetails.currency}
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
