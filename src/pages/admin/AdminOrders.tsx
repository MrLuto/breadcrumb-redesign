import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminOrders() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bestellingen</h1>
          <p className="text-muted-foreground">Bekijk en beheer bestellingen</p>
        </div>
        
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Bestellingen beheer wordt in een latere fase gebouwd.
        </div>
      </div>
    </AdminLayout>
  );
}
