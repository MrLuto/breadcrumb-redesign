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
import { Plus, Pencil, Trash2, Search, Mail, Phone } from 'lucide-react';
import { 
  useCompanies, 
  useCreateCompany, 
  useUpdateCompany, 
  useDeleteCompany,
  Company 
} from '@/hooks/useCompanies';
import { CompanyDialog } from '@/components/admin/CompanyDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  direct: 'Direct',
  invoice: 'Factuur',
  monthly_invoice: 'Verzamelfactuur',
};

export default function AdminCompanies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data: companies, isLoading } = useCompanies();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const filteredCompanies = companies?.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedCompany(null);
    setDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Bedrijven</h1>
            <p className="text-muted-foreground">Beheer je zakelijke klanten</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuw bedrijf
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, email of plaats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Companies Table */}
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
              {isLoading ? (
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
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.preferred_payment_method ? (
                        <Badge variant="secondary">
                          {PAYMENT_METHOD_LABELS[company.preferred_payment_method]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company)}
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

        {/* Company Dialog */}
        <CompanyDialog
          company={selectedCompany}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
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
