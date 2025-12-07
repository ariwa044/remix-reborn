import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import bitpayLogo from '@/assets/bitpay-logo.png';

const navLinks = [
  { name: 'Home', href: '#' },
  { name: 'About Us', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Loans & Credit', href: '#loans' },
  { name: 'Investments', href: '#investments' },
  { name: 'Contact & Support', href: '#contact' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleAuthClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src={bitpayLogo} alt="BitPay" className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  My Account
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleAuthClick}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              {user && (
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setIsOpen(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Dashboard
                </button>
              )}
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      navigate('/dashboard');
                      setIsOpen(false);
                    }}
                    className="w-fit"
                  >
                    My Account
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-fit border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleAuthClick();
                    setIsOpen(false);
                  }}
                  className="w-fit border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
