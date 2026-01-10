import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Company } from '@/hooks/useCompanies';

const companySchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  preferred_payment_method: z.enum(['direct', 'invoice', 'monthly_invoice']).optional().nullable(),
  notes: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompanyFormData) => void;
}

const PAYMENT_METHODS = [
  { value: 'direct', label: 'Direct betalen' },
  { value: 'invoice', label: 'Per factuur' },
  { value: 'monthly_invoice', label: 'Verzamelfactuur' },
];

export function CompanyDialog({ company, open, onOpenChange, onSubmit }: CompanyDialogProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      postcode: '',
      city: '',
      preferred_payment_method: null,
      notes: '',
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        email: company.email,
        phone: company.phone || '',
        address: company.address || '',
        postcode: company.postcode || '',
        city: company.city || '',
        preferred_payment_method: company.preferred_payment_method,
        notes: company.notes || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        postcode: '',
        city: '',
        preferred_payment_method: null,
        notes: '',
      });
    }
  }, [company, form]);

  const handleSubmit = (data: CompanyFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {company ? 'Bedrijf bewerken' : 'Nieuw bedrijf'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrijfsnaam *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>Telefoon</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adres</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

            <FormField
              control={form.control}
              name="preferred_payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voorkeur betaalmethode</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer betaalmethode" />
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notities</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuleren
              </Button>
              <Button type="submit">
                {company ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
