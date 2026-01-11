import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { session } = useAuth();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten');
      return;
    }

    if (!session?.access_token) {
      setError('Je moet ingelogd zijn om admin accounts aan te maken');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the secure edge function to create admin user with role assignment
      const { data, error: functionError } = await supabase.functions.invoke('create-admin', {
        body: { email, password },
      });

      if (functionError) {
        console.error('Create admin error:', functionError);
        setError('Er is een fout opgetreden. Probeer het opnieuw.');
        setIsSubmitting(false);
        return;
      }

      if (data?.error) {
        if (data.error.includes('already registered') || data.error.includes('duplicate')) {
          setError('Dit e-mailadres is al geregistreerd');
        } else if (data.error.includes('Unauthorized')) {
          setError('Je hebt geen rechten om admin accounts aan te maken');
        } else {
          setError(data.error);
        }
        setIsSubmitting(false);
        return;
      }

      setSuccess(`Account voor ${email} is aangemaakt met admin rechten! De gebruiker kan nu inloggen.`);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Instellingen</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nieuw Admin Account
            </CardTitle>
            <CardDescription>
              Maak een nieuw account aan voor een medewerker om toegang te krijgen tot het admin paneel.
              Het account krijgt automatisch admin rechten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="medewerker@voorbeeld.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bevestig Wachtwoord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Account Aanmaken
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
