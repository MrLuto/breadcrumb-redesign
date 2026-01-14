import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin, User, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/cart/CartSheet';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Assortiment', path: '/assortiment' },
  { name: 'Over Ons', path: '/over-ons' },
  { name: 'Contact', path: '/contact' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container flex items-center justify-between py-2 text-sm">
          <div className="hidden md:flex items-center gap-6">
            <a href="mailto:info@frisversshop.nl" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              info@frisversshop.nl
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Willem en Marialaan 46, Gouda
            </span>
            <a href="tel:0182524926" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              0182 - 524 926
            </a>
          </div>
          <a 
            href="tel:0182524926" 
            className="md:hidden flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4" />
            0182 - 524 926
          </a>
          {/* Account link in top bar */}
          <div className="hidden md:block">
            {!isLoading && (
              user ? (
                <Link 
                  to="/profiel" 
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mijn Account
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Inloggen
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-card/95 backdrop-blur-md border-b border-border shadow-warm">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="FrisVersshop Gouda" 
              className="h-14 md:h-16 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <CartSheet />
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-card border-t border-border overflow-hidden"
            >
              <div className="container py-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-medium py-2 transition-colors hover:text-primary ${
                      location.pathname === link.path
                        ? 'text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {/* Mobile account link */}
                {!isLoading && (
                  user ? (
                    <Link
                      to="/profiel"
                      onClick={() => setIsMenuOpen(false)}
                      className="font-medium py-2 flex items-center gap-2 transition-colors hover:text-primary"
                    >
                      <User className="w-4 h-4" />
                      Mijn Account
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="font-medium py-2 flex items-center gap-2 transition-colors hover:text-primary"
                    >
                      <LogIn className="w-4 h-4" />
                      Inloggen
                    </Link>
                  )
                )}
                
                <div className="mt-4" onClick={() => setIsMenuOpen(false)}>
                  <CartSheet />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
