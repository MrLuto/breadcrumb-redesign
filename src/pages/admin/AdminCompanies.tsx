import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminCompanies() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bedrijven</h1>
          <p className="text-muted-foreground">Beheer je zakelijke klanten</p>
        </div>
        
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Bedrijven beheer wordt in een latere fase gebouwd.
        </div>
      </div>
    </AdminLayout>
  );
}
