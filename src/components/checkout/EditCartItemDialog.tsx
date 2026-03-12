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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, AlertCircle } from 'lucide-react';
import { useProductOptionGroups, SelectedOption } from '@/hooks/useProductOptions';
import { CartItem, useCart, getCartItemPrice } from '@/hooks/useCart';

interface EditCartItemDialogProps {
  item: CartItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCartItemDialog({ item, open, onOpenChange }: EditCartItemDialogProps) {
  const { data: optionGroups, isLoading } = useProductOptionGroups(
    item?.product.id,
    item?.product.category_id || undefined
  );
  const { updateItemOptions } = useCart();

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);

  // Initialize selections from current cart item
  useEffect(() => {
    if (open && item && optionGroups) {
      const current: Record<string, string[]> = {};
      if (item.selectedOptions) {
        item.selectedOptions.forEach(opt => {
          if (!current[opt.optionGroupId]) current[opt.optionGroupId] = [];
          current[opt.optionGroupId].push(opt.optionId);
        });
      }
      setSelectedOptions(current);
      setSaved(false);
      setValidationErrors([]);
    }
  }, [open, item, optionGroups]);

  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [groupId]: [optionId] }));
  };

  const handleMultiSelect = (groupId: string, optionId: string, checked: boolean, maxSelections: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (checked) {
        if (current.length < maxSelections) {
          return { ...prev, [groupId]: [...current, optionId] };
        }
        return prev;
      }
      return { ...prev, [groupId]: current.filter(id => id !== optionId) };
    });
  };

  const validate = (): boolean => {
    const errors: string[] = [];
    if (optionGroups) {
      optionGroups.forEach(group => {
        const selectedCount = (selectedOptions[group.id] || []).length;
        if (group.is_required && selectedCount < group.min_selections) {
          errors.push(`${group.name}: kies minimaal ${group.min_selections}`);
        }
      });
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const buildSelectedOptions = (): SelectedOption[] => {
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

  const handleSave = () => {
    if (!item || !validate()) return;
    const newOptions = buildSelectedOptions();
    updateItemOptions(
      item.cartItemKey,
      item.product,
      item.quantity,
      item.notes,
      newOptions.length > 0 ? newOptions : undefined
    );
    setSaved(true);
    setTimeout(() => {
      onOpenChange(false);
      setSaved(false);
    }, 600);
  };

  if (!item) return null;

  const hasOptions = optionGroups && optionGroups.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {item.product.image_url && (
              <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <span className="block">{item.product.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {formatPrice(item.product.price)} · {item.quantity}×
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Laden...</div>
          ) : hasOptions ? (
            <div className="space-y-6 py-4">
              {optionGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-base font-semibold">{group.name}</Label>
                    {group.is_required && <Badge variant="secondary" className="text-xs">Verplicht</Badge>}
                  </div>
                  {group.description && <p className="text-sm text-muted-foreground mb-3">{group.description}</p>}

                  {group.max_selections === 1 ? (
                    <RadioGroup
                      value={selectedOptions[group.id]?.[0] || ''}
                      onValueChange={(value) => handleSingleSelect(group.id, value)}
                    >
                      <div className="space-y-2">
                        {group.options?.map((option) => (
                          <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={option.id} id={`edit-${option.id}`} />
                            <Label htmlFor={`edit-${option.id}`} className="flex-1 cursor-pointer">{option.name}</Label>
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
                    <div className="space-y-2">
                      {group.options?.map((option) => {
                        const isSelected = selectedOptions[group.id]?.includes(option.id) || false;
                        const currentCount = (selectedOptions[group.id] || []).length;
                        const isDisabled = !isSelected && currentCount >= group.max_selections;
                        return (
                          <div key={option.id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${isDisabled ? 'opacity-50' : 'hover:bg-muted/50'}`}>
                            <Checkbox
                              id={`edit-${option.id}`}
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => handleMultiSelect(group.id, option.id, !!checked, group.max_selections)}
                            />
                            <Label htmlFor={`edit-${option.id}`} className={`flex-1 ${isDisabled ? '' : 'cursor-pointer'}`}>{option.name}</Label>
                            {option.price_adjustment !== 0 && (
                              <span className="text-sm text-muted-foreground">
                                {option.price_adjustment > 0 ? '+' : ''}{formatPrice(option.price_adjustment)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-xs text-muted-foreground mt-1">Max. {group.max_selections} keuzes</p>
                    </div>
                  )}
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-muted-foreground text-sm">Geen opties beschikbaar voor dit product.</div>
          )}
        </ScrollArea>

        {validationErrors.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>{validationErrors.map((error, i) => <div key={i}>{error}</div>)}</div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave} disabled={saved} className="w-full" size="lg" variant={saved ? 'secondary' : 'default'}>
            {saved ? <><Check className="h-4 w-4 mr-2" />Opgeslagen!</> : 'Opties opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
