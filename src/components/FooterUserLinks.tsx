'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function FooterUserLinks() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <h4 className="font-semibold mb-4">For Users</h4>
      <ul className="space-y-2">
        {isAuthenticated ? (
          <>
            <li><Link href="/profile" className="text-gray-400 hover:text-white">My Profile</Link></li>
            <li><Link href="/settings" className="text-gray-400 hover:text-white">Settings</Link></li>
          </>
        ) : (
          <>
            <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
            <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
          </>
        )}
      </ul>
    </div>
  );
}
