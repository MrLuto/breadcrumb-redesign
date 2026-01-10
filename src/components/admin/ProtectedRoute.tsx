import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setStuck(false);
      return;
    }

    const t = window.setTimeout(() => setStuck(true), 4500);
    return () => window.clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>

          {stuck && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                Dit duurt ongewoon lang. Dit komt vaak doordat je browser opslag (sessie) blokkeert.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = '/admin/login';
                }}
              >
                Naar admin login
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

