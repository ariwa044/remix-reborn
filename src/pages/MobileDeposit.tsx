import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { ArrowLeft, Copy, Check, Building2, User, Shield, Clock, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MobileDeposit() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Generate account number from user ID (demo purposes)
  const accountNumber = '1' + user.id.replace(/-/g, '').slice(0, 9);
  const routingNumber = '021000089';
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account Holder';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={bitpayLogo} alt="Heritage Bank" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">Mobile Deposit</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Receive Deposits</h2>
          <p className="text-muted-foreground">Share your account details to receive funds</p>
        </div>

        {/* Account Details Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 rounded-lg p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heritage Bank</p>
              <p className="font-semibold text-foreground">Checking Account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Holder</p>
                    <p className="font-medium text-foreground">{fullName}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(fullName, 'Name')}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copied === 'Name' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-mono text-lg font-medium text-foreground">{accountNumber}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(accountNumber, 'Account Number')}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copied === 'Account Number' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Routing Number</p>
                  <p className="font-mono text-lg font-medium text-foreground">{routingNumber}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(routingNumber, 'Routing Number')}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copied === 'Routing Number' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <div>
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="font-medium text-foreground">Heritage Bank International</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="bg-green-500/10 rounded-lg p-2">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Secure Deposits</h3>
              <p className="text-sm text-muted-foreground">All deposits are protected by bank-level encryption</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Processing Time</h3>
              <p className="text-sm text-muted-foreground">Local transfers: 1-2 business days<br />International: 3-5 business days</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="bg-accent/10 rounded-lg p-2">
              <HelpCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Need Help?</h3>
              <p className="text-sm text-muted-foreground">Contact support@heritagebank.com for assistance</p>
            </div>
          </div>
        </div>

        <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
          Back to Dashboard
        </Button>
      </main>
    </div>
  );
}