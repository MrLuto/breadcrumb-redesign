import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Truck, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'frisvers_postcode';
const ORDER_URL = 'https://bestellen.frisversbroodjes.nl/';

// Delivery zones for client-side validation
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

interface PostcodeState {
  postcode: string | null;
  city: string | null;
  deliveryInfo: DeliveryInfo | null;
  isLoading: boolean;
  isChecked: boolean;
}

interface PostcodeContextType {
  state: PostcodeState;
  checkPostcode: (postcode: string) => DeliveryInfo;
  savePostcode: (postcode: string) => Promise<void>;
  clearPostcode: () => void;
  openOrderModal: () => void;
}

const PostcodeContext = createContext<PostcodeContextType | null>(null);

export const usePostcode = () => {
  const context = useContext(PostcodeContext);
  if (!context) {
    throw new Error('usePostcode must be used within PostcodeProvider');
  }
  return context;
};

const checkPostcodeLocal = (postcode: string): DeliveryInfo => {
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

interface PostcodeProviderProps {
  children: ReactNode;
}

export const PostcodeProvider = ({ children }: PostcodeProviderProps) => {
  const [state, setState] = useState<PostcodeState>({
    postcode: null,
    city: null,
    deliveryInfo: null,
    isLoading: true,
    isChecked: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Load postcode on mount
  useEffect(() => {
    const loadPostcode = async () => {
      // First check localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const deliveryInfo = checkPostcodeLocal(parsed.postcode);
          setState({
            postcode: parsed.postcode,
            city: parsed.city || null,
            deliveryInfo,
            isLoading: false,
            isChecked: true,
          });
          return;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Try geo-ip lookup
      try {
        const { data, error } = await supabase.functions.invoke('geo-ip');
        if (!error && data?.postcode) {
          const deliveryInfo = checkPostcodeLocal(data.postcode);
          setState({
            postcode: data.postcode,
            city: data.city || null,
            deliveryInfo,
            isLoading: false,
            isChecked: false, // Not confirmed by user yet
          });
          return;
        }
      } catch (err) {
        console.error('Geo IP lookup failed:', err);
      }

      setState(prev => ({ ...prev, isLoading: false }));
    };

    loadPostcode();
  }, []);

  const savePostcode = async (postcode: string) => {
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();
    const deliveryInfo = checkPostcodeLocal(cleaned);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      postcode: cleaned, 
      city: state.city 
    }));

    setState(prev => ({
      ...prev,
      postcode: cleaned,
      deliveryInfo,
      isChecked: true,
    }));

    // Save to backend (fire and forget)
    try {
      await supabase.functions.invoke('save-postcode', {
        body: { postcode: cleaned, city: state.city },
      });
    } catch (err) {
      console.error('Failed to save postcode to backend:', err);
    }
  };

  const clearPostcode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      postcode: null,
      city: null,
      deliveryInfo: null,
      isLoading: false,
      isChecked: false,
    });
  };

  const openOrderModal = () => {
    // If already checked and in area, redirect directly
    if (state.isChecked && state.deliveryInfo?.inArea) {
      window.open(ORDER_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    setModalOpen(true);
    setPendingRedirect(true);
  };

  const handleModalConfirm = () => {
    if (state.deliveryInfo?.inArea && pendingRedirect) {
      window.open(ORDER_URL, '_blank', 'noopener,noreferrer');
    }
    setModalOpen(false);
    setPendingRedirect(false);
  };

  return (
    <PostcodeContext.Provider value={{
      state,
      checkPostcode: checkPostcodeLocal,
      savePostcode,
      clearPostcode,
      openOrderModal,
    }}>
      {children}
      <PostcodeModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onConfirm={handleModalConfirm}
        pendingRedirect={pendingRedirect}
      />
    </PostcodeContext.Provider>
  );
};

// Modal component for order button clicks
interface PostcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pendingRedirect: boolean;
}

