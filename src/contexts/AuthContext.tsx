'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

type UserRole = 'student' | 'employer' | 'tpo' | 'admin' | 'super_admin' | null;

interface LinkedAccount {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  refresh_token?: string;
  access_token?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  signOutAllAccounts: () => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  linkedAccounts: LinkedAccount[];
  addLinkedAccount: () => Promise<void>;
  switchAccount: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const router = useRouter();

  // Load linked accounts specific to the current user
  useEffect(() => {
    const loadLinkedAccounts = async () => {
      if (user?.id && session) {
        // Create current account object with all metadata
        const currentAccount = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user_metadata: user.user_metadata
        };
        
        // Get user-specific linked accounts
        const userLinkedAccountsKey = `linkedAccounts_${user.id}`;
        const savedLinkedAccounts = localStorage.getItem(userLinkedAccountsKey);
        let accountsList: LinkedAccount[] = [];

        if (savedLinkedAccounts) {
          try {
            accountsList = JSON.parse(savedLinkedAccounts);
            // Update current account's tokens in the list
            accountsList = accountsList.map(acc => 
              acc.id === currentAccount.id ? currentAccount : acc
            );
          } catch (error) {
            console.error('Error parsing linked accounts:', error);
            accountsList = [currentAccount];
          }
        } else {
          // First time - initialize with just the current account
          accountsList = [currentAccount];
        }

        // Make sure current account is in the list
        if (!accountsList.some(acc => acc.id === currentAccount.id)) {
          accountsList.push(currentAccount);
        }

        // Store only for the current user
        localStorage.setItem(userLinkedAccountsKey, JSON.stringify(accountsList));
        setLinkedAccounts(accountsList);
      } else {
        // If no user is logged in, clear the state
        setLinkedAccounts([]);
      }
    };

    loadLinkedAccounts();
  }, [user?.id, session]);

  // Handle auth state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    // Initial session fetch and setup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data.role as UserRole);
    } catch (error) {
      console.error('Error in fetch user role:', error);
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName: string) => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            fullName
          },
          emailRedirectTo: `${window.location.origin}/verify-otp`
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData?.user) {
        localStorage.setItem('registration_data', JSON.stringify({
          email,
          password,
          role,
          fullName,
          userId: signUpData.user.id
        }));

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false
          }
        });

        if (otpError) throw otpError;

        toast.success('Please check your email for the verification code');
        router.push('/verify-otp');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign up');
      console.error('Error signing up:', error);
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      if (data?.user) {
        const registrationData = JSON.parse(localStorage.getItem('registration_data') || '{}');

        const { error: profileError } = await supabase
          .from('users')
          .insert([{ 
            id: registrationData.userId, 
            email, 
            role: registrationData.role,
            full_name: registrationData.fullName,
            profile_completed: false
          }]);

        if (profileError) throw profileError;

        localStorage.removeItem('registration_data');

        toast.success('Account created successfully!');
        router.push('/onboarding');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP');
      console.error('Error verifying OTP:', error);
      return false;
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (emailError) throw emailError;

      toast.success('A new verification code has been sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification code');
      console.error('Error resending OTP:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const isLinkingAccount = localStorage.getItem('isLinkingAccount') === 'true';
      const previousAccountData = isLinkingAccount ? JSON.parse(localStorage.getItem('previousAccountData') || '{}') : null;
      const previousLinkedAccounts = isLinkingAccount ? JSON.parse(localStorage.getItem('previousLinkedAccounts') || '[]') : [];

      // First check if the user exists
      const { data: { user: existingUser }, error: userError } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      if (data.user) {
        // Fetch user role and validate user exists in users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          throw new Error('Account not found. Please sign up first.');
        }

        setUserRole(userData.role as UserRole);
        
        // Create current account object
        const currentAccount = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || '',
          avatar_url: data.user.user_metadata?.avatar_url,
          access_token: data.session!.access_token,
          refresh_token: data.session!.refresh_token
        };

        // Check if we are linking a new account
        if (isLinkingAccount && previousAccountData?.id && previousAccountData.id !== data.user.id) {
          // Check if account is already linked
          if (previousLinkedAccounts.some(acc => acc.id === data.user.id)) {
            throw new Error('This account is already linked');
          }
          
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
          
          // Switch back to the original account
          await switchAccount(previousAccountData.email);
          return;
        }
        
        // Regular sign in - restore or initialize linked accounts
        const userLinkedAccountsKey = `linkedAccounts_${data.user.id}`;
        const savedAccounts = localStorage.getItem(userLinkedAccountsKey);
        let accountsList: LinkedAccount[] = [];
        
        if (savedAccounts) {
          try {
            accountsList = JSON.parse(savedAccounts);
            // Update current account's tokens in the saved list
            accountsList = accountsList.map(acc => 
              acc.id === currentAccount.id ? currentAccount : acc
            );
          } catch (e) {
            console.error('Error parsing saved accounts:', e);
            accountsList = [currentAccount];
          }
        } else {
          // First time login - initialize with just this account
          accountsList = [currentAccount];
        }
        
        // Make sure the current account is in the list
        if (!accountsList.some(acc => acc.id === currentAccount.id)) {
          accountsList.push(currentAccount);
        }        setLinkedAccounts(accountsList);
        localStorage.setItem(userLinkedAccountsKey, JSON.stringify(accountsList));
        
        toast.success('Signed in successfully!');
        
        // Special case for super admin - direct to dashboard, others to homepage
        if (userData.role === 'super_admin') {
          router.push('/superadmin/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (error: any) {
      if (error.message === 'Account not found. Please sign up first.') {
        toast.error(error.message);
        router.push('/register');
      } else if (error.message === 'This account is already linked') {
        localStorage.removeItem('isLinkingAccount');
        localStorage.removeItem('previousAccountData');
        localStorage.removeItem('previousLinkedAccounts');
        toast.error(error.message);
        router.push('/switch-account');
      } else {
        toast.error(error.message || 'An error occurred during sign in');
        console.error('Error signing in:', error);
      }
    }
  };

  const signOut = async () => {
    try {
      // Get the current user's ID and linked accounts before signing out
      const currentUserId = user?.id;
      const currentUserEmail = user?.email;
      const currentLinkedAccounts = [...linkedAccounts];

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUserRole(null);
      setLinkedAccounts([]);
      
      if (currentUserId && currentUserEmail) {
        // Update linked accounts lists for all other accounts by removing the current account
        currentLinkedAccounts.forEach(account => {
          if (account.email !== currentUserEmail) {
            const otherAccountKey = `linkedAccounts_${account.id}`;
            const otherAccountData = localStorage.getItem(otherAccountKey);
            if (otherAccountData) {
              try {
                const otherAccountList = JSON.parse(otherAccountData);
                // Remove current account from other account's list
                const updatedList = otherAccountList.filter((acc: LinkedAccount) => acc.id !== currentUserId);
                if (updatedList.length > 0) {
                  localStorage.setItem(otherAccountKey, JSON.stringify(updatedList));
                } else {
                  localStorage.removeItem(otherAccountKey);
                }
              } catch (e) {
                console.error('Error updating linked accounts:', e);
              }
            }
          }
        });

        // Remove current user's linked accounts storage
        localStorage.removeItem(`linkedAccounts_${currentUserId}`);
      }
      
      router.push('/');
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign out');
      console.error('Error signing out:', error);
    }
  };

  const signOutAllAccounts = async () => {
    try {
      // Get all linked accounts before signing out
      const allAccounts = [...linkedAccounts];
      const currentUserId = user?.id;

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUserRole(null);
      setLinkedAccounts([]);

      // Clean up linked accounts data for all accounts
      allAccounts.forEach(account => {
        localStorage.removeItem(`linkedAccounts_${account.id}`);
      });

      router.push('/');
      toast.success('Signed out from all accounts successfully');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign out');
      console.error('Error signing out from all accounts:', error);
    }
  };

  const addLinkedAccount = async () => {
    try {
      if (!user?.id || !session) {
        throw new Error('No user logged in');
      }

      const currentUserAccount = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url,
        access_token: session.access_token,
        refresh_token: session.refresh_token
      };

      // Store current session info
      localStorage.setItem('isLinkingAccount', 'true');
      localStorage.setItem('previousAccountData', JSON.stringify(currentUserAccount));
      localStorage.setItem('previousLinkedAccounts', JSON.stringify(linkedAccounts));

      // Redirect to login
      router.push('/login');
    } catch (error: any) {
      console.error('Error preparing to add account:', error);
      toast.error('Failed to prepare account linking');
    }
  };

  const switchAccount = async (email: string) => {
    try {
      const account = linkedAccounts.find(acc => acc.email === email);
      if (!account) {
        throw new Error('Account not found');
      }

      // Try to set the session with stored tokens
      let { data: { session: newSession }, error } = await supabase.auth.setSession({
        access_token: account.access_token!,
        refresh_token: account.refresh_token!
      });

      // If setting session fails, try refreshing the token
      if (error) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: account.refresh_token!
        });

        if (refreshError) {
          // Session is invalid, remove this account from linked accounts
          const currentUserId = user?.id;
          if (currentUserId) {
            const updatedAccounts = linkedAccounts.filter(acc => acc.email !== email);
            localStorage.setItem(`linkedAccounts_${currentUserId}`, JSON.stringify(updatedAccounts));
            setLinkedAccounts(updatedAccounts);
          }
          throw new Error('Session expired. Please log in again.');
        }

        newSession = refreshData.session;
      }

      if (!newSession) throw new Error('Failed to restore session');

      // Validate the account still exists and get its role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', newSession.user.id)
        .single();

      if (userError) {
        throw new Error('Account no longer exists');
      }

      // Update the account tokens with the new session
      const updatedAccount = {
        ...account,
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token
      };

      // Load or initialize linked accounts list
      const targetUserLinkedAccountsKey = `linkedAccounts_${newSession.user.id}`;
      const savedTargetAccounts = localStorage.getItem(targetUserLinkedAccountsKey);
      let targetAccountsList: LinkedAccount[] = [];

      if (savedTargetAccounts) {
        try {
          targetAccountsList = JSON.parse(savedTargetAccounts);
          // Update the tokens for the current account
          targetAccountsList = targetAccountsList.map(acc => 
            acc.id === updatedAccount.id ? updatedAccount : acc
          );
        } catch (e) {
          targetAccountsList = [updatedAccount];
        }
      } else {
        targetAccountsList = [updatedAccount];
      }

      // Ensure current account is in the list
      if (!targetAccountsList.some(acc => acc.id === updatedAccount.id)) {
        targetAccountsList.push(updatedAccount);
      }

      // Update storage and state
      localStorage.setItem(targetUserLinkedAccountsKey, JSON.stringify(targetAccountsList));
      setLinkedAccounts(targetAccountsList);

      // Update auth context state
      setSession(newSession);
      setUser(newSession.user);
      setUserRole(userData.role as UserRole);

      // Route to role-specific dashboard
      let dashboardPath = '/dashboard';
      switch (userData.role) {
        case 'student':
          dashboardPath = '/dashboard/student';
          break;
        case 'employer':
          dashboardPath = '/dashboard/employer';
          break;
        case 'tpo':
          dashboardPath = '/dashboard/tpo';
          break;
        case 'admin':
          dashboardPath = '/dashboard/admin';
          break;
        case 'super_admin':
          dashboardPath = '/superadmin/dashboard';
          break;
      }

      toast.success('Switched account successfully!');
      router.push(dashboardPath);
    } catch (error: any) {
      console.error('Error switching account:', error);
      toast.error(error.message || 'Failed to switch account');
      
      if (error.message.includes('expired') || error.message.includes('no longer exists')) {
        router.push('/login');
      }
    }
  };

  const handleOAuthSignIn = async (session: Session) => {
    if (!session?.user) return;

    const isLinkingAccount = localStorage.getItem('isLinkingAccount') === 'true';
    const previousAccountData = isLinkingAccount ? JSON.parse(localStorage.getItem('previousAccountData') || '{}') : null;
    const previousLinkedAccounts = isLinkingAccount ? JSON.parse(localStorage.getItem('previousLinkedAccounts') || '[]') : [];

    // Fetch user role and validate user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      // New OAuth user, needs to complete profile
      router.push('/auth/complete-profile');
      return;
    }

    setUserRole(userData.role as UserRole);
    
    // Create current account object
    const currentAccount = {
      id: session.user.id,
      email: session.user.email!,
      full_name: session.user.user_metadata?.full_name || '',
      avatar_url: session.user.user_metadata?.avatar_url,
      access_token: session.access_token,
      refresh_token: session.refresh_token
    };

    // Check if we are linking a new account
    if (isLinkingAccount && previousAccountData?.id && previousAccountData.id !== session.user.id) {
      // Check if account is already linked
      if (previousLinkedAccounts.some(acc => acc.id === session.user.id)) {
        throw new Error('This account is already linked');
      }
      
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
      
      // Switch back to the original account
      await switchAccount(previousAccountData.email);
      return;
    }

    // Regular sign in - restore or initialize linked accounts
    const userLinkedAccountsKey = `linkedAccounts_${session.user.id}`;
    const savedAccounts = localStorage.getItem(userLinkedAccountsKey);
    let accountsList: LinkedAccount[] = [];
    
    if (savedAccounts) {
      try {
        accountsList = JSON.parse(savedAccounts);
        // Update current account's tokens in the saved list
        accountsList = accountsList.map(acc => 
          acc.id === currentAccount.id ? currentAccount : acc
        );
      } catch (e) {
        console.error('Error parsing saved accounts:', e);
        accountsList = [currentAccount];
      }
    } else {
      // First time login - initialize with just this account
      accountsList = [currentAccount];
    }
    
    // Make sure the current account is in the list
    if (!accountsList.some(acc => acc.id === currentAccount.id)) {
      accountsList.push(currentAccount);
    }
    
    setLinkedAccounts(accountsList);
    localStorage.setItem(userLinkedAccountsKey, JSON.stringify(accountsList));      toast.success('Signed in successfully!');
      // Special case for super admin - direct to dashboard, others to homepage
      if (userData.role === 'super_admin') {
        router.push('/superadmin/dashboard');
      } else {
        router.push('/');
      }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      // The actual sign-in handling will be done in the callback page
      // which will call handleOAuthSignIn with the session
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during Google sign in');
      console.error('Error signing in with Google:', error);
    }
  };

  const signInWithGithub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email'
        }
      });

      if (error) throw error;

      // The actual sign-in handling will be done in the callback page
      // which will call handleOAuthSignIn with the session
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during GitHub sign in');
      console.error('Error signing in with GitHub:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        signOutAllAccounts,
        verifyOTP,
        resendOTP,
        isAuthenticated: !!user,
        linkedAccounts,
        addLinkedAccount,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider };
export type { AuthContextType, UserRole, LinkedAccount };
