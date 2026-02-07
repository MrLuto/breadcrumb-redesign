import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { 
  useAllOptionGroups, 
  useOptionGroupMutations, 
  useOptionMutations,
  ProductOptionGroup,
  ProductOption 
} from '@/hooks/useProductOptions';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Pencil, Trash2, Settings, Loader2, Package, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OptionGroupFormData {
  product_id: string | null;
  category_id: string | null;
  scope_type: 'product' | 'category';
  scope_id: string;
  name: string;
  description: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  display_order: number;
  is_active: boolean;
}

interface OptionFormData {
  option_group_id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
}

const emptyGroupForm: OptionGroupFormData = {
  product_id: null,
  category_id: null,
  scope_type: 'product',
  scope_id: '',
  name: '',
  description: '',
  is_required: false,
  min_selections: 0,
  max_selections: 1,
  display_order: 0,
  is_active: true,
};

const emptyOptionForm: OptionFormData = {
  option_group_id: '',
  name: '',
  price_adjustment: 0,
  is_default: false,
  is_available: true,
  display_order: 0,
};

export default function AdminProductOptions() {
  const navigate = useNavigate();
  const { data: optionGroups, isLoading } = useAllOptionGroups();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { createOptionGroup, updateOptionGroup, deleteOptionGroup } = useOptionGroupMutations();
  const { createOption, updateOption, deleteOption } = useOptionMutations();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  
  const [editingGroup, setEditingGroup] = useState<ProductOptionGroup | null>(null);
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ProductOptionGroup | null>(null);
  const [deletingOption, setDeletingOption] = useState<ProductOption | null>(null);
  
  const [groupForm, setGroupForm] = useState<OptionGroupFormData>(emptyGroupForm);
  const [optionForm, setOptionForm] = useState<OptionFormData>(emptyOptionForm);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Group handling
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm(emptyGroupForm);
    setGroupDialogOpen(true);
  };

  const handleOpenEditGroup = (group: ProductOptionGroup) => {
    setEditingGroup(group);
    setGroupForm({
      product_id: group.product_id,
      category_id: group.category_id,
      scope_type: group.product_id ? 'product' : 'category',
      scope_id: group.product_id || group.category_id || '',
      name: group.name,
      description: group.description || '',
      is_required: group.is_required,
      min_selections: group.min_selections,
      max_selections: group.max_selections,
      display_order: group.display_order,
      is_active: group.is_active,
    });
    setGroupDialogOpen(true);
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      product_id: groupForm.scope_type === 'product' ? groupForm.scope_id : null,
      category_id: groupForm.scope_type === 'category' ? groupForm.scope_id : null,
      name: groupForm.name,
      description: groupForm.description || null,
      is_required: groupForm.is_required,
      min_selections: groupForm.min_selections,
      max_selections: groupForm.max_selections,
      display_order: groupForm.display_order,
      is_active: groupForm.is_active,
    };

    if (editingGroup) {
      await updateOptionGroup.mutateAsync({ id: editingGroup.id, ...payload });
    } else {
      await createOptionGroup.mutateAsync(payload);
    }
    
    setGroupDialogOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (deletingGroup) {
      await deleteOptionGroup.mutateAsync(deletingGroup.id);
      setDeleteGroupDialogOpen(false);
      setDeletingGroup(null);
    }
  };

  // Option handling
  const handleOpenCreateOption = (groupId: string) => {
    setEditingOption(null);
    setOptionForm({ ...emptyOptionForm, option_group_id: groupId });
    setOptionDialogOpen(true);
  };

  const handleOpenEditOption = (option: ProductOption) => {
    setEditingOption(option);
    setOptionForm({
      option_group_id: option.option_group_id,
      name: option.name,
      price_adjustment: option.price_adjustment,
      is_default: option.is_default,
      is_available: option.is_available,
      display_order: option.display_order,
    });
    setOptionDialogOpen(true);
  };

  const handleSubmitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingOption) {
      await updateOption.mutateAsync({ id: editingOption.id, ...optionForm });
    } else {
      await createOption.mutateAsync(optionForm);
    }
    
    setOptionDialogOpen(false);
  };

  const handleDeleteOption = async () => {
    if (deletingOption) {
      await deleteOption.mutateAsync(deletingOption.id);
      setDeleteOptionDialogOpen(false);
      setDeletingOption(null);
    }
  };

  const isGroupSubmitting = createOptionGroup.isPending || updateOptionGroup.isPending;
  const isOptionSubmitting = createOption.isPending || updateOption.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assortiment</h1>
          <p className="text-muted-foreground mt-1">
            Beheer categorieën en producten.
          </p>
        </div>

        <Tabs value="options" className="space-y-6">
          <TabsList>
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2"
              onClick={() => navigate('/admin/catalog')}
            >
              <Package className="h-4 w-4" />
              Producten
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-2"
              onClick={() => navigate('/admin/catalog?tab=categories')}
            >
              <FolderOpen className="h-4 w-4" />
              Categorieën
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Product Opties
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Product Opties
            </h2>
            <p className="text-muted-foreground">
              Beheer optiegroepen (broodsoort, beleg, etc.) en individuele opties
            </p>
          </div>
          
          <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateGroup}>
                <Plus className="h-4 w-4 mr-2" />
                Optiegroep Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? 'Optiegroep Bewerken' : 'Nieuwe Optiegroep'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitGroup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Toepassen op</Label>
                    <Select
                      value={groupForm.scope_type}
                      onValueChange={(value: 'product' | 'category') => 
                        setGroupForm({ ...groupForm, scope_type: value, scope_id: '' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Specifiek product</SelectItem>
                        <SelectItem value="category">Hele categorie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{groupForm.scope_type === 'product' ? 'Product' : 'Categorie'}</Label>
                    <Select
                      value={groupForm.scope_id}
                      onValueChange={(value) => setGroupForm({ ...groupForm, scope_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupForm.scope_type === 'product' 
                          ? products?.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))
                          : categories?.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-name">Naam *</Label>
                  <Input
                    id="group-name"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="Bijv. Broodsoort, Extra beleg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-description">Beschrijving</Label>
                  <Textarea
                    id="group-description"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    placeholder="Optionele toelichting voor klanten"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-selections">Min. keuzes</Label>
                    <Input
                      id="min-selections"
                      type="number"
                      min="0"
                      value={groupForm.min_selections}
                      onChange={(e) => setGroupForm({ ...groupForm, min_selections: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-selections">Max. keuzes</Label>
                    <Input
                      id="max-selections"
                      type="number"
                      min="1"
                      value={groupForm.max_selections}
                      onChange={(e) => setGroupForm({ ...groupForm, max_selections: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-order">Volgorde</Label>
                    <Input
                      id="display-order"
                      type="number"
                      value={groupForm.display_order}
                      onChange={(e) => setGroupForm({ ...groupForm, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is-required"
                      checked={groupForm.is_required}
                      onCheckedChange={(checked) => setGroupForm({ ...groupForm, is_required: checked })}
                    />
                    <Label htmlFor="is-required">Verplicht</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is-active"
                      checked={groupForm.is_active}
                      onCheckedChange={(checked) => setGroupForm({ ...groupForm, is_active: checked })}
                    />
                    <Label htmlFor="is-active">Actief</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={isGroupSubmitting || !groupForm.scope_id}>
                    {isGroupSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingGroup ? 'Opslaan' : 'Toevoegen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Option Groups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Optiegroepen
            </CardTitle>
            <CardDescription>
              Klik op een groep om de opties te bekijken en bewerken
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : optionGroups?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nog geen optiegroepen. Maak er een aan om te beginnen.
              </p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {optionGroups?.map((group) => (
                  <AccordionItem key={group.id} value={group.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div>
                          <span className="font-semibold">{group.name}</span>
                          {group.is_required && (
                            <Badge variant="secondary" className="ml-2">Verplicht</Badge>
                          )}
                          {!group.is_active && (
                            <Badge variant="outline" className="ml-2">Inactief</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {group.product?.name || group.category?.name}
                        </span>
                        <span className="text-sm text-muted-foreground ml-auto mr-4">
                          {group.options?.length || 0} opties
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleOpenEditGroup(group)}>
                            <Pencil className="h-3 w-3 mr-1" />
                            Bewerken
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenCreateOption(group.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Optie Toevoegen
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setDeletingGroup(group);
                              setDeleteGroupDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Verwijderen
                          </Button>
                        </div>

                        {group.options && group.options.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Optie</TableHead>
                                <TableHead>Meerprijs</TableHead>
                                <TableHead>Standaard</TableHead>
                                <TableHead>Beschikbaar</TableHead>
                                <TableHead className="w-[100px]">Acties</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.options.map((option) => (
                                <TableRow key={option.id}>
                                  <TableCell className="font-medium">{option.name}</TableCell>
                                  <TableCell>
                                    {option.price_adjustment > 0 
                                      ? `+ ${formatPrice(option.price_adjustment)}`
                                      : option.price_adjustment < 0
                                      ? formatPrice(option.price_adjustment)
                                      : '-'
                                    }
                                  </TableCell>
                                  <TableCell>
                                    {option.is_default && <Badge>Ja</Badge>}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={option.is_available ? 'default' : 'secondary'}>
                                      {option.is_available ? 'Ja' : 'Nee'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleOpenEditOption(option)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          setDeletingOption(option);
                                          setDeleteOptionDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4">
                            Nog geen opties in deze groep.
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Option Dialog */}
        <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingOption ? 'Optie Bewerken' : 'Nieuwe Optie'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitOption} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="option-name">Naam *</Label>
                <Input
                  id="option-name"
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                  placeholder="Bijv. Volkoren, Extra kaas"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-adjustment">Meerprijs (€)</Label>
                  <Input
                    id="price-adjustment"
                    type="number"
                    step="0.10"
                    value={optionForm.price_adjustment}
                    onChange={(e) => setOptionForm({ ...optionForm, price_adjustment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option-order">Volgorde</Label>
                  <Input
                    id="option-order"
                    type="number"
                    value={optionForm.display_order}
                    onChange={(e) => setOptionForm({ ...optionForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="option-default"
                    checked={optionForm.is_default}
                    onCheckedChange={(checked) => setOptionForm({ ...optionForm, is_default: checked })}
                  />
                  <Label htmlFor="option-default">Standaard geselecteerd</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="option-available"
                    checked={optionForm.is_available}
                    onCheckedChange={(checked) => setOptionForm({ ...optionForm, is_available: checked })}
                  />
                  <Label htmlFor="option-available">Beschikbaar</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOptionDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isOptionSubmitting}>
                  {isOptionSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingOption ? 'Opslaan' : 'Toevoegen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialogs */}
        <DeleteConfirmDialog
          open={deleteGroupDialogOpen}
          onOpenChange={setDeleteGroupDialogOpen}
          onConfirm={handleDeleteGroup}
          title="Optiegroep verwijderen"
          description={`Weet je zeker dat je "${deletingGroup?.name}" wilt verwijderen? Alle bijbehorende opties worden ook verwijderd.`}
        />

        <DeleteConfirmDialog
          open={deleteOptionDialogOpen}
          onOpenChange={setDeleteOptionDialogOpen}
          onConfirm={handleDeleteOption}
          title="Optie verwijderen"
          description={`Weet je zeker dat je "${deletingOption?.name}" wilt verwijderen?`}
        />
      </div>
    </AdminLayout>
  );
}
