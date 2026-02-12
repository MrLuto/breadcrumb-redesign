import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useProductOptionGroups, ProductOptionGroup, SelectedOption } from '@/hooks/useProductOptions';
import { useCart } from '@/hooks/useCart';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductOptionsDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductOptionsDialog({ product, open, onOpenChange }: ProductOptionsDialogProps) {
  const { data: optionGroups, isLoading } = useProductOptionGroups(product.id, product.category_id || undefined);
  const { addItem } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [added, setAdded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize default selections when dialog opens
  useEffect(() => {
    if (open && optionGroups) {
      const defaults: Record<string, string[]> = {};
      optionGroups.forEach(group => {
        const defaultOptions = group.options?.filter(opt => opt.is_default).map(opt => opt.id) || [];
        if (defaultOptions.length > 0) {
          defaults[group.id] = defaultOptions;
        }
      });
      setSelectedOptions(defaults);
      setQuantity(1);
      setAdded(false);
      setValidationErrors([]);
    }
  }, [open, optionGroups]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Handle single selection (radio)
  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: [optionId]
    }));
  };

  // Handle multi selection (checkbox)
  const handleMultiSelect = (groupId: string, optionId: string, checked: boolean, maxSelections: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (checked) {
        // Add if not exceeding max
        if (current.length < maxSelections) {
          return { ...prev, [groupId]: [...current, optionId] };
        }
        return prev;
      } else {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
    });
  };

  // Calculate total price with options
  const calculateTotalPrice = () => {
    let total = product.price;
    if (optionGroups) {
      optionGroups.forEach(group => {
        const selectedIds = selectedOptions[group.id] || [];
        group.options?.forEach(opt => {
          if (selectedIds.includes(opt.id)) {
            total += opt.price_adjustment;
          }
        });
      });
    }
    return total * quantity;
  };

  // Validate selections
  const validate = (): boolean => {
    const errors: string[] = [];
    if (optionGroups) {
      optionGroups.forEach(group => {
        const selectedCount = (selectedOptions[group.id] || []).length;
        if (group.is_required && selectedCount < group.min_selections) {
          errors.push(`${group.name}: kies minimaal ${group.min_selections}`);
        }
        if (selectedCount < group.min_selections) {
          errors.push(`${group.name}: kies minimaal ${group.min_selections}`);
        }
      });
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Build selected options array for cart
  const buildSelectedOptionsForCart = (): SelectedOption[] => {
    const result: SelectedOption[] = [];
    if (optionGroups) {
      optionGroups.forEach(group => {
        const selectedIds = selectedOptions[group.id] || [];
        group.options?.forEach(opt => {
          if (selectedIds.includes(opt.id)) {
            result.push({
              optionGroupId: group.id,
              optionGroupName: group.name,
              optionId: opt.id,
              optionName: opt.name,
              priceAdjustment: opt.price_adjustment,
            });
          }
        });
      });
    }
    return result;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    
    const cartOptions = buildSelectedOptionsForCart();
    addItem(product, quantity, undefined, cartOptions.length > 0 ? cartOptions : undefined);
    setAdded(true);
    
    setTimeout(() => {
      onOpenChange(false);
      setAdded(false);
      setQuantity(1);
    }, 1000);
  };

  const hasOptions = optionGroups && optionGroups.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <span className="block">{product.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {formatPrice(product.price)}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Laden...</div>
          ) : hasOptions ? (
            <div className="space-y-6 py-4">
              {optionGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-base font-semibold">{group.name}</Label>
                    {group.is_required && (
                      <Badge variant="secondary" className="text-xs">Verplicht</Badge>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                  )}
                  
                  {group.max_selections === 1 ? (
                    // Single selection (Radio)
                    <RadioGroup
                      value={selectedOptions[group.id]?.[0] || ''}
                      onValueChange={(value) => handleSingleSelect(group.id, value)}
                    >
                      <div className="space-y-2">
                        {group.options?.map((option) => (
                          <div 
                            key={option.id} 
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                              {option.name}
                            </Label>
                            {option.price_adjustment !== 0 && (
                              <span className="text-sm text-muted-foreground">
                                {option.price_adjustment > 0 ? '+' : ''}{formatPrice(option.price_adjustment)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    // Multi selection (Checkbox)
                    <div className="space-y-2">
                      {group.options?.map((option) => {
                        const isSelected = selectedOptions[group.id]?.includes(option.id) || false;
                        const currentCount = (selectedOptions[group.id] || []).length;
                        const isDisabled = !isSelected && currentCount >= group.max_selections;
                        
                        return (
                          <div 
                            key={option.id} 
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              isDisabled ? 'opacity-50' : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              id={option.id}
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => 
                                handleMultiSelect(group.id, option.id, !!checked, group.max_selections)
                              }
                            />
                            <Label 
                              htmlFor={option.id} 
                              className={`flex-1 ${isDisabled ? '' : 'cursor-pointer'}`}
                            >
                              {option.name}
                            </Label>
                            {option.price_adjustment !== 0 && (
                              <span className="text-sm text-muted-foreground">
                                {option.price_adjustment > 0 ? '+' : ''}{formatPrice(option.price_adjustment)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-xs text-muted-foreground mt-1">
                        Max. {group.max_selections} keuzes
                      </p>
                    </div>
                  )}
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4">
              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}
            </div>
          )}
        </ScrollArea>

        {validationErrors.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              {validationErrors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          {/* Quantity selector */}
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">Aantal</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={added}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-9 w-14 text-center border-0 rounded-none"
                disabled={added}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setQuantity(quantity + 1)}
                disabled={added}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to cart button */}
          <Button
            onClick={handleAddToCart}
            disabled={added}
            className="w-full"
            size="lg"
            variant={added ? 'secondary' : 'default'}
          >
            {added ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Toegevoegd!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Toevoegen · {formatPrice(calculateTotalPrice())}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
