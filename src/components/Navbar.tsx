import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Send, Download, TrendingUp, CreditCard, Settings, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import bitpayLogo from '@/assets/bitpay-logo.png';

const navLinks = [
  { name: 'Home', href: '#' },
  { name: 'About Us', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Loans & Credit', href: '#loans' },
  { name: 'Investments', href: '#investments' },
  { name: 'Contact & Support', href: '#contact' },
];

const dashboardLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Transfer', href: '/transfer', icon: Send },
  { name: 'Deposit', href: '/deposit', icon: Download },
  { name: 'Crypto', href: '/crypto', icon: TrendingUp },
  { name: 'ATM Card', href: '/atm-card', icon: CreditCard },
  { name: 'Profile', href: '/profile', icon: User },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

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
    setIsOpen(false);
  };

  const isInDashboard = location.pathname.startsWith('/dashboard') || 
                        location.pathname.startsWith('/transfer') || 
                        location.pathname.startsWith('/deposit') || 
                        location.pathname.startsWith('/crypto') || 
                        location.pathname.startsWith('/atm-card') || 
                        location.pathname.startsWith('/profile') ||
                        location.pathname.startsWith('/admin') ||
                        location.pathname.startsWith('/send');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img 
              src={bitpayLogo} 
              alt="BitPay" 
              className="h-8 w-auto cursor-pointer" 
              onClick={() => navigate(user ? '/dashboard' : '/')}
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {!isInDashboard ? (
              <>
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
              </>
            ) : (
              <>
                {dashboardLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.href)}
                    className={`text-sm transition-colors flex items-center gap-2 ${
                      location.pathname === link.href 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.name}
                  </button>
                ))}
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className={`text-sm transition-colors flex items-center gap-2 ${
                      location.pathname === '/admin' 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </button>
                )}
              </>
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
          <div className="lg:hidden py-4 border-t border-border bg-background">
            <div className="flex flex-col gap-2">
              {user && isInDashboard ? (
                <>
                  {dashboardLinks.map((link) => (
                    <button
                      key={link.name}
                      onClick={() => {
                        navigate(link.href);
                        setIsOpen(false);
                      }}
                      className={`text-sm transition-colors flex items-center gap-3 px-4 py-3 rounded-lg ${
                        location.pathname === link.href 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.name}
                    </button>
                  ))}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setIsOpen(false);
                      }}
                      className={`text-sm transition-colors flex items-center gap-3 px-4 py-3 rounded-lg ${
                        location.pathname === '/admin' 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                      Admin
                    </button>
                  )}
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-500 hover:text-red-600 flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-3"
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
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left px-4 py-3"
                    >
                      Dashboard
                    </button>
                  )}
                  <div className="border-t border-border my-2" />
                  {user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          navigate('/dashboard');
                          setIsOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        My Account
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleSignOut}
                        className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
                      className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Login
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};