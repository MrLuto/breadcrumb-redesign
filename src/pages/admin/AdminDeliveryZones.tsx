import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeliveryZones, useDeliveryZoneMutations, DeliveryZone } from '@/hooks/useDeliveryZones';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, Truck, MapPin, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ZoneFormData {
  postcode_prefix: string;
  zone_name: string;
  delivery_cost: number;
  min_order_amount: number;
  is_active: boolean;
}

const emptyForm: ZoneFormData = {
  postcode_prefix: '',
  zone_name: '',
  delivery_cost: 7.5,
  min_order_amount: 0,
  is_active: true,
};

export default function AdminDeliveryZones() {
  const { data: zones, isLoading } = useDeliveryZones();
  const { createZone, updateZone, deleteZone } = useDeliveryZoneMutations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [deletingZone, setDeletingZone] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState<ZoneFormData>(emptyForm);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleOpenCreate = () => {
    setEditingZone(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setForm({
      postcode_prefix: zone.postcode_prefix,
      zone_name: zone.zone_name,
      delivery_cost: zone.delivery_cost,
      min_order_amount: zone.min_order_amount || 0,
      is_active: zone.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingZone) {
      await updateZone.mutateAsync({
        id: editingZone.id,
        ...form,
      });
    } else {
      await createZone.mutateAsync(form);
    }
    
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingZone) {
      await deleteZone.mutateAsync(deletingZone.id);
      setDeleteDialogOpen(false);
      setDeletingZone(null);
    }
  };

  const isSubmitting = createZone.isPending || updateZone.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" />
              Bezorgzones
            </h1>
            <p className="text-muted-foreground">
              Beheer bezorggebieden en kosten op basis van postcode
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Zone Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingZone ? 'Zone Bewerken' : 'Nieuwe Zone'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postcode_prefix">Postcode (4 cijfers)</Label>
                    <Input
                      id="postcode_prefix"
                      value={form.postcode_prefix}
                      onChange={(e) => setForm({ ...form, postcode_prefix: e.target.value.substring(0, 4) })}
                      placeholder="2800"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      disabled={!!editingZone}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zone_name">Zone Naam</Label>
                    <Input
                      id="zone_name"
                      value={form.zone_name}
                      onChange={(e) => setForm({ ...form, zone_name: e.target.value })}
                      placeholder="Gouda Centrum"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_cost">Bezorgkosten (€)</Label>
                    <Input
                      id="delivery_cost"
                      type="number"
                      step="0.50"
                      min="0"
                      value={form.delivery_cost}
                      onChange={(e) => setForm({ ...form, delivery_cost: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_order_amount">Minimale Bestelling (€)</Label>
                    <Input
                      id="min_order_amount"
                      type="number"
                      step="5"
                      min="0"
                      value={form.min_order_amount}
                      onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Zone actief</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingZone ? 'Opslaan' : 'Toevoegen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Postcodegebieden
            </CardTitle>
            <CardDescription>
              Voeg postcodes toe die binnen het bezorggebied vallen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : zones?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nog geen bezorgzones ingesteld</p>
                <p className="text-sm">Voeg zones toe om bezorging mogelijk te maken</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Postcode</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Bezorgkosten</TableHead>
                    <TableHead>Min. Bestelling</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones?.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-mono font-medium">{zone.postcode_prefix}</TableCell>
                      <TableCell>{zone.zone_name}</TableCell>
                      <TableCell>{formatPrice(zone.delivery_cost)}</TableCell>
                      <TableCell>
                        {zone.min_order_amount ? formatPrice(zone.min_order_amount) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          zone.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {zone.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(zone)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingZone(zone);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Zone Verwijderen"
        description={`Weet je zeker dat je zone "${deletingZone?.zone_name}" wilt verwijderen?`}
        isLoading={deleteZone.isPending}
      />
    </AdminLayout>
  );
}