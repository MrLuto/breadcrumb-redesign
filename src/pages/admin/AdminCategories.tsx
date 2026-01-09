import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminCategories() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Categorieën</h1>
          <p className="text-muted-foreground">Beheer je productcategorieën</p>
        </div>
        
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Categorieën beheer wordt in de volgende fase gebouwd.
        </div>
      </div>
    </AdminLayout>
  );
}