const PostcodeModal = ({ open, onOpenChange, onConfirm, pendingRedirect }: PostcodeModalProps) => {
  const { state, savePostcode, clearPostcode } = usePostcode();
  const [inputPostcode, setInputPostcode] = useState('');
  const [localResult, setLocalResult] = useState<DeliveryInfo | null>(null);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (open) {
      setInputPostcode('');
      setLocalResult(null);
      setShowInput(!state.postcode);
    }
  }, [open, state.postcode]);

  const handleCheck = () => {
    const trimmed = inputPostcode.trim().slice(0, 7);
    if (trimmed.length < 6) return;
    
    const info = checkPostcodeLocal(trimmed);
    setLocalResult(info);
    
    if (info.inArea) {
      savePostcode(trimmed);
    }
  };

  const handleConfirmSaved = () => {
    if (state.postcode) {
      savePostcode(state.postcode);
      onConfirm();
    }
  };

  const handleChange = () => {
    setShowInput(true);
    setLocalResult(null);
    clearPostcode();
  };

  const handleContinue = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Bezorggebied Controleren
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {state.isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : state.postcode && !showInput ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-foreground">
                Is uw postcode nog steeds{' '}
                <span className="font-semibold text-primary">{formatPostcode(state.postcode)}</span>
                {state.city && <span className="text-muted-foreground"> ({state.city})</span>}?
              </p>
              
              {state.deliveryInfo?.inArea ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <Check className="w-5 h-5" />
                  <span>Wij bezorgen in uw gebied!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                  <X className="w-5 h-5" />
                  <span>Helaas, wij bezorgen niet in dit gebied</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleConfirmSaved} className="flex-1">
                  <Check className="w-4 h-4 mr-1" />
                  Ja, ga door
                </Button>
                <Button onClick={handleChange} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Wijzigen
                </Button>
              </div>
            </motion.div>
          ) : localResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {localResult.inArea ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Wij bezorgen bij u!</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Bezorgtijd</p>
                      <p className="font-semibold text-foreground">{localResult.minutes} min</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Kosten</p>
                      <p className="font-semibold text-foreground">€{localResult.cost?.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Minimum</p>
                      <p className="font-semibold text-foreground">€{localResult.minimum?.toFixed(2)}</p>
                    </div>
                  </div>

                  {pendingRedirect && (
                    <Button onClick={handleContinue} className="w-full" size="lg">
                      Ga naar Bestellen
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-destructive">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Helaas, wij bezorgen niet in dit gebied</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    U kunt wel afhalen bij onze winkel in Gouda of online bestellen en laten verzenden.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setLocalResult(null)} variant="outline" className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Andere postcode
                    </Button>
                    <Button onClick={handleContinue} variant="secondary" className="flex-1">
                      Toch bestellen
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Voer uw postcode in om te controleren of wij bij u kunnen bezorgen.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="1234 AB"
                  value={inputPostcode}
                  onChange={(e) => setInputPostcode(e.target.value.slice(0, 7))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  maxLength={7}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleCheck} disabled={inputPostcode.trim().length < 6}>
                  Controleer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

// Standalone PostcodeChecker component (for homepage)
interface PostcodeCheckerProps {
  variant?: 'inline' | 'card';
}

const PostcodeChecker = ({ variant = 'card' }: PostcodeCheckerProps) => {
  const { state, savePostcode, clearPostcode, checkPostcode } = usePostcode();
  const [inputPostcode, setInputPostcode] = useState('');
  const [result, setResult] = useState<DeliveryInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (state.postcode && !state.isChecked) {
      setShowConfirm(true);
    } else if (state.isChecked && state.deliveryInfo) {
      setResult(state.deliveryInfo);
    }
  }, [state]);

  const handleCheck = () => {
    const trimmed = inputPostcode.trim().slice(0, 7);
    if (trimmed.length < 6) return;
    
    const info = checkPostcode(trimmed);
    setResult(info);
    
    if (info.inArea) {
      savePostcode(trimmed);
    }
  };

  const handleConfirmSaved = () => {
    if (state.postcode) {
      savePostcode(state.postcode);
      setResult(state.deliveryInfo);
      setShowConfirm(false);
    }
  };

  const handleChangeSaved = () => {
    setShowConfirm(false);
    setResult(null);
    clearPostcode();
  };

  const containerClass = variant === 'card' 
    ? 'bg-card rounded-2xl p-6 shadow-card border border-border'
    : '';

  if (state.isLoading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
        {showConfirm && state.postcode ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm text-foreground">
              Is uw postcode nog steeds <span className="font-semibold text-primary">{formatPostcode(state.postcode)}</span>?
            </p>
            <div className="flex gap-2">
              <Button onClick={handleConfirmSaved} size="sm" className="flex-1">
                <Check className="w-4 h-4 mr-1" />
                Ja, klopt
              </Button>
              <Button onClick={handleChangeSaved} variant="outline" size="sm" className="flex-1">
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
                    <p className="text-xs text-muted-foreground">Kosten</p>
                    <p className="font-semibold text-foreground">€{result.cost?.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Minimum</p>
                    <p className="font-semibold text-foreground">€{result.minimum?.toFixed(2)}</p>
                  </div>
                </div>

                <Button onClick={handleChangeSaved} variant="ghost" size="sm" className="w-full mt-2">
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
                  U kunt wel afhalen bij onze winkel in Gouda of online bestellen.
                </p>
                <Button onClick={handleChangeSaved} variant="outline" size="sm" className="w-full">
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
                value={inputPostcode}
                onChange={(e) => setInputPostcode(e.target.value.slice(0, 7))}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                maxLength={7}
                className="flex-1"
              />
              <Button onClick={handleCheck} disabled={inputPostcode.trim().length < 6}>
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
