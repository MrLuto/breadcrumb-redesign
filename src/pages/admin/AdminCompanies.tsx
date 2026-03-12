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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Mail, Phone, Building2, User } from 'lucide-react';
import { 
  useCompanies, 
  useCreateCompany, 
  useUpdateCompany, 
  useDeleteCompany,
  Company 
} from '@/hooks/useCompanies';
import { useAllCustomerProfiles, type CustomerProfile } from '@/hooks/useCustomerProfiles';
import { CompanyDialog } from '@/components/admin/CompanyDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data: customers, isLoading: customersLoading } = useAllCustomerProfiles();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

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

  const filteredCompanies = companies?.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleSubmitCompany = (data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedCompany) {
      updateCompany.mutate({ id: selectedCompany.id, ...data });
    } else {
      createCompany.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedCompany) {
      deleteCompany.mutate(selectedCompany.id);
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Klanten</h1>
          <p className="text-muted-foreground">Overzicht van alle klanten en bedrijven</p>
        </div>

        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Klanten</TabsTrigger>
            <TabsTrigger value="companies">Bedrijven</TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam, email, plaats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant={customerTypeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomerTypeFilter('all')}
                >
                  Alle
                </Button>
                <Button
                  variant={customerTypeFilter === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomerTypeFilter('private')}
                >
                  <User className="h-3.5 w-3.5 mr-1" />
                  Particulier
                </Button>
                <Button
                  variant={customerTypeFilter === 'business' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomerTypeFilter('business')}
                >
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  Zakelijk
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
                    <TableHead>Aangemeld</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Laden...
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Geen klanten gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="font-medium">
                            {customer.customer_type === 'business'
                              ? customer.company_name || customer.contact_person || '—'
                              : customer.contact_person || '—'}
                          </div>
                          {customer.customer_type === 'business' && customer.contact_person && customer.company_name && (
                            <div className="text-sm text-muted-foreground">{customer.contact_person}</div>
                          )}
                          {customer.department && (
                            <div className="text-xs text-muted-foreground">{customer.department}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.customer_type === 'business' ? 'default' : 'secondary'}>
                            {customer.customer_type === 'business' ? (
                              <><Building2 className="h-3 w-3 mr-1" />Zakelijk</>
                            ) : (
                              <><User className="h-3 w-3 mr-1" />Particulier</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <a href={`mailto:${customer.email}`} className="hover:underline truncate max-w-[180px]">
                                  {customer.email}
                                </a>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <a href={`tel:${customer.phone}`} className="hover:underline">
                                  {customer.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.delivery_address ? (
                            <div className="text-sm">
                              <div>{customer.delivery_address}</div>
                              <div className="text-muted-foreground">
                                {customer.postcode} {customer.city}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.preferred_payment_method ? (
                            <Badge variant="outline">
                              {PAYMENT_METHOD_LABELS[customer.preferred_payment_method] || customer.preferred_payment_method}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {customer.created_at ? format(new Date(customer.created_at), 'PP', { locale: nl }) : '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredCustomers?.length || 0} klant(en) gevonden
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam, email of plaats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCreateCompany}>
                <Plus className="h-4 w-4 mr-2" />
                Nieuw bedrijf
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bedrijf</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Betaalmethode</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companiesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Laden...
                      </TableCell>
                    </TableRow>
                  ) : filteredCompanies?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Geen bedrijven gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies?.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="font-medium">{company.name}</div>
                          {company.notes && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {company.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a href={`mailto:${company.email}`} className="hover:underline">
                                {company.email}
                              </a>
                            </div>
                            {company.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <a href={`tel:${company.phone}`} className="hover:underline">
                                  {company.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.address ? (
                            <div className="text-sm">
                              <div>{company.address}</div>
                              <div className="text-muted-foreground">
                                {company.postcode} {company.city}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.preferred_payment_method ? (
                            <Badge variant="secondary">
                              {PAYMENT_METHOD_LABELS[company.preferred_payment_method]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCompany(company)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCompany(company)}
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
          </TabsContent>
        </Tabs>

        {/* Company Dialog */}
        <CompanyDialog
          company={selectedCompany}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmitCompany}
        />

        {/* Delete Confirm Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Bedrijf verwijderen"
          description={`Weet je zeker dat je ${selectedCompany?.name} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        />
      </div>
    </AdminLayout>
  );
}
