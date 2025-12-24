import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Truck, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'frisvers_postcode';

// Delivery zones: [startNumeric, endNumeric, deliveryMinutes]
const deliveryZones = [
  { start: 2741, end: 2743, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2800, end: 2811, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2820, end: 2821, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2830, end: 2831, minutes: 90, cost: 4.00, minimum: 20.00 },
  { start: 2840, end: 2841, minutes: 120, cost: 4.00, minimum: 20.00 },
  { start: 2850, end: 2851, minutes: 120, cost: 4.00, minimum: 20.00 },
];

interface DeliveryInfo {
  inArea: boolean;
  minutes?: number;
  cost?: number;
  minimum?: number;
}

const checkPostcode = (postcode: string): DeliveryInfo => {
  // Clean and validate postcode (Dutch format: 1234AB)
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^(\d{4})([A-Z]{2})$/);
  
  if (!match) {
    return { inArea: false };
  }
  
  const numericPart = parseInt(match[1], 10);
  
  for (const zone of deliveryZones) {
    if (numericPart >= zone.start && numericPart <= zone.end) {
      return {
        inArea: true,
        minutes: zone.minutes,
        cost: zone.cost,
        minimum: zone.minimum,
      };
    }
  }
  
  return { inArea: false };
};

const formatPostcode = (postcode: string): string => {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return cleaned;
};

interface PostcodeCheckerProps {
  variant?: 'inline' | 'card';
}

const PostcodeChecker = ({ variant = 'card' }: PostcodeCheckerProps) => {
  const [postcode, setPostcode] = useState('');
  const [savedPostcode, setSavedPostcode] = useState<string | null>(null);
  const [result, setResult] = useState<DeliveryInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSavedPostcode(stored);
      setShowConfirm(true);
    }
  }, []);

  const handleCheck = () => {
    const trimmed = postcode.trim().slice(0, 7);
    if (trimmed.length < 6) return;
    
    const info = checkPostcode(trimmed);
    setResult(info);
    
    if (info.inArea) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setSavedPostcode(trimmed);
    }
  };

  const handleConfirmSaved = () => {
    if (savedPostcode) {
      const info = checkPostcode(savedPostcode);
      setResult(info);
      setShowConfirm(false);
    }
  };

  const handleChangeSaved = () => {
    setShowConfirm(false);
    setSavedPostcode(null);
    setResult(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  const containerClass = variant === 'card' 
    ? 'bg-card rounded-2xl p-6 shadow-card border border-border'
    : '';

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Bezorggebied Check</h3>
          <p className="text-sm text-muted-foreground">Controleer of wij bij u bezorgen</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showConfirm && savedPostcode ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm text-foreground">
              Is uw postcode nog steeds <span className="font-semibold text-primary">{formatPostcode(savedPostcode)}</span>?
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmSaved}
                size="sm"
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                Ja, klopt
              </Button>
              <Button 
                onClick={handleChangeSaved}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Wijzigen
              </Button>
            </div>
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {result.inArea ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Wij bezorgen bij u!</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Bezorgtijd</p>
                    <p className="font-semibold text-foreground">{result.minutes} min</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Bezorgkosten</p>
                    <p className="font-semibold text-foreground">€{result.cost?.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Minimum</p>
                    <p className="font-semibold text-foreground">€{result.minimum?.toFixed(2)}</p>
                  </div>
                </div>

                <Button 
                  onClick={handleChangeSaved}
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Andere postcode checken
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Helaas, wij bezorgen niet in dit gebied</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  U kunt wel afhalen bij onze winkel in Gouda of online bestellen voor verzending.
                </p>
                <Button 
                  onClick={() => setResult(null)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Andere postcode proberen
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <Input
                placeholder="1234 AB"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.slice(0, 7))}
                onKeyDown={handleKeyDown}
                maxLength={7}
                className="flex-1"
              />
              <Button onClick={handleCheck} disabled={postcode.trim().length < 6}>
                Controleer
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Voer uw postcode in om te zien of wij bij u bezorgen
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostcodeChecker;
