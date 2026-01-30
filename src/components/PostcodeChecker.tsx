import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Truck, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useActiveDeliveryZones, getDeliveryZoneForPostcode, type DeliveryZone } from '@/hooks/useDeliveryZones';

const STORAGE_KEY = 'frisvers_postcode';
const ORDER_URL = 'https://bestellen.frisversbroodjes.nl/';

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

// Safe localStorage access wrapper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      console.warn('localStorage not available');
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage not available');
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('localStorage not available');
    }
  },
};

// Check postcode against delivery zones from DB
const checkPostcodeWithZones = (postcode: string, zones: DeliveryZone[] | undefined): DeliveryInfo => {
  if (!zones || zones.length === 0) {
    return { inArea: false };
  }
  
  const zone = getDeliveryZoneForPostcode(zones, postcode);
  if (zone) {
    return {
      inArea: true,
      minutes: 90, // Default estimate, could be added to zone table
      cost: zone.delivery_cost,
      minimum: zone.min_order_amount || 0,
    };
  }
  
  return { inArea: false };
};

interface PostcodeProviderProps {
  children: ReactNode;
}

export const PostcodeProvider = ({ children }: PostcodeProviderProps) => {
  const { data: deliveryZones, isLoading: zonesLoading } = useActiveDeliveryZones();
  const [state, setState] = useState<PostcodeState>({
    postcode: null,
    city: null,
    deliveryInfo: null,
    isLoading: true,
    isChecked: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Wrapper function to check postcode with current zones
  const checkPostcode = (postcode: string): DeliveryInfo => {
    return checkPostcodeWithZones(postcode, deliveryZones);
  };

  // Load postcode on mount via geo-ip - ALWAYS fetch fresh
  useEffect(() => {
    if (zonesLoading) return; // Wait for zones to load first

    const loadPostcode = async () => {
      // Always try geo-ip lookup first for fresh data
      try {
        const { data, error } = await supabase.functions.invoke('geo-ip');
        if (!error && data) {
          const deliveryInfo = data.postcode ? checkPostcodeWithZones(data.postcode, deliveryZones) : { inArea: false };
          
          // Save to localStorage as backup
          if (data.postcode) {
            safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify({ 
              postcode: data.postcode, 
              city: data.city 
            }));
          }
          
          setState({
            postcode: data.postcode || null,
            city: data.city || null,
            deliveryInfo,
            isLoading: false,
            isChecked: true,
          });
          return;
        }
      } catch (err) {
        console.error('Geo IP lookup failed:', err);
      }

      // Fallback to localStorage if geo-ip fails
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const deliveryInfo = checkPostcodeWithZones(parsed.postcode, deliveryZones);
          setState({
            postcode: parsed.postcode,
            city: parsed.city || null,
            deliveryInfo,
            isLoading: false,
            isChecked: true,
          });
          return;
        } catch {
          safeLocalStorage.removeItem(STORAGE_KEY);
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));
    };

    loadPostcode();
  }, [zonesLoading, deliveryZones]);

  const openOrderModal = () => {
    // If already checked and in area, redirect directly
    if (state.isChecked && state.deliveryInfo?.inArea) {
      window.open(ORDER_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    // If not in area or unknown, show modal
    setModalOpen(true);
    setPendingRedirect(true);
  };

  const handleModalConfirm = () => {
    window.open(ORDER_URL, '_blank', 'noopener,noreferrer');
    setModalOpen(false);
    setPendingRedirect(false);
  };

  const handlePostcodeUpdate = async (postcode: string, city: string | null, deliveryInfo: DeliveryInfo) => {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify({ postcode, city }));
    setState({
      postcode,
      city,
      deliveryInfo,
      isLoading: false,
      isChecked: true,
    });

    // Also save to database for analytics
    try {
      await supabase.functions.invoke('save-postcode', {
        body: { postcode, city, inDeliveryArea: deliveryInfo.inArea }
      });
    } catch (err) {
      console.error('Failed to save postcode:', err);
    }
  };

  return (
    <PostcodeContext.Provider value={{
      state,
      checkPostcode,
      openOrderModal,
    }}>
      {children}
      <PostcodeModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onConfirm={handleModalConfirm}
        onPostcodeUpdate={handlePostcodeUpdate}
        pendingRedirect={pendingRedirect}
        currentState={state}
        checkPostcode={checkPostcode}
      />
    </PostcodeContext.Provider>
  );
};

