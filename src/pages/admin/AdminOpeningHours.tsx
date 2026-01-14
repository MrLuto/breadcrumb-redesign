import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOpeningHours, useUpdateOpeningHour, getDayName } from '@/hooks/useOpeningHours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Save } from 'lucide-react';

interface EditState {
  [id: string]: {
    open_time: string;
    close_time: string;
    is_closed: boolean;
  };
}

const AdminOpeningHours = () => {
  const { data: openingHours, isLoading } = useOpeningHours();
  const updateMutation = useUpdateOpeningHour();
  const [editState, setEditState] = useState<EditState>({});

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

  const handleSave = async (id: string, original: any) => {
    const edited = editState[id];
    if (!edited) return;

    await updateMutation.mutateAsync({
      id,
      open_time: edited.open_time ?? original.open_time,
      close_time: edited.close_time ?? original.close_time,
      is_closed: edited.is_closed ?? original.is_closed,
    });

    // Clear edit state for this item
    setEditState((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const hasChanges = (id: string) => {
    return !!editState[id];
  };

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
          <h1 className="text-3xl font-bold">Openingstijden</h1>
          <p className="text-muted-foreground mt-1">
            Beheer de openingstijden van de winkel per dag.
          </p>
        </div>

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
                    {/* Day name */}
                    <div className="w-32 font-medium">{getDayName(hour.day_of_week)}</div>

                    {/* Closed toggle */}
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

                    {/* Time inputs */}
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

                    {/* Save button */}
                    <Button
                      size="sm"
                      onClick={() => handleSave(hour.id, hour)}
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
      </div>
    </AdminLayout>
  );
};

export default AdminOpeningHours;
