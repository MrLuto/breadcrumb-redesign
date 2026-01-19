import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerProfile, useUpdateCustomerProfile, useCustomerOrders } from '@/hooks/useCustomerProfile';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Package, LogOut, Save } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CustomerTypeToggle } from '@/components/checkout/CustomerTypeToggle';

const profileSchema = z.object({
  customer_type: z.enum(['private', 'business']),
  company_name: z.string().optional(),
  kvk_number: z.string().optional(),
  department: z.string().optional(),
  contact_person: z.string().min(1, 'Naam is verplicht'),
  phone: z.string().optional(),
  delivery_address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  same_billing_address: z.boolean(),
  billing_address: z.string().optional(),
  billing_postcode: z.string().optional(),
  billing_city: z.string().optional(),
  preferred_payment_method: z.string().optional(),
  default_notes: z.string().optional(),
  default_order_type: z.enum(['delivery', 'pickup']).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const PAYMENT_METHODS = [
  { value: 'ideal', label: 'iDEAL' },
  { value: 'pin', label: 'PIN (bij bezorgen/afhalen)' },
  { value: 'invoice', label: 'Op factuur' },
  { value: 'monthly_invoice', label: 'Verzamelfactuur' },
  { value: 'cash', label: 'Contant' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders();
  const updateProfile = useUpdateCustomerProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      customer_type: (profile?.customer_type as 'private' | 'business') || 'private',
      company_name: profile?.company_name || '',
      kvk_number: profile?.kvk_number || '',
      department: profile?.department || '',
      contact_person: profile?.contact_person || '',
      phone: profile?.phone || '',
      delivery_address: profile?.delivery_address || '',
      postcode: profile?.postcode || '',
      city: profile?.city || '',
      same_billing_address: profile?.same_billing_address ?? true,
      billing_address: profile?.billing_address || '',
      billing_postcode: profile?.billing_postcode || '',
      billing_city: profile?.billing_city || '',
      preferred_payment_method: profile?.preferred_payment_method || '',
      default_notes: profile?.default_notes || '',
      default_order_type: (profile?.default_order_type as 'delivery' | 'pickup') || 'delivery',
    },
  });

  const watchedCustomerType = form.watch('customer_type');
  const watchedSameBilling = form.watch('same_billing_address');

  const handleSubmit = async (data: ProfileFormData) => {
    updateProfile.mutate({
      customer_type: data.customer_type,
      company_name: data.company_name || null,
      kvk_number: data.kvk_number || null,
      department: data.department || null,
      contact_person: data.contact_person || null,
      phone: data.phone || null,
      delivery_address: data.delivery_address || null,
      postcode: data.postcode || null,
      city: data.city || null,
      same_billing_address: data.same_billing_address,
      billing_address: data.billing_address || null,
      billing_postcode: data.billing_postcode || null,
      billing_city: data.billing_city || null,
      preferred_payment_method: data.preferred_payment_method || null,
      default_notes: data.default_notes || null,
      default_order_type: data.default_order_type || null,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Uitgelogd',
      description: 'Je bent succesvol uitgelogd.',
    });
    navigate('/', { replace: true });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Only redirect if auth is done loading and there's no user
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold">Mijn Account</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Mijn Gegevens
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Bestellingen
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card rounded-xl p-6 shadow-card max-w-3xl">
                <h2 className="text-xl font-semibold mb-6">Profiel bewerken</h2>
                
                {profileLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      {/* Customer Type */}
                      <FormField
                        control={form.control}
                        name="customer_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Klanttype</FormLabel>
                            <FormControl>
                              <CustomerTypeToggle
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Business Fields */}
                      {watchedCustomerType === 'business' && (
                        <>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="company_name"
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel>Bedrijfsnaam</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Uw bedrijfsnaam" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="kvk_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>KvK-nummer</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="12345678" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Afdeling (optioneel)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Bijv. Receptie, HR" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </>
                      )}

                      {/* Contact Info */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contact_person"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{watchedCustomerType === 'business' ? 'Contactpersoon' : 'Naam'}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefoonnummer</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Delivery Address */}
                      <h3 className="font-medium">Standaard bezorgadres</h3>

                      <FormField
                        control={form.control}
                        name="delivery_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Straat en huisnummer</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="postcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postcode</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="1234 AB" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plaats</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Billing Address */}
                      {watchedCustomerType === 'business' && (
                        <>
                          <Separator />
                          <h3 className="font-medium">Facturatieadres</h3>

                          <FormField
                            control={form.control}
                            name="same_billing_address"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-normal cursor-pointer">
                                    Zelfde als bezorgadres
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          {!watchedSameBilling && (
                            <>
                              <FormField
                                control={form.control}
                                name="billing_address"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Straat en huisnummer</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="billing_postcode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Postcode</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="1234 AB" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="billing_city"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Plaats</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}

                      <Separator />

                      {/* Preferences */}
                      <h3 className="font-medium">Voorkeuren</h3>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="preferred_payment_method"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Voorkeur betaalmethode</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecteer methode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PAYMENT_METHODS.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                      {method.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="default_order_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Voorkeur bezorging/afhalen</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || 'delivery'}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecteer optie" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="delivery">Bezorgen</SelectItem>
                                  <SelectItem value="pickup">Afhalen</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="default_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Standaard opmerkingen</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Bijv. Graag bellen bij aankomst, allergieën, etc."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Opslaan
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-6">Mijn Bestellingen</h2>
                
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : orders?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Je hebt nog geen bestellingen geplaatst.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders?.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP', { locale: nl })}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              order.order_status === 'delivered' ? 'default' :
                              order.order_status === 'cancelled' ? 'destructive' : 'secondary'
                            }>
                              {order.order_status === 'new' && 'Nieuw'}
                              {order.order_status === 'confirmed' && 'Bevestigd'}
                              {order.order_status === 'preparing' && 'In voorbereiding'}
                              {order.order_status === 'out_for_delivery' && 'Onderweg'}
                              {order.order_status === 'delivered' && 'Bezorgd'}
                              {order.order_status === 'cancelled' && 'Geannuleerd'}
                            </Badge>
                            <p className="font-semibold mt-1">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.order_items?.length} product(en) • 
                          {order.order_type === 'pickup' ? ' Afhalen' : ' Bezorgen'} op {format(new Date(order.delivery_date), 'PP', { locale: nl })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
