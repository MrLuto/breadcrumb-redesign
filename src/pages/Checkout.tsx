import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { format, addDays, addMinutes, isBefore, startOfDay, isToday, parse } from 'date-fns';
import { nl } from 'date-fns/locale';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, ShoppingBag, ArrowLeft, MapPin, Truck, AlertCircle, User, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useActiveDeliveryZones, getDeliveryZoneForPostcode } from '@/hooks/useDeliveryZones';
import { useShopSettings, calculateDeliveryCost } from '@/hooks/useShopSettings';
import { useActiveClosedDays, isDateClosed } from '@/hooks/useClosedDays';
import { CustomerTypeToggle } from '@/components/checkout/CustomerTypeToggle';
import { OrderTypeSelector } from '@/components/checkout/OrderTypeSelector';
import { DeliveryTimeInput } from '@/components/checkout/DeliveryTimeInput';

const checkoutSchema = z.object({
  customer_type: z.enum(['private', 'business']),
  order_type: z.enum(['delivery', 'pickup']),
  company_name: z.string().optional(),
  contact_person: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().min(10, 'Telefoonnummer is verplicht'),
  delivery_address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  delivery_date: z.date({ required_error: 'Datum is verplicht' }),
  delivery_asap: z.boolean(),
  delivery_time: z.string().optional(),
  payment_method: z.enum(['ideal', 'pin', 'invoice', 'monthly_invoice', 'cash']),
  notes: z.string().optional(),
}).refine((data) => {
  // For delivery, address fields are required
  if (data.order_type === 'delivery') {
    return data.delivery_address && data.postcode && data.city;
  }
  return true;
}, {
  message: 'Bezorgadres is verplicht',
  path: ['delivery_address'],
}).refine((data) => {
  // For business, company name is required
  if (data.customer_type === 'business') {
    return data.company_name && data.company_name.trim().length > 0;
  }
  return true;
}, {
  message: 'Bedrijfsnaam is verplicht',
  path: ['company_name'],
}).refine((data) => {
  // Postcode validation for delivery
  if (data.order_type === 'delivery' && data.postcode) {
    return /^\d{4}\s?[A-Za-z]{2}$/.test(data.postcode);
  }
  return true;
}, {
  message: 'Ongeldige postcode',
  path: ['postcode'],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const PAYMENT_METHODS = [
  { value: 'ideal', label: 'iDEAL' },
  { value: 'pin', label: 'PIN (bij bezorgen/afhalen)' },
  { value: 'invoice', label: 'Op factuur' },
  { value: 'cash', label: 'Contant' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { data: profile } = useCustomerProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const { data: deliveryZones } = useActiveDeliveryZones();
  const { data: shopSettings } = useShopSettings();
  const { data: closedDays } = useActiveClosedDays();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_type: 'business',
      order_type: 'delivery',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      delivery_address: '',
      postcode: '',
      city: '',
      delivery_asap: false,
      delivery_time: '',
      payment_method: 'invoice', // Default for business
      notes: '',
    },
  });

  // Update payment method when customer type changes
  const watchedPostcode = form.watch('postcode') || '';
  const watchedOrderType = form.watch('order_type');
  const watchedCustomerType = form.watch('customer_type');
  const watchedDeliveryDate = form.watch('delivery_date');
  const watchedDeliveryAsap = form.watch('delivery_asap');
  const watchedDeliveryTime = form.watch('delivery_time') || '';

  // Update payment method when customer type changes
  useEffect(() => {
    const currentPaymentMethod = form.getValues('payment_method');
    if (watchedCustomerType === 'business') {
      // Default to invoice for business
      if (currentPaymentMethod === 'pin') {
        form.setValue('payment_method', 'invoice');
      }
    } else {
      // Default to pin for private
      if (currentPaymentMethod === 'invoice') {
        form.setValue('payment_method', 'pin');
      }
    }
  }, [watchedCustomerType]);

  // Auto-fill form from profile
  useEffect(() => {
    if (profile) {
      form.reset({
        ...form.getValues(),
        customer_type: (profile.customer_type as 'private' | 'business') || 'business',
        company_name: profile.company_name || '',
        contact_person: profile.contact_person || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        delivery_address: profile.delivery_address || '',
        postcode: profile.postcode || '',
        city: profile.city || '',
      });
    } else if (user?.email) {
      form.setValue('email', user.email);
    }
  }, [profile, user]);

  // Check if postcode is in delivery zone
  const currentZone = getDeliveryZoneForPostcode(deliveryZones, watchedPostcode);
  const postcodeHas4Digits = watchedPostcode.replace(/\s/g, '').length >= 4;
  const canDeliver = !postcodeHas4Digits || currentZone !== null;

  // Calculate delivery cost
  const deliveryCost = useMemo(() => {
    if (watchedOrderType === 'pickup' || !shopSettings) return 0;
    return calculateDeliveryCost(subtotal, shopSettings);
  }, [subtotal, shopSettings, watchedOrderType]);

  const isFreeDelivery = shopSettings && subtotal >= shopSettings.free_delivery_threshold && watchedOrderType === 'delivery';
  const amountUntilFreeDelivery = shopSettings ? shopSettings.free_delivery_threshold - subtotal : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Disable closed days and past dates
  const disabledDays = (date: Date) => {
    const tomorrow = addDays(startOfDay(new Date()), 1);
    
    // Disable past dates (must be at least tomorrow)
    if (isBefore(date, tomorrow)) {
      return true;
    }

    // Disable closed days
    if (closedDays) {
      const { isClosed } = isDateClosed(date, closedDays);
      if (isClosed) return true;
    }

    return false;
  };

  // Get closure reason for a date (for tooltip)
  const getClosureReason = (date: Date): string | undefined => {
    if (closedDays) {
      const { isClosed, reason } = isDateClosed(date, closedDays);
      if (isClosed) return reason;
    }
    return undefined;
  };

  // Validate delivery time
  const validateDeliveryTime = (): string | null => {
    if (!watchedDeliveryDate) return null;
    if (watchedDeliveryAsap) return null;
    if (!watchedDeliveryTime) return null;

    if (isToday(watchedDeliveryDate)) {
      const now = new Date();
      const selectedTime = parse(watchedDeliveryTime, 'HH:mm', watchedDeliveryDate);
      const minPrepTime = shopSettings?.min_preparation_time_minutes || 60;
      const earliestTime = addMinutes(now, minPrepTime);

      if (isBefore(selectedTime, earliestTime)) {
        return `Tijd moet minimaal ${minPrepTime} minuten in de toekomst zijn`;
      }
    }

    return null;
  };

  const timeError = validateDeliveryTime();
  const total = subtotal + deliveryCost;

  const handleSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast({
        title: 'Winkelwagen is leeg',
        description: 'Voeg producten toe voordat je afrekent.',
        variant: 'destructive',
      });
      return;
    }

    if (data.order_type === 'delivery' && !canDeliver) {
      toast({
        title: 'Bezorgen niet mogelijk',
        description: 'Wij bezorgen helaas niet op dit adres. Kies voor afhalen.',
        variant: 'destructive',
      });
      return;
    }

    if (timeError) {
      toast({
        title: 'Ongeldige tijd',
        description: timeError,
        variant: 'destructive',
      });
      return;
    }

    // Check if date is closed
    if (closedDays) {
      const { isClosed, reason } = isDateClosed(data.delivery_date, closedDays);
      if (isClosed) {
        toast({
          title: 'Gesloten op deze dag',
          description: reason || 'Kies een andere datum.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data: orderResult, error: functionError } = await supabase.functions.invoke('create-order', {
        body: {
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            notes: item.notes || undefined,
          })),
          formData: {
            customer_type: data.customer_type,
            order_type: data.order_type,
            company_name: data.company_name || undefined,
            contact_person: data.contact_person,
            email: data.email,
            phone: data.phone,
            delivery_address: data.order_type === 'delivery' ? data.delivery_address : undefined,
            postcode: data.order_type === 'delivery' ? data.postcode : undefined,
            city: data.order_type === 'delivery' ? data.city : undefined,
            delivery_date: format(data.delivery_date, 'yyyy-MM-dd'),
            delivery_asap: data.delivery_asap,
            delivery_time: data.delivery_time || undefined,
            payment_method: data.payment_method,
            notes: data.notes || undefined,
          },
        },
      });

      if (functionError) {
        console.error('Order creation error:', functionError);
        throw new Error('Failed to create order');
      }

      if (orderResult?.error) {
        toast({
          title: 'Bestelling mislukt',
          description: orderResult.error,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (!orderResult?.orderId || !orderResult?.confirmationToken) {
        throw new Error('No order ID or confirmation token returned');
      }

      // Create account if requested
      if (createAccount && accountPassword.length >= 6) {
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: accountPassword,
            options: {
              emailRedirectTo: window.location.origin,
              data: {
                full_name: data.contact_person,
              },
            },
          });

          if (signUpError) {
            console.error('Account creation error:', signUpError);
            // Don't block the order, just show a warning
            toast({
              title: 'Account aanmaken mislukt',
              description: 'Je bestelling is wel geplaatst. Probeer later opnieuw te registreren.',
              variant: 'default',
            });
          } else {
            toast({
              title: 'Account aangemaakt',
              description: 'Je kunt nu inloggen met je e-mailadres en wachtwoord.',
            });
          }
        } catch (accountError) {
          console.error('Account creation error:', accountError);
        }
      }

      clearCart();
      navigate(`/bestelling-bevestigd/${orderResult.orderId}?token=${orderResult.confirmationToken}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Er is iets misgegaan',
        description: 'Probeer het opnieuw of neem contact met ons op.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Je winkelwagen is leeg</h1>
            <p className="text-muted-foreground mb-6">
              Voeg producten toe voordat je kunt afrekenen.
            </p>
            <Link to="/assortiment">
              <Button>Bekijk assortiment</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/assortiment"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar assortiment
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
            Afrekenen
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                  {/* Login/Register Block for Guests */}
                  {!user && (
                    <div className="bg-card rounded-xl p-6 shadow-card border-2 border-primary/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">Heb je al een account?</h2>
                          <p className="text-sm text-muted-foreground">Log in voor sneller afrekenen</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild variant="default" className="flex-1">
                          <Link to="/login?redirect=/checkout">
                            <User className="h-4 w-4 mr-2" />
                            Inloggen
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                          <Link to="/registreren?redirect=/checkout">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Registreren
                          </Link>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 text-center">
                        Of bestel als gast hieronder
                      </p>
                    </div>
                  )}

                  {/* Customer Type */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">Klanttype</h2>
                    <FormField
                      control={form.control}
                      name="customer_type"
                      render={({ field }) => (
                        <FormItem>
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
                  </div>

                  {/* Contact Info */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">
                      {watchedCustomerType === 'business' ? 'Bedrijfsgegevens' : 'Contactgegevens'}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {watchedCustomerType === 'business' && (
                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Bedrijfsnaam *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Uw bedrijfsnaam" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="contact_person"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{watchedCustomerType === 'business' ? 'Contactpersoon *' : 'Naam *'}</FormLabel>
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
                            <FormLabel>Telefoon *</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Address / Postcode */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">Bezorgadres</h2>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="delivery_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Straat en huisnummer *</FormLabel>
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
                              <FormLabel>Postcode *</FormLabel>
                              <FormControl>
                                <Input placeholder="1234 AB" {...field} />
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
                              <FormLabel>Plaats *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">Bezorgen of afhalen</h2>
                    <FormField
                      control={form.control}
                      name="order_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OrderTypeSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Delivery Zone Warning */}
                    {watchedOrderType === 'delivery' && postcodeHas4Digits && !canDeliver && (
                      <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Bezorgen niet mogelijk</p>
                          <p className="text-sm text-muted-foreground">
                            Helaas bezorgen wij niet in deze postcode. Kies voor afhalen of neem contact met ons op.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Free delivery info */}
                    {watchedOrderType === 'delivery' && canDeliver && shopSettings && (
                      <div className={cn(
                        "mt-6 flex items-start gap-3 p-4 rounded-lg border",
                        isFreeDelivery 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-muted/50 border-border"
                      )}>
                        <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          {isFreeDelivery ? (
                            <p className="font-medium text-primary">Gratis bezorging! 🎉</p>
                          ) : (
                            <>
                              <p className="font-medium">Bezorgkosten: {formatPrice(shopSettings.delivery_cost)}</p>
                              <p className="text-sm text-muted-foreground">
                                Nog {formatPrice(amountUntilFreeDelivery)} tot gratis bezorging
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pickup Address (only for pickup) */}
                    {watchedOrderType === 'pickup' && shopSettings && (
                      <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Afhaaladres</p>
                            <p className="text-sm text-muted-foreground">{shopSettings.pickup_address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">
                      {watchedOrderType === 'pickup' ? 'Afhaaldatum & tijd' : 'Bezorgdatum & tijd'}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="delivery_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Datum *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP', { locale: nl })
                                    ) : (
                                      <span>Kies een datum</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={disabledDays}
                                  locale={nl}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <FormLabel className="mb-2 block">Tijd</FormLabel>
                        <DeliveryTimeInput
                          selectedDate={watchedDeliveryDate}
                          deliveryAsap={watchedDeliveryAsap}
                          deliveryTime={watchedDeliveryTime}
                          minPrepTimeMinutes={shopSettings?.min_preparation_time_minutes || 60}
                          onAsapChange={(asap) => form.setValue('delivery_asap', asap)}
                          onTimeChange={(time) => form.setValue('delivery_time', time)}
                          error={timeError || undefined}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">Betaalmethode</h2>
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                  </div>

                  {/* Notes */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="text-xl font-semibold mb-4">Opmerkingen</h2>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Bijzondere wensen of opmerkingen..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || (watchedOrderType === 'delivery' && !canDeliver) || (createAccount && accountPassword.length < 6)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Bestelling plaatsen...
                      </>
                    ) : (
                      `Bestelling plaatsen - ${formatPrice(total)}`
                    )}
                  </Button>

                  {/* Register option for guests */}
                  {!user && (
                    <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          id="create-account" 
                          checked={createAccount}
                          onCheckedChange={(checked) => setCreateAccount(checked === true)}
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor="create-account" 
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Account aanmaken
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sla je gegevens op voor sneller afrekenen in de toekomst
                          </p>
                        </div>
                      </div>
                      
                      {createAccount && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label htmlFor="account-password" className="text-sm font-medium">
                              Wachtwoord *
                            </label>
                            <Input
                              id="account-password"
                              type="password"
                              value={accountPassword}
                              onChange={(e) => setAccountPassword(e.target.value)}
                              placeholder="Minimaal 6 tekens"
                              className="mt-1"
                            />
                            {accountPassword.length > 0 && accountPassword.length < 6 && (
                              <p className="text-xs text-destructive mt-1">
                                Wachtwoord moet minimaal 6 tekens zijn
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </Form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl p-6 shadow-card sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Besteloverzicht</h2>
                
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotaal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {watchedOrderType === 'pickup' ? 'Afhalen' : 'Bezorgkosten'}
                    </span>
                    <span className={isFreeDelivery ? 'text-primary font-medium' : ''}>
                      {watchedOrderType === 'pickup' ? 'Gratis' : (isFreeDelivery ? 'Gratis' : formatPrice(deliveryCost))}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Totaal</span>
                  <span>{formatPrice(total)}</span>
                </div>

                {/* Free delivery progress */}
                {watchedOrderType === 'delivery' && shopSettings && !isFreeDelivery && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      Nog {formatPrice(amountUntilFreeDelivery)} tot gratis bezorging
                    </p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((subtotal / shopSettings.free_delivery_threshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Checkout;
