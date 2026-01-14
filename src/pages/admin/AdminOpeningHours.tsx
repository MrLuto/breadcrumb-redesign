import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOpeningHours, useUpdateOpeningHour, getDayName } from '@/hooks/useOpeningHours';
import {
  useClosedDays,
  useClosedDaysMutations,
  ClosedDay,
  getDayName as getClosedDayName,
} from '@/hooks/useClosedDays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Clock, Save, Plus, Pencil, Trash2, CalendarX, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ClosedDayDialog } from '@/components/admin/ClosedDayDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';

interface EditState {
  [id: string]: {
    open_time: string;
    close_time: string;
    is_closed: boolean;
  };
}

const AdminOpeningHours = () => {
  // Opening hours state
  const { data: openingHours, isLoading: loadingHours } = useOpeningHours();
  const updateMutation = useUpdateOpeningHour();
  const [editState, setEditState] = useState<EditState>({});

  // Closed days state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClosedDay, setSelectedClosedDay] = useState<ClosedDay | null>(null);
  const { data: closedDays, isLoading: loadingClosedDays } = useClosedDays();
  const { createClosedDay, updateClosedDay, deleteClosedDay } = useClosedDaysMutations();

  // Opening hours handlers
  const getEditValue = (id: string, field: 'open_time' | 'close_time' | 'is_closed', original: any) => {
    if (editState[id] && field in editState[id]) {
      return editState[id][field];
    }
    return original;
  };

  const handleChange = (id: string, field: 'open_time' | 'close_time' | 'is_closed', value: any, original: any) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        open_time: prev[id]?.open_time ?? original.open_time,
        close_time: prev[id]?.close_time ?? original.close_time,
        is_closed: prev[id]?.is_closed ?? original.is_closed,
        [field]: value,
      },
    }));
  };

  const handleSaveHour = async (id: string, original: any) => {
    const edited = editState[id];
    if (!edited) return;

    await updateMutation.mutateAsync({
      id,
      open_time: edited.open_time ?? original.open_time,
      close_time: edited.close_time ?? original.close_time,
      is_closed: edited.is_closed ?? original.is_closed,
    });

    setEditState((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const hasChanges = (id: string) => {
    return !!editState[id];
  };

  // Closed days handlers
  const handleCreateClosedDay = () => {
    setSelectedClosedDay(null);
    setDialogOpen(true);
  };

  const handleEditClosedDay = (closedDay: ClosedDay) => {
    setSelectedClosedDay(closedDay);
    setDialogOpen(true);
  };

  const handleDeleteClosedDay = (closedDay: ClosedDay) => {
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

  const handleSaveClosedDay = (data: Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'>) => {
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

  const recurringDays = closedDays?.filter((d) => d.is_recurring) || [];
  const oneTimeDays = closedDays?.filter((d) => !d.is_recurring) || [];

  const isLoading = loadingHours || loadingClosedDays;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Openingstijden & Beschikbaarheid</h1>
          <p className="text-muted-foreground mt-1">
            Beheer openingstijden en gesloten dagen van de winkel.
          </p>
        </div>

        <Tabs defaultValue="opening-hours" className="space-y-6">
          <TabsList>
            <TabsTrigger value="opening-hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Openingstijden
            </TabsTrigger>
            <TabsTrigger value="closed-days" className="flex items-center gap-2">
              <CalendarX className="h-4 w-4" />
              Gesloten dagen
            </TabsTrigger>
          </TabsList>

          {/* Opening Hours Tab */}
          <TabsContent value="opening-hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Weekoverzicht
                </CardTitle>
                <CardDescription>
                  Stel per dag de openings- en sluitingstijden in, of markeer de dag als gesloten.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openingHours?.map((hour) => {
                    const isClosed = getEditValue(hour.id, 'is_closed', hour.is_closed);
                    const openTime = getEditValue(hour.id, 'open_time', hour.open_time);
                    const closeTime = getEditValue(hour.id, 'close_time', hour.close_time);

                    return (
                      <div
                        key={hour.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card"
                      >
                        <div className="w-32 font-medium">{getDayName(hour.day_of_week)}</div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id={`closed-${hour.id}`}
                            checked={isClosed as boolean}
                            onCheckedChange={(checked) =>
                              handleChange(hour.id, 'is_closed', checked, hour)
                            }
                          />
                          <Label htmlFor={`closed-${hour.id}`} className="text-sm">
                            Gesloten
                          </Label>
                        </div>

                        <div className={`flex items-center gap-2 flex-1 ${isClosed ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Van</Label>
                            <Input
                              type="time"
                              value={(openTime as string).slice(0, 5)}
                              onChange={(e) =>
                                handleChange(hour.id, 'open_time', e.target.value, hour)
                              }
                              disabled={isClosed as boolean}
                              className="w-28"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Tot</Label>
                            <Input
                              type="time"
                              value={(closeTime as string).slice(0, 5)}
                              onChange={(e) =>
                                handleChange(hour.id, 'close_time', e.target.value, hour)
                              }
                              disabled={isClosed as boolean}
                              className="w-28"
                            />
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleSaveHour(hour.id, hour)}
                          disabled={!hasChanges(hour.id) || updateMutation.isPending}
                          className="sm:w-auto w-full"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Opslaan
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Closed Days Tab */}
          <TabsContent value="closed-days" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreateClosedDay}>
                <Plus className="h-4 w-4 mr-2" />
                Toevoegen
              </Button>
            </div>

            {/* Recurring Days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  Terugkerende sluitingsdagen
                </CardTitle>
                <CardDescription>
                  Dagen die elke week gesloten zijn (naast de reguliere openingstijden).
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {recurringDays.length === 0 ? (
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
                              {getClosedDayName(closedDay.day_of_week!)}
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
                                onClick={() => handleEditClosedDay(closedDay)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClosedDay(closedDay)}
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
              </CardContent>
            </Card>

            {/* One-time Closed Days */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarX className="h-5 w-5" />
                  Eenmalige sluitingsdagen
                </CardTitle>
                <CardDescription>
                  Specifieke datums waarop de winkel gesloten is (bijv. feestdagen, vakantie).
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {oneTimeDays.length === 0 ? (
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
                                onClick={() => handleEditClosedDay(closedDay)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClosedDay(closedDay)}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <ClosedDayDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveClosedDay}
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
};

export default AdminOpeningHours;
