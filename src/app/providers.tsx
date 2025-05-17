'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ClientOnly from '@/components/ClientOnly';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        {children}
      </AuthProvider>
    </ClientOnly>
  );
}
