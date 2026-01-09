import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminInvoices() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Facturen</h1>
          <p className="text-muted-foreground">Beheer facturen en verzamelfacturen</p>
        </div>
        
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Facturen beheer wordt in een latere fase gebouwd.
        </div>
      </div>
    </AdminLayout>
  );
}
