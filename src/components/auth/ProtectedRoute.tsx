'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard if role doesn't match
        if (userRole === 'student') {
          router.push('/dashboard/student');
        } else if (userRole === 'employer') {
          router.push('/dashboard/employer');
        } else if (userRole === 'tpo') {
          router.push('/dashboard/tpo');
        } else if (userRole === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, loading, router, userRole, allowedRoles]);

  // Show loading or nothing while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If role restrictions exist, check if user has permission
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
