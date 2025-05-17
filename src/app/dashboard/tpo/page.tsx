'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import { Users, Briefcase, Building, BarChart2 } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface Employer {
  id: string;
  company_name: string;
  industry: string;
  created_at: string;
}

export default function Page() {
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    totalEmployers: 0,
    activeJobs: 0
  });

  useEffect(() => {
    if (!loading && user) {
      fetchTPOData();
    }
  }, [user, loading]);

  const fetchTPOData = async () => {
    setIsLoading(true);
    try {
      // Fetch TPO institution data
      const { data: tpoData, error: tpoError } = await supabase
        .from('tpo_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (tpoError && tpoError.code !== 'PGRST116') {
        console.error('Error fetching TPO profile:', tpoError);
        return;
      }

      // Fetch students from the institution
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select(`
          id,
          user:user_id (
            full_name,
            email,
            created_at
          ),
          status,
          college
        `)
        .eq('college', tpoData?.institute_name)
        .order('created_at', { ascending: false })
        .limit(5);

      if (studentsError) throw studentsError;

      // Fetch employers who have posted jobs
      const { data: employersData, error: employersError } = await supabase
        .from('employer_profiles')
        .select(`
          id,
          company_name,
          industry,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (employersError) throw employersError;

      // Fetch statistics
      const [
        { count: totalStudents },
        { count: placedStudents },
        { count: totalEmployers },
        { count: activeJobs }
      ] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('college', tpoData?.institute_name),
        supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('college', tpoData?.institute_name)
          .eq('status', 'placed'),
        supabase
          .from('employer_profiles')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      setStats({
        totalStudents: totalStudents || 0,
        placedStudents: placedStudents || 0,
        totalEmployers: totalEmployers || 0,
        activeJobs: activeJobs || 0
      });

      setStudents(
        studentsData?.map((item: any) => ({
          id: item.id,
          full_name: item.user?.full_name || '',
          email: item.user?.email || '',
          status: item.status || 'active',
          created_at: item.user?.created_at || ''
        })) || []
      );

      setEmployers(employersData || []);

    } catch (error) {
      console.error('Error fetching TPO dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart2 className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Placed Students</p>
              <p className="text-2xl font-bold">{stats.placedStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Employers</p>
              <p className="text-2xl font-bold">{stats.totalEmployers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Students</h2>
        </div>
        <div className="p-6">
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.status === 'placed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No students found</p>
          )}
          <div className="mt-4">
            <Link
              href="/dashboard/tpo/students"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View all students →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Employers */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Employers</h2>
        </div>
        <div className="p-6">
          {employers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employers.map((employer) => (
                    <tr key={employer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employer.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employer.industry}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No employers found</p>
          )}
          <div className="mt-4">
            <Link
              href="/dashboard/tpo/employers"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View all employers →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}