import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { usePrintClients, useUpdatePrintClient, useDeletePrintClient, PrintClient } from '@/hooks/usePrintClients';
import { toast } from '@/hooks/use-toast';
import { Download, Eye, Loader2, Printer, Send, Settings, Trash2, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';



const templateLabels: Record<string, string> = {
  receipt: 'Standaard bon',
  plain_text: 'Minimalistische tekst',
  invoice_a4: 'A4 Pakbon / Factuur',
};

export default function AdminPrinters() {
  const { data: clients, isLoading } = usePrintClients();
  const updateClient = useUpdatePrintClient();
  const deleteClient = useDeletePrintClient();

  const [editClient, setEditClient] = useState<PrintClient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<PrintClient | null>(null);

  // Edit form state
  const [formPrinterName, setFormPrinterName] = useState('');
  const [formPaperWidth, setFormPaperWidth] = useState(80);
  const [formMargin, setFormMargin] = useState(5);
  const [formAutoprint, setFormAutoprint] = useState(true);
  const [formPollInterval, setFormPollInterval] = useState(10);
  const [formCopies, setFormCopies] = useState(1);
  const [formActive, setFormActive] = useState(true);
  const [formTemplate, setFormTemplate] = useState('receipt');
  const [formNickname, setFormNickname] = useState('');

  // Test print state
  const [testTemplate, setTestTemplate] = useState('receipt');

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const storageBase = `${baseUrl}/storage/v1/object/public/printer-client`;

  const downloads = [
    { label: 'Windows (x64)', file: 'fvs-printer-windows-amd64.exe', icon: '🪟' },
    { label: 'Windows (ARM)', file: 'fvs-printer-windows-arm64.exe', icon: '🪟' },
    { label: 'macOS (Intel)', file: 'fvs-printer-darwin-amd64', icon: '🍎' },
    { label: 'macOS (Apple Silicon)', file: 'fvs-printer-darwin-arm64', icon: '🍎' },
    { label: 'Linux (x64)', file: 'fvs-printer-linux-amd64', icon: '🐧' },
    { label: 'Linux (ARM)', file: 'fvs-printer-linux-arm64', icon: '🐧' },
  ];

  const openEdit = (client: PrintClient) => {
    setEditClient(client);
    setFormPrinterName(client.printer_name || '');
    setFormPaperWidth(client.paper_width_mm);
    setFormMargin(client.margin_mm);
    setFormAutoprint(client.auto_print);
    setFormPollInterval(client.poll_interval_seconds);
    setFormCopies(client.copies);
    setFormActive(client.is_active);
    setFormTemplate(client.print_template || 'receipt');
    setFormNickname(client.nickname || '');
  };

  const handleSave = async () => {
    if (!editClient) return;
    try {
      await updateClient.mutateAsync({
        id: editClient.id,
        printer_name: formPrinterName,
        paper_width_mm: formPaperWidth,
        margin_mm: formMargin,
        auto_print: formAutoprint,
        poll_interval_seconds: formPollInterval,
        copies: formCopies,
        is_active: formActive,
        print_template: formTemplate,
        nickname: formNickname || null,
      });
      toast({ title: 'Instellingen opgeslagen' });
      setEditClient(null);
    } catch {
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient.mutateAsync(clientToDelete.id);
      toast({ title: 'Printer verwijderd' });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    }
  };

  const handleSendTestPrint = async (clientId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch(
        `${baseUrl}/functions/v1/request-test-print`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ client_id: clientId, template: testTemplate }),
        }
      );
      if (!res.ok) throw new Error('Request failed');
      toast({ title: 'Test print verstuurd naar printer' });
    } catch {
      toast({ title: 'Test print versturen mislukt', variant: 'destructive' });
    }
  };

  const fetchTestHtml = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    const res = await fetch(
      `${baseUrl}/functions/v1/generate-print-html?test=true&template=${testTemplate}`,
      { headers: { 'Authorization': `Bearer ${session.access_token}` } }
    );
    if (!res.ok) throw new Error('Fetch failed');
    return res.text();
  };

  const handleTestPreview = async () => {
    try {
      const html = await fetchTestHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast({ title: 'Preview laden mislukt', variant: 'destructive' });
    }
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 2 * 60 * 1000;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Printers</h1>
          <p className="text-muted-foreground mt-1">
            Beheer de print clients die bonnen printen. Clients registreren zichzelf automatisch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Print Client Downloads
              </CardTitle>
              <CardDescription>
                Download de print client voor jouw besturingssysteem.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {downloads.map((d) => (
                  <Button key={d.file} variant="outline" asChild className="justify-start">
                    <a href={`${storageBase}/${d.file}`} download>
                      <span className="mr-2">{d.icon}</span>
                      {d.label}
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Test Print
              </CardTitle>
              <CardDescription>
                Bekijk of print een voorbeeld met testdata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={testTemplate} onValueChange={setTestTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              {clients && clients.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <Label>Verstuur naar printer</Label>
                  <div className="flex flex-wrap gap-2">
                    {clients.map((client) => (
                      <Button
                        key={client.id}
                        size="sm"
                        variant={isOnline(client.last_seen_at) ? "default" : "secondary"}
                        onClick={() => handleSendTestPrint(client.id)}
                        disabled={!client.is_active}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {client.nickname || client.desktop_name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Geregistreerde Printers
            </CardTitle>
            <CardDescription>
              De Go print client registreert zich automatisch met computer ID en naam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !clients?.length ? (
              <p className="text-center text-muted-foreground py-8">
                Nog geen printers geregistreerd. Start de Go print client op een computer om deze hier te zien.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Computer</TableHead>
                    <TableHead>Printer</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Kopieën</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Laatst gezien</TableHead>
                    <TableHead className="w-[100px]">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        {isOnline(client.last_seen_at) ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <Wifi className="h-3 w-3" /> Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <WifiOff className="h-3 w-3" /> Offline
                          </Badge>
                        )}
                        {!client.is_active && (
                          <Badge variant="destructive" className="mt-1 w-fit">Uitgeschakeld</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{client.nickname || client.desktop_name}</div>
                        {client.nickname && <div className="text-xs text-muted-foreground">{client.desktop_name}</div>}
                        <div className="text-xs text-muted-foreground font-mono">{client.machine_id.slice(0, 12)}...</div>
                      </TableCell>
                      <TableCell>{client.printer_name || <span className="text-muted-foreground">Standaard</span>}</TableCell>
                      <TableCell>{templateLabels[client.print_template] || client.print_template}</TableCell>
                      <TableCell>{client.copies}x</TableCell>
                      <TableCell>{client.poll_interval_seconds}s</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {client.last_seen_at
                          ? formatDistanceToNow(new Date(client.last_seen_at), { addSuffix: true, locale: nl })
                          : 'Nooit'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(client)} title="Instellingen">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setClientToDelete(client); setDeleteDialogOpen(true); }}
                            title="Verwijderen"
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

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Printer Instellingen</DialogTitle>
            <DialogDescription>
              {editClient?.desktop_name} ({editClient?.machine_id.slice(0, 12)}...)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nickname</Label>
              <Input value={formNickname} onChange={(e) => setFormNickname(e.target.value)} placeholder="Bijv. Keuken, Balie, Kantoor" />
            </div>

            <div className="flex items-center justify-between">
              <Label>Actief</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Automatisch printen</Label>
              <Switch checked={formAutoprint} onCheckedChange={setFormAutoprint} />
            </div>

            <div className="space-y-2">
              <Label>Printer</Label>
              {editClient?.available_printers && editClient.available_printers.length > 0 ? (
                <Select value={formPrinterName || "__default__"} onValueChange={(v) => setFormPrinterName(v === "__default__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een printer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Standaard printer</SelectItem>
                    {editClient.available_printers.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formPrinterName} onChange={(e) => setFormPrinterName(e.target.value)} placeholder="Geen printers gevonden — voer naam handmatig in" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Print template</Label>
              <Select value={formTemplate} onValueChange={setFormTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templateLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Papierbreedte (mm)</Label>
                <Input type="number" value={formPaperWidth} onChange={(e) => setFormPaperWidth(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Marge (mm)</Label>
                <Input type="number" value={formMargin} onChange={(e) => setFormMargin(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aantal kopieën</Label>
                <Input type="number" min={1} max={5} value={formCopies} onChange={(e) => setFormCopies(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Poll interval (sec)</Label>
                <Input type="number" min={5} max={120} value={formPollInterval} onChange={(e) => setFormPollInterval(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClient(null)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={updateClient.isPending}>
              {updateClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Printer verwijderen"
        description={`Weet je zeker dat je "${clientToDelete?.desktop_name}" wilt verwijderen? De client registreert zich opnieuw bij de volgende start.`}
        isLoading={deleteClient.isPending}
      />
    </AdminLayout>
  );
}
