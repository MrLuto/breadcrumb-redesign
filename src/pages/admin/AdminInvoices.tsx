import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  useInvoices, 
  useUpdateInvoiceStatus, 
  useDeleteInvoice,
  INVOICE_STATUSES,
  Invoice 
} from '@/hooks/useInvoices';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';

export default function AdminInvoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useInvoices();
  const updateInvoiceStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice.mutate(invoiceToDelete.id);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Facturen</h1>
          <p className="text-muted-foreground">Beheer facturen en verzamelfacturen</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op factuurnummer of bedrijf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter op status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factuurnummer</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Vervaldatum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Laden...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Geen facturen gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices?.map((invoice) => {
                  const invoiceStatus = INVOICE_STATUSES.find(s => s.value === invoice.status);
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.company_name}</TableCell>
                      <TableCell>
                        {invoice.period_start && invoice.period_end ? (
                          <span className="text-sm">
                            {format(new Date(invoice.period_start), 'dd MMM', { locale: nl })} - {format(new Date(invoice.period_end), 'dd MMM yyyy', { locale: nl })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatPrice(invoice.total)}</div>
                          <div className="text-xs text-muted-foreground">
                            excl. BTW: {formatPrice(invoice.subtotal)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? (
                          format(new Date(invoice.due_date), 'PP', { locale: nl })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => 
                            updateInvoiceStatus.mutate({ 
                              id: invoice.id, 
                              status: value as typeof invoice.status 
                            })
                          }
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <Badge className={`${invoiceStatus?.color} text-white`}>
                              {invoiceStatus?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {INVOICE_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <Badge className={`${status.color} text-white`}>
                                  {status.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirm Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Factuur verwijderen"
          description={`Weet je zeker dat je factuur ${invoiceToDelete?.invoice_number} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        />
      </div>
    </AdminLayout>
  );
}
