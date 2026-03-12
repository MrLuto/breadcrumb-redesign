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
import { Input } from '@/components/ui/input';
import { Search, Mail, Phone, Building2, User } from 'lucide-react';
import { useAllCustomerProfiles, type CustomerProfile } from '@/hooks/useCustomerProfiles';
import { useOrders } from '@/hooks/useOrders';
import { CustomerOrdersDialog } from '@/components/admin/CustomerOrdersDialog';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  direct: 'Direct',
  invoice: 'Factuur',
  monthly_invoice: 'Verzamelfactuur',
  ideal: 'iDEAL',
  pin: 'PIN',
  cash: 'Contant',
};

export default function AdminCompanies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'private' | 'business'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrdersOpen, setCustomerOrdersOpen] = useState(false);

  const { data: customers, isLoading: customersLoading } = useAllCustomerProfiles();
  const { data: allOrders } = useOrders();

  const openOrdersByUser = new Map<string, number>();
  allOrders?.forEach(o => {
    if (o.user_id && o.order_status !== 'delivered' && o.order_status !== 'cancelled') {
      openOrdersByUser.set(o.user_id, (openOrdersByUser.get(o.user_id) || 0) + 1);
    }
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesType = customerTypeFilter === 'all' || customer.customer_type === customerTypeFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      customer.contact_person?.toLowerCase().includes(search) ||
      customer.company_name?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.city?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search);
    return matchesType && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Klanten</h1>
          <p className="text-muted-foreground">Overzicht van alle klanten</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Zoek op naam, email, plaats..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-1">
            <Button variant={customerTypeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCustomerTypeFilter('all')}>Alle</Button>
            <Button variant={customerTypeFilter === 'private' ? 'default' : 'outline'} size="sm" onClick={() => setCustomerTypeFilter('private')}>
              <User className="h-3.5 w-3.5 mr-1" />Particulier
            </Button>
            <Button variant={customerTypeFilter === 'business' ? 'default' : 'outline'} size="sm" onClick={() => setCustomerTypeFilter('business')}>
              <Building2 className="h-3.5 w-3.5 mr-1" />Zakelijk
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Betaalvoorkeur</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Aangemeld</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customersLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Laden...</TableCell></TableRow>
              ) : filteredCustomers?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Geen klanten gevonden</TableCell></TableRow>
              ) : (
                filteredCustomers?.map((customer) => {
                  const openCount = openOrdersByUser.get(customer.user_id) || 0;
                  return (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedCustomer(customer); setCustomerOrdersOpen(true); }}>
                      <TableCell>
                        <div className="font-medium">
                          {customer.customer_type === 'business' ? customer.company_name || customer.contact_person || '—' : customer.contact_person || '—'}
                        </div>
                        {customer.customer_type === 'business' && customer.contact_person && customer.company_name && (
                          <div className="text-sm text-muted-foreground">{customer.contact_person}</div>
                        )}
                        {customer.department && <div className="text-xs text-muted-foreground">{customer.department}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.customer_type === 'business' ? 'default' : 'secondary'}>
                          {customer.customer_type === 'business' ? <><Building2 className="h-3 w-3 mr-1" />Zakelijk</> : <><User className="h-3 w-3 mr-1" />Particulier</>}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[180px]">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.delivery_address ? (
                          <div className="text-sm">
                            <div>{customer.delivery_address}</div>
                            <div className="text-muted-foreground">{customer.postcode} {customer.city}</div>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {customer.preferred_payment_method ? (
                          <Badge variant="outline">{PAYMENT_METHOD_LABELS[customer.preferred_payment_method] || customer.preferred_payment_method}</Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {openCount > 0 ? (
                          <Badge variant="destructive" className="text-xs">{openCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {customer.created_at ? format(new Date(customer.created_at), 'PP', { locale: nl }) : '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm text-muted-foreground">{filteredCustomers?.length || 0} klant(en) gevonden</div>

        <CustomerOrdersDialog customer={selectedCustomer} open={customerOrdersOpen} onOpenChange={setCustomerOrdersOpen} />
      </div>
    </AdminLayout>
  );
}