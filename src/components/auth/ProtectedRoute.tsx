// components/auth/ProtectedRoute.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, hasActiveSubscription } = useSubscription();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        setChecking(false);
        return;
      }

      setIsAuthenticated(true);
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!checking && !loading && isAuthenticated && !hasActiveSubscription) {
      router.push('/pricing');
    }
  }, [checking, loading, isAuthenticated, hasActiveSubscription, router]);

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasActiveSubscription) {
    return null;
  }

  return <>{children}</>;
}