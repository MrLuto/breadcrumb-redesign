import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logo from '@/assets/logo.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const { signIn, signUp, isAdmin, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  // Redirect when user is logged in as admin
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        // Registration
        const { error } = await signUp(email, password);
        
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Dit e-mailadres is al geregistreerd');
          } else {
            setError(error.message);
          }
          setIsSubmitting(false);
          return;
        }

        setSuccess('Account aangemaakt! Een beheerder moet je account nog activeren als admin.');
        setIsSubmitting(false);
      } else {
        // Login
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Onjuiste e-mail of wachtwoord');
          } else {
            setError(error.message);
          }
          setIsSubmitting(false);
          return;
        }

        // Keep submitting state true - the useEffect will handle redirect 
        // once auth state updates. Don't set isSubmitting to false here.
      }
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="FrisVersshop" className="h-12" />
          </div>
          <CardTitle className="text-2xl">
            {isRegisterMode ? 'Admin Registratie' : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            {isRegisterMode 
              ? 'Maak een nieuw account aan voor het beheerdersdashboard'
              : 'Log in om toegang te krijgen tot het beheerdersdashboard'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-500 text-green-700 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@frisversshop.nl"
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
                minLength={6}
                disabled={isSubmitting}
              />
              {isRegisterMode && (
                <p className="text-xs text-muted-foreground">
                  Minimaal 6 tekens
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isRegisterMode ? 'Registreren...' : 'Inloggen...'}
                </>
              ) : (
                isRegisterMode ? 'Registreren' : 'Inloggen'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-primary hover:underline"
            >
              {isRegisterMode 
                ? 'Al een account? Log in'
                : 'Nog geen account? Registreer'
              }
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Terug naar de website
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
