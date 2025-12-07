import bitpayLogo from '@/assets/bitpay-logo.png';

export const Footer = () => {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={bitpayLogo} alt="BitPay" className="h-8 w-auto" />
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2024 BITPAY INC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
