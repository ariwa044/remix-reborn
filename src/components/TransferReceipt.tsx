import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import bitpayLogo from '@/assets/bitpay-logo.png';
import { format } from 'date-fns';

interface TransferReceiptProps {
  amount: number;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  transferType: string;
  transactionId: string;
  date: Date;
  description?: string;
  currency?: string;
  onClose: () => void;
}

export const TransferReceipt = ({
  amount,
  recipientName,
  recipientAccount,
  recipientBank,
  transferType,
  transactionId,
  date,
  description,
  currency = 'USD',
  onClose
}: TransferReceiptProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden print:border-2 print:border-black">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="opacity-[0.03] rotate-[-30deg] scale-150">
            <img src={bitpayLogo} alt="Watermark" className="w-96 h-96 object-contain" />
          </div>
        </div>

        <div className="relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-6">
            <img src={bitpayLogo} alt="Bitpay" className="h-12 mx-auto mb-4" />
            <div className="bg-green-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Transfer Successful</h2>
            <p className="text-muted-foreground">Your transfer has been completed</p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3 border-t border-b border-border py-4 my-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs text-foreground">{transactionId.slice(0, 12).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-foreground">{format(date, 'MMM dd, yyyy HH:mm')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer Type</span>
              <span className="text-foreground capitalize">{transferType.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient Name</span>
              <span className="text-foreground font-medium">{recipientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Account Number</span>
              <span className="text-foreground font-mono">{recipientAccount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bank</span>
              <span className="text-foreground">{recipientBank}</span>
            </div>
            {description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span className="text-foreground">{description}</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-primary/10 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount Transferred</p>
            <p className="text-3xl font-bold text-primary">
              {currency === 'USD' ? '$' : currency}{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Bitpay &copy; {new Date().getFullYear()} | Secure Banking
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This is an official transaction receipt
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          Print Receipt
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
