'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, User, Briefcase, Building, Bell, LogOut, Home, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Redirect users to their appropriate dashboard based on role
    if (!user) {
      router.push('/login');
      return;
    }

    if (pathname === '/dashboard') {
      switch (userRole) {
        case 'student':
          router.push('/dashboard/student');
          break;
        case 'employer':
          router.push('/dashboard/employer');
          break;
        case 'tpo':
          router.push('/dashboard/tpo');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/login');
      }
    }
  }, [user, userRole, pathname, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Define navigation items based on user role
  const navigation = [
    ...(userRole === 'student' ? [
      { name: 'Dashboard', href: '/dashboard/student', icon: User },
      { name: 'Job Listings', href: '/jobs', icon: Briefcase },
      { name: 'Applications', href: '/dashboard/student/applications', icon: Building },
    ] : []),
    ...(userRole === 'employer' ? [
      { name: 'Dashboard', href: '/dashboard/employer', icon: Building },
      { name: 'Post Job', href: '/dashboard/employer/post-job', icon: Briefcase },
      { name: 'Applications', href: '/dashboard/employer/applications', icon: User },
    ] : []),
    ...(userRole === 'tpo' ? [
      { name: 'Dashboard', href: '/dashboard/tpo', icon: Building },
      { name: 'Students', href: '/dashboard/tpo/students', icon: User },
      { name: 'Employers', href: '/dashboard/tpo/employers', icon: Briefcase },
      { name: 'Placements', href: '/dashboard/tpo/placements', icon: Building },
    ] : []),
    ...(userRole === 'admin' ? [
      { name: 'Dashboard', href: '/dashboard/admin', icon: Building },
      { name: 'Users', href: '/dashboard/admin/users', icon: User },
      { name: 'Jobs', href: '/dashboard/admin/jobs', icon: Briefcase },
    ] : []),
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200'
          }`}
          onClick={closeSidebar}
        ></div>

        {/* Mobile sidebar */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white transition transform ${
          sidebarOpen ? 'translate-x-0 ease-out duration-300' : '-translate-x-full ease-in duration-200'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={closeSidebar}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-primary-600">TalentExcel</h1>
          </div>

          {/* Navigation */}
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={closeSidebar}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sign out button */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={() => {
                signOut();
                closeSidebar();
              }}
              className="flex items-center w-full px-2 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-4 h-6 w-6" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-primary-600">TalentExcel</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sign out button */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={signOut}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-6 w-6" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm mb-4">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" />
              </button>

              {/* Home link */}
              <Link
                href="/"
                className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 focus:outline-none transition-colors rounded-md"
              >
                <Home className="h-5 w-5 mr-2" />
                Return to Home
              </Link>
            </div>            {/* User info and profile dropdown */}
            <div className="flex items-center">              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center focus:outline-none"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setSidebarOpen(false); // Close mobile sidebar if open
                  }}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white overflow-hidden">                      {user?.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{user?.email ? user.email[0].toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <span className="hidden md:block ml-2 text-sm text-gray-700">
                      {user?.user_metadata?.full_name || user?.email}
                    </span>
                    <svg
                      className={`hidden md:block ml-2 h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                        profileDropdownOpen ? 'rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>
                
                {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/${userRole}/profile`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </div>
                    </Link>
                    <Link
                      href={`/dashboard/${userRole}/profile/edit`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Update Profile
                      </div>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}