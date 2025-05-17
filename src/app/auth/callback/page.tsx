'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get the current session after OAuth redirect
        const { data: authData } = await supabase.auth.getSession();
        const session = authData?.session;

        if (!session?.user) {
          console.error('No session after OAuth redirect');
          toast.error('Failed to complete sign in');
          router.push('/login');
          return;
        }

        // Check if we're in account linking mode
        const isLinkingAccount = localStorage.getItem('isLinkingAccount') === 'true';
        const previousAccountData = isLinkingAccount ? JSON.parse(localStorage.getItem('previousAccountData') || '{}') : null;
        const previousLinkedAccounts = isLinkingAccount ? JSON.parse(localStorage.getItem('previousLinkedAccounts') || '[]') : [];

        // Check if user exists in users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, role, profile_completed')
          .eq('id', session.user.id)
          .maybeSingle();

        // If there's an error other than "not found"
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking user:', fetchError);
          toast.error('An error occurred during sign in');
          router.push('/login');
          return;
        }

        // Handle linking case first
        if (isLinkingAccount && existingUser && previousAccountData?.id) {
          // Check if account is already linked
          if (previousLinkedAccounts.some(acc => acc.id === session.user.id)) {
            toast.error('This account is already linked');
            router.push('/switch-account');
            return;
          }

          // Create current account object
          const currentAccount = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            avatar_url: session.user.user_metadata?.avatar_url,
            access_token: session.access_token,
            refresh_token: session.refresh_token
          };

          // Create linked accounts lists for both users
          const linkedAccountsList = [
            ...previousLinkedAccounts.filter(acc => acc.id !== currentAccount.id),
            currentAccount // Add current account to previous user's list
          ];

          const currentUserLinkedAccounts = [
            currentAccount, // Current account should be first in its own list
            ...previousLinkedAccounts.filter(acc => acc.id === previousAccountData.id) // Add only the original account
          ];
          
          // Store for both users
          localStorage.setItem(`linkedAccounts_${previousAccountData.id}`, JSON.stringify(linkedAccountsList));
          localStorage.setItem(`linkedAccounts_${currentAccount.id}`, JSON.stringify(currentUserLinkedAccounts));
          
          // Clean up linking data
          localStorage.removeItem('isLinkingAccount');
          localStorage.removeItem('previousAccountData');
          localStorage.removeItem('previousLinkedAccounts');
          
          toast.success('Account linked successfully!');

          // Try to switch back to the original account
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: previousAccountData.access_token,
              refresh_token: previousAccountData.refresh_token
            });

            if (error || !data.session) {
              throw error || new Error('Failed to restore previous session');
            }

            router.push('/switch-account');
            return;
          } catch (error) {
            console.error('Error switching back to original account:', error);
            router.push('/login');
            return;
          }
        }

        // Normal OAuth sign in flow
        if (!existingUser) {
          // New user - store data temporarily and redirect to complete profile
          const tempUserData = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata.full_name || session.user.user_metadata.name || '',
            avatar_url: session.user.user_metadata.avatar_url,
            oauth_provider: session.user.app_metadata.provider
          };
          localStorage.removeItem('tempUserData');
          localStorage.setItem('tempUserData', JSON.stringify(tempUserData));
          router.push('/auth/complete-profile');
          return;
        }

        // Existing user - check profile status
        if (!existingUser.role) {
          router.push('/auth/complete-profile');
        } else if (!existingUser.profile_completed) {
          router.push('/onboarding');        } else {
          // Special case for super admin - direct to dashboard, others to homepage
          if (existingUser.role === 'super_admin') {
            router.push('/superadmin/dashboard');
          } else {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast.error('An error occurred during sign in');
        router.push('/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}
