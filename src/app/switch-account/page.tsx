'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, LogOut, User } from 'lucide-react';

export default function SwitchAccount() {
  const { user, userRole, linkedAccounts, switchAccount, signOut, addLinkedAccount } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleAccountSwitch = async (email: string) => {
    if (isLoading || email === user?.email) return;

    try {
      setIsLoading(email);
      // The routing is now handled inside switchAccount
      await switchAccount(email);
    } catch (error) {
      console.error('Error switching account:', error);
      setIsLoading(null);
    }
  };

  const handleAddAccount = async () => {
    if (isLoading) return;

    try {
      setIsLoading('add');
      await addLinkedAccount();
    } catch (error) {
      console.error('Error adding account:', error);
      setIsLoading(null);
    }
  };

  const handleSignOut = async () => {
    if (isLoading) return;

    try {
      setIsLoading('signout');
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(null);
    }
  };

  if (!user) return null;  // Get home path - always redirects to main homepage
  const getHomePath = () => {
    return '/';  // Main homepage for all users
  };

  // Filter out other accounts (excluding current user)
  const otherAccounts = linkedAccounts.filter(account => account.email !== user.email);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-sm mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">              <Link 
                href={getHomePath()}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-medium text-gray-900">
                Account settings
              </h1>
            </div>
          </div>

          {/* Current Account */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-500 mb-3">Google Account</p>
            <div className="flex items-center space-x-3 p-2">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">{user.email?.[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Other Accounts Section */}
          {otherAccounts.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-3">Other accounts</p>
              <div className="space-y-2">
                {otherAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSwitch(account.email)}
                    disabled={!!isLoading}
                    className={`w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors ${
                      isLoading === account.email ? 'opacity-50 cursor-wait' : 
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                      {account.avatar_url ? (
                        <img 
                          src={account.avatar_url} 
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium">{account.email[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {account.full_name || account.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{account.email}</p>
                    </div>
                    {isLoading === account.email && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"/>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions Section */}
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={handleAddAccount}
              disabled={!!isLoading}
              className={`w-full flex items-center px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="h-5 w-5 mr-3 text-gray-500" />
              <span>Add another account</span>
              {isLoading === 'add' && (
                <div className="animate-spin ml-2 rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"/>
              )}            </button>            <Link
              href="/dashboard/profile"
              className={`w-full flex items-center px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
                isLoading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <User className="h-5 w-5 mr-3 text-gray-500" />
              <span>Manage your Account</span>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={!!isLoading}
              className={`w-full flex items-center px-2 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-500" />
              <span>Sign out</span>
              {isLoading === 'signout' && (
                <div className="animate-spin ml-2 rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"/>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
