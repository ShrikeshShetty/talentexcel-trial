'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, User, Settings, LogOut, SwitchCamera, LogIn } from 'lucide-react';

export default function UserMenu() {
  const { user, userRole, signOut, signOutAllAccounts, linkedAccounts } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/login');
  };

  const handleSignOutAll = async () => {
    await signOutAllAccounts();
    setIsOpen(false);
    router.push('/login');
  };

  const hasLinkedAccounts = linkedAccounts.length > 1;

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{user?.email ? user.email[0].toUpperCase() : 'U'}</span>
            )}
          </div>          <span className="hidden md:block ml-2 text-sm text-gray-700">
            {user?.user_metadata?.full_name || user?.email}
          </span>
          <ChevronDown 
            className={`hidden md:block ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="px-4 py-2 border-b border-gray-100">            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
          
          {userRole && (
            <Link
              href={`/dashboard/${userRole}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </div>
            </Link>
          )}
          
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </div>
          </Link>

          <Link
            href="/switch-account"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center">
              <SwitchCamera className="h-4 w-4 mr-2" />
              Switch Account
            </div>
          </Link>
          
          <button
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </div>
          </button>

          {hasLinkedAccounts && (
            <button
              onClick={handleSignOutAll}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100"
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out All Accounts
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