// Modal component for order button clicks
interface PostcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onPostcodeUpdate: (postcode: string, city: string | null, deliveryInfo: DeliveryInfo) => void;
  pendingRedirect: boolean;
  currentState: PostcodeState;
  checkPostcode: (postcode: string) => DeliveryInfo;
}

const PostcodeModal = ({ open, onOpenChange, onConfirm, onPostcodeUpdate, pendingRedirect, currentState, checkPostcode }: PostcodeModalProps) => {
  const [inputPostcode, setInputPostcode] = useState('');
  const [localResult, setLocalResult] = useState<DeliveryInfo | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (open) {
      setInputPostcode('');
      setLocalResult(null);
      setShowManualInput(false);
    }
  }, [open]);

  const handleCheck = () => {
    const trimmed = inputPostcode.trim();
    if (trimmed.length < 4) return;
    
    const info = checkPostcode(trimmed);
    setLocalResult(info);
    
    if (info.inArea) {
      onPostcodeUpdate(trimmed, null, info);
    }
  };

  // Show geo-ip suggestion if available and no manual check done yet
  const showGeoSuggestion = currentState.isChecked && currentState.deliveryInfo && !localResult && !showManualInput;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Bezorggebied
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {currentState.isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : showGeoSuggestion ? (
            <motion.div
              key="suggestion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {currentState.deliveryInfo?.inArea ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">Wij kunnen bij u bezorgen!</span>
                      {currentState.city && (
                        <span className="text-sm text-muted-foreground">Op basis van uw locatie ({currentState.city})</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Bezorgtijd</p>
                      <p className="font-semibold text-foreground">{currentState.deliveryInfo.minutes} min</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Kosten</p>
                      <p className="font-semibold text-foreground">€{currentState.deliveryInfo.cost?.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Minimum</p>
                      <p className="font-semibold text-foreground">€{currentState.deliveryInfo.minimum?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={onConfirm} className="w-full" size="lg">
                      Ga naar Bestellen
                    </Button>
                    <Button onClick={() => setShowManualInput(true)} variant="ghost" size="sm" className="w-full text-muted-foreground">
                      Niet correct? Voer postcode in
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">Alleen ophalen mogelijk</span>
                      {currentState.city && (
                        <span className="text-sm text-muted-foreground">Op basis van uw locatie ({currentState.city})</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    U kunt uw bestelling ook afhalen bij onze winkel in Gouda. Of controleer hieronder of wij toch bij u bezorgen.
                  </p>

                  <div className="space-y-2">
                    <Button onClick={() => setShowManualInput(true)} variant="outline" className="w-full">
                      Controleer met mijn postcode
                    </Button>
                    <Button onClick={onConfirm} variant="secondary" className="w-full">
                      Toch bestellen
                    </Button>
                  </div>
                </>
              )}
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
                    <Button onClick={onConfirm} className="w-full" size="lg">
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
                    Geen probleem! U kunt uw bestelling afhalen bij onze winkel in Gouda.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setLocalResult(null)} variant="outline" className="flex-1">
                      Andere postcode
                    </Button>
                    <Button onClick={onConfirm} variant="secondary" className="flex-1">
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
                  placeholder="1234"
                  value={inputPostcode}
                  onChange={(e) => setInputPostcode(e.target.value.slice(0, 7))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  maxLength={7}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleCheck} disabled={inputPostcode.trim().length < 4}>
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

// Delivery status banner component for homepage
export const DeliveryStatusBanner = () => {
  const { state } = usePostcode();

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/50 rounded-xl">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Bezorgmogelijkheid controleren...</span>
      </div>
    );
  }

  if (!state.isChecked || !state.deliveryInfo) {
    return null;
  }

  if (state.deliveryInfo.inArea) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
          <Check className="w-5 h-5" />
          <span className="font-semibold">
            Op basis van uw locatie{state.city ? ` (${state.city})` : ''} denken wij bij u te kunnen bezorgen!
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-green-600 dark:text-green-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Bezorgtijd: <strong>{state.deliveryInfo.minutes} min</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="w-4 h-4" />
            <span>Bezorgkosten: <strong>€{state.deliveryInfo.cost?.toFixed(2)}</strong></span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <MapPin className="w-5 h-5" />
        <span className="font-semibold">
          Alleen ophalen mogelijk{state.city ? ` (${state.city})` : ''}
        </span>
      </div>
      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
        Wij bezorgen helaas niet in uw regio. U kunt uw bestelling wel afhalen in onze winkel.
      </p>
    </motion.div>
  );
};

export default PostcodeProvider;
