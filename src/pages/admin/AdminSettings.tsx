import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, useRemoveAdminRole, useResetAdminPassword } from '@/hooks/useAdminUsers';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, CheckCircle2, Trash2, Users, Shield, KeyRound } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AdminSettings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  
  // Password reset state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  
  const { session, user } = useAuth();
  const { data: adminUsers, isLoading: loadingAdmins } = useAdminUsers();
  const removeAdminMutation = useRemoveAdminRole();
  const resetPasswordMutation = useResetAdminPassword();

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

      setSuccess(`Account voor ${email} is aangemaakt met admin rechten!`);
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

  const handleDeleteClick = (userId: string, email: string) => {
    setUserToDelete({ id: userId, email });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    await removeAdminMutation.mutateAsync(userToDelete.id);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleResetClick = (userId: string, email: string) => {
    setUserToReset({ id: userId, email });
    setNewPassword('');
    setConfirmNewPassword('');
    setResetError(null);
    setResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!userToReset) return;
    
    if (newPassword !== confirmNewPassword) {
      setResetError('Wachtwoorden komen niet overeen');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Wachtwoord moet minimaal 6 tekens bevatten');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ 
        userId: userToReset.id, 
        newPassword 
      });
      setResetDialogOpen(false);
      setUserToReset(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      // Error is handled in mutation
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Beheer admin accounts voor het admin paneel.
          </p>
        </div>

        {/* Existing Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Accounts
            </CardTitle>
            <CardDescription>
              Overzicht van alle gebruikers met admin toegang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Toegevoegd op</TableHead>
                  <TableHead className="w-[120px]">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAdmins ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : adminUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Geen admin accounts gevonden.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminUsers?.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell className="font-medium">
                        {adminUser.email}
                        {adminUser.user_id === user?.id && (
                          <Badge variant="outline" className="ml-2">Jij</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" />
                          {adminUser.role === 'admin' ? 'Admin' : 'Moderator'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(adminUser.created_at), 'PPP', { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResetClick(adminUser.user_id, adminUser.email || '')}
                            disabled={resetPasswordMutation.isPending}
                            title="Wachtwoord resetten"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {adminUser.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(adminUser.user_id, adminUser.email || '')}
                              disabled={removeAdminMutation.isPending}
                              title="Admin verwijderen"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create New Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nieuw Admin Account
            </CardTitle>
            <CardDescription>
              Maak een nieuw account aan voor een medewerker om toegang te krijgen tot het admin paneel.
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

              <div className="grid sm:grid-cols-3 gap-4">
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

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Admin verwijderen"
        description={`Weet je zeker dat je de admin rechten van ${userToDelete?.email} wilt intrekken? De gebruiker kan dan niet meer inloggen in het admin paneel.`}
        isLoading={removeAdminMutation.isPending}
      />

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Wachtwoord Resetten
            </DialogTitle>
            <DialogDescription>
              Stel een nieuw wachtwoord in voor {userToReset?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Bevestig Wachtwoord</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={resetPasswordMutation.isPending}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleConfirmReset}
              disabled={resetPasswordMutation.isPending || !newPassword || !confirmNewPassword}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : (
                'Wachtwoord Resetten'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
