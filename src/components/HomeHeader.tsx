'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from './UserMenu';

export default function HomeHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-primary-600">TalentExcel</h1>
        </div>
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium">
            Home
          </Link>
          <Link href="/jobs" className="text-gray-700 hover:text-primary-600 font-medium">
            Jobs
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-primary-600 font-medium">
            Contact
          </Link>
        </nav>
        <div className="flex space-x-4">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login" className="btn-outline">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
