import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, Building2, FileText, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCompanies: number;
  pendingOrders: number;
  todayOrders: number;
  openInvoices: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCompanies: 0,
    pendingOrders: 0,
    todayOrders: 0,
    openInvoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null);
        const today = new Date().toISOString().split('T')[0];

        const [
          productsRes,
          ordersRes,
          companiesRes,
          pendingOrdersRes,
          todayOrdersRes,
          openInvoicesRes,
        ] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('companies').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }).in('order_status', ['new', 'confirmed']),
          supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
        ]);

        const responses = [
          productsRes,
          ordersRes,
          companiesRes,
          pendingOrdersRes,
          todayOrdersRes,
          openInvoicesRes,
        ];

        const firstError = responses.find((r) => r.error)?.error;
        if (firstError) throw firstError;

        setStats({
          totalProducts: productsRes.count || 0,
          totalOrders: ordersRes.count || 0,
          totalCompanies: companiesRes.count || 0,
          pendingOrders: pendingOrdersRes.count || 0,
          todayOrders: todayOrdersRes.count || 0,
          openInvoices: openInvoicesRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError((error as { message?: string })?.message ?? 'Fout bij laden van dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Producten', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      title: 'Totaal Bestellingen', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      title: 'Bedrijven', 
      value: stats.totalCompanies, 
      icon: Building2, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      title: 'Openstaande Orders', 
      value: stats.pendingOrders, 
      icon: Clock, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    { 
      title: 'Bestellingen Vandaag', 
      value: stats.todayOrders, 
      icon: TrendingUp, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    { 
      title: 'Open Facturen', 
      value: stats.openInvoices, 
      icon: FileText, 
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welkom bij het FrisVersshop beheerdersdashboard</p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-medium">Kon dashboard data niet laden</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <a 
                href="/admin/products" 
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">Producten Beheren</span>
              </a>
              <a 
                href="/admin/orders" 
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">Bestellingen Bekijken</span>
              </a>
              <a 
                href="/admin/categories" 
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">Categorieën</span>
              </a>
              <a 
                href="/admin/invoices" 
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-center"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">Facturen</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
