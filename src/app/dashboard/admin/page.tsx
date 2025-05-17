'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import { Users, Briefcase, Building, AlertTriangle, BarChart2, UserPlus, Settings } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface JobListing {
  id: string;
  title: string;
  employer: {
    company_name: string;
  };
  status: string;
  created_at: string;
}

// Interface to match the raw data structure from Supabase
interface RawJobListing {
  id: string;
  title: string;
  status: string;
  created_at: string;
  employer: any; // This could be an object or an array depending on the query result
}

export default function Page() {
  const { user, loading } = useAuth();
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalEmployers: 0,
    totalTPOs: 0,
    totalJobs: 0,
    totalApplications: 0
  });

  useEffect(() => {
    if (!loading && user) {
      fetchAdminData();
    }
  }, [user, loading]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch recent users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        setRecentUsers(usersData || []);
      }

      // Fetch recent job listings
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          status,
          created_at,
          employer:employer_id(company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) {
        console.error('Error fetching job listings:', jobsError);
      } else {
        // Transform the data to match the JobListing interface
        const formattedJobs = (jobsData as RawJobListing[] || []).map(job => {
          // For debugging purposes
          console.log('Job data structure:', job);
          
          // Create a properly typed job listing object
          const formattedJob: JobListing = {
            id: job.id,
            title: job.title,
            status: job.status,
            created_at: job.created_at,
            employer: {
              company_name: typeof job.employer === 'object' && job.employer !== null
                ? (job.employer.company_name || 'Unknown')
                : 'Unknown'
            }
          };
          
          return formattedJob;
        });
        
        setRecentJobs(formattedJobs);
      }

      // Fetch stats
      const { count: totalUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      const { count: totalStudents } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student');

      const { count: totalEmployers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'employer');

      const { count: totalTPOs } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'tpo');

      const { count: totalJobs } = await supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true });

      const { count: totalApplications } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalEmployers: totalEmployers || 0,
        totalTPOs: totalTPOs || 0,
        totalJobs: totalJobs || 0,
        totalApplications: totalApplications || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'employer':
        return 'bg-purple-100 text-purple-800';
      case 'tpo':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <Link href="/dashboard/admin/settings" className="btn-outline flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
          <Link href="/dashboard/admin/reports" className="btn-primary flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Reports
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalUsers}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <span className="text-gray-500">Students:</span>
                <span className="ml-1 font-medium text-gray-900">{stats.totalStudents}</span>
              </div>
              <div>
                <span className="text-gray-500">Employers:</span>
                <span className="ml-1 font-medium text-gray-900">{stats.totalEmployers}</span>
              </div>
              <div>
                <span className="text-gray-500">TPOs:</span>
                <span className="ml-1 font-medium text-gray-900">{stats.totalTPOs}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <Briefcase className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalJobs}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalApplications}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Users</h3>
            <Link href="/dashboard/admin/users/new" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
              <UserPlus className="h-4 w-4 mr-1" />
              Add User
            </Link>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentUsers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentUsers.map((user) => (
                  <li key={user.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined on {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getRoleBadgeColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        <Link 
                          href={`/dashboard/admin/users/${user.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
          {recentUsers.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/admin/users" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all users
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Job Listings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Job Listings</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentJobs.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentJobs.map((job) => (
                  <li key={job.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {job.employer.company_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Posted on {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusBadgeColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                        <Link 
                          href={`/dashboard/admin/jobs/${job.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No job listings found</p>
              </div>
            )}
          </div>
          {recentJobs.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/admin/jobs" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all job listings
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">System Alerts</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This is a demo admin dashboard. In a production environment, this section would display important system alerts and notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">System Status</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    All systems are operational. Database and API services are running normally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link href="/dashboard/admin/users" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true"></span>
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500">View and manage all users</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/jobs" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
              <div className="flex-shrink-0">
                <Briefcase className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true"></span>
                <p className="text-sm font-medium text-gray-900">Manage Jobs</p>
                <p className="text-sm text-gray-500">View and manage job listings</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/settings" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true"></span>
                <p className="text-sm font-medium text-gray-900">System Settings</p>
                <p className="text-sm text-gray-500">Configure system settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
