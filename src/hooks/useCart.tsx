import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Database } from '@/integrations/supabase/types';
import type { SelectedOption } from '@/hooks/useProductOptions';

type Product = Database['public']['Tables']['products']['Row'];

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  selectedOptions?: SelectedOption[];
  // Unique key to differentiate same product with different options
  cartItemKey: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, notes?: string, selectedOptions?: SelectedOption[]) => void;
  removeItem: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => void;
  updateNotes: (cartItemKey: string, notes: string) => void;
  updateItemOptions: (oldCartItemKey: string, product: Product, quantity: number, notes?: string, selectedOptions?: SelectedOption[]) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'frisversshop-cart';

// Generate a unique key for a cart item based on product and selected options
function generateCartItemKey(productId: string, selectedOptions?: SelectedOption[]): string {
  if (!selectedOptions || selectedOptions.length === 0) {
    return productId;
  }
  const optionIds = selectedOptions
    .map(opt => opt.optionId)
    .sort()
    .join('-');
  return `${productId}:${optionIds}`;
}

// Calculate total price adjustment from selected options
function calculateOptionsPrice(selectedOptions?: SelectedOption[]): number {
  if (!selectedOptions) return 0;
  return selectedOptions.reduce((sum, opt) => sum + opt.priceAdjustment, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Migrate old cart items without cartItemKey
          return parsed.map((item: any) => ({
            ...item,
            cartItemKey: item.cartItemKey || generateCartItemKey(item.product.id, item.selectedOptions),
          }));
        }
      } catch (e) {
        console.warn('Failed to read cart from localStorage:', e);
      }
    }
    return [];
  });

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist cart to localStorage:', e);
    }
  }, [items]);

  const addItem = (product: Product, quantity = 1, notes?: string, selectedOptions?: SelectedOption[]) => {
    const cartItemKey = generateCartItemKey(product.id, selectedOptions);
    
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemKey === cartItemKey);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      
      return [...prev, { product, quantity, notes, selectedOptions, cartItemKey }];
    });
  };

  const removeItem = (cartItemKey: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemKey !== cartItemKey));
  };

  const updateQuantity = (cartItemKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemKey);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemKey === cartItemKey ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (cartItemKey: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemKey === cartItemKey ? { ...item, notes } : item
      )
    );
  };

  const updateItemOptions = (oldCartItemKey: string, product: Product, quantity: number, notes?: string, selectedOptions?: SelectedOption[]) => {
    const newCartItemKey = generateCartItemKey(product.id, selectedOptions);
    setItems((prev) => {
      // Remove old item
      const filtered = prev.filter((item) => item.cartItemKey !== oldCartItemKey);
      // Check if new key already exists (merge quantities)
      const existingIndex = filtered.findIndex((item) => item.cartItemKey === newCartItemKey);
      if (existingIndex >= 0) {
        const updated = [...filtered];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...filtered, { product, quantity, notes, selectedOptions, cartItemKey: newCartItemKey }];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => {
    const optionsPrice = calculateOptionsPrice(item.selectedOptions);
    return sum + (item.product.price + optionsPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        updateItemOptions,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Helper to get item price including options
export function getCartItemPrice(item: CartItem): number {
  const optionsPrice = calculateOptionsPrice(item.selectedOptions);
  return item.product.price + optionsPrice;
}

// Helper to format selected options for display
export function formatSelectedOptions(selectedOptions?: SelectedOption[]): string {
  if (!selectedOptions || selectedOptions.length === 0) return '';
  return selectedOptions.map(opt => opt.optionName).join(', ');
}
