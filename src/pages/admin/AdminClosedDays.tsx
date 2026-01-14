import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, CalendarX, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  useClosedDays,
  useClosedDaysMutations,
  ClosedDay,
  getDayName,
} from '@/hooks/useClosedDays';
import { ClosedDayDialog } from '@/components/admin/ClosedDayDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';

export default function AdminClosedDays() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClosedDay, setSelectedClosedDay] = useState<ClosedDay | null>(null);

  const { data: closedDays, isLoading } = useClosedDays();
  const { createClosedDay, updateClosedDay, deleteClosedDay } = useClosedDaysMutations();

  const handleCreate = () => {
    setSelectedClosedDay(null);
    setDialogOpen(true);
  };

  const handleEdit = (closedDay: ClosedDay) => {
    setSelectedClosedDay(closedDay);
    setDialogOpen(true);
  };

  const handleDelete = (closedDay: ClosedDay) => {
    setSelectedClosedDay(closedDay);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedClosedDay) {
      deleteClosedDay.mutate(selectedClosedDay.id);
      setDeleteDialogOpen(false);
      setSelectedClosedDay(null);
    }
  };

  const handleSave = (data: Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedClosedDay) {
      updateClosedDay.mutate({ id: selectedClosedDay.id, ...data });
    } else {
      createClosedDay.mutate(data);
    }
  };

  const handleToggleActive = (closedDay: ClosedDay) => {
    updateClosedDay.mutate({
      id: closedDay.id,
      is_active: !closedDay.is_active,
    });
  };

  // Separate recurring and one-time closed days
  const recurringDays = closedDays?.filter((d) => d.is_recurring) || [];
  const oneTimeDays = closedDays?.filter((d) => !d.is_recurring) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gesloten Dagen</h1>
            <p className="text-muted-foreground">
              Beheer wanneer de winkel gesloten is
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Toevoegen
          </Button>
        </div>

        {/* Recurring Days */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Terugkerende sluitingsdagen
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dag</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Actief</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : recurringDays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Geen terugkerende sluitingsdagen ingesteld
                    </TableCell>
                  </TableRow>
                ) : (
                  recurringDays.map((closedDay) => (
                    <TableRow key={closedDay.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          {getDayName(closedDay.day_of_week!)}
                        </Badge>
                      </TableCell>
                      <TableCell>{closedDay.reason}</TableCell>
                      <TableCell>
                        <Switch
                          checked={closedDay.is_active}
                          onCheckedChange={() => handleToggleActive(closedDay)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(closedDay)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(closedDay)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* One-time Closed Days */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarX className="h-5 w-5" />
            Eenmalige sluitingsdagen
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Actief</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Laden...
                    </TableCell>
                  </TableRow>
                ) : oneTimeDays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Geen eenmalige sluitingsdagen ingesteld
                    </TableCell>
                  </TableRow>
                ) : (
                  oneTimeDays.map((closedDay) => (
                    <TableRow key={closedDay.id}>
                      <TableCell className="font-medium">
                        {closedDay.date && format(new Date(closedDay.date), 'PPPP', { locale: nl })}
                      </TableCell>
                      <TableCell>{closedDay.reason}</TableCell>
                      <TableCell>
                        <Switch
                          checked={closedDay.is_active}
                          onCheckedChange={() => handleToggleActive(closedDay)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(closedDay)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(closedDay)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dialogs */}
        <ClosedDayDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          closedDay={selectedClosedDay}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Gesloten dag verwijderen"
          description="Weet je zeker dat je deze gesloten dag wilt verwijderen?"
        />
      </div>
    </AdminLayout>
  );
}
