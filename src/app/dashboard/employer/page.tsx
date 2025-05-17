'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import { Briefcase, Users, Clock, AlertCircle, PlusCircle } from 'lucide-react';

interface JobListing {
  id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  applications_count: number;
  created_at: string;
}

interface JobListingResponse{
  id: any;
  title: any;
  location: any;
  type: any;
  status: any;
  created_at: any;
  applications_count: { count: number }[];
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  student: {
    full_name: string;
    email: string;
  };
  job: {
    title: string;
  };
  full_name: string;
  email: string;
  title: string;
}

interface ApplicationResponse {
  id: any;
  status: any;
  created_at: any;
  student: {
    full_name: any;
    email: any;
  }[];
  job: {
    title: any;
  }[];
}

export default function Page() {
  const { user, loading } = useAuth();
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });

  useEffect(() => {
    if (!loading && user) {
      fetchEmployerData();
    }
  }, [user, loading]);

  const fetchEmployerData = async () => {
    setIsLoading(true);
    try {
      // Fetch employer profile
      const { data: profileData, error: profileError } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching employer profile:', profileError);
      } else {
        setEmployerProfile(profileData);
      }

      // Fetch job listings
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          location,
          type,
          status,
          created_at,
          applications_count:applications(count)
        `)
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) {
        console.error('Error fetching job listings:', jobsError);
      } else {
        // Transform the data to match the JobListing interface
        const transformedData = (jobsData || []).map((job: JobListingResponse) => ({
          ...job,
          applications_count: job.applications_count && job.applications_count.length > 0 
            ? job.applications_count[0].count 
            : 0
        }));
        setJobListings(transformedData);
      }

      // Fetch recent applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          student:student_id(
            full_name,
            email
          ),
          job:job_id(
            title
          )
        `)
        .in('job_id', jobsData?.map(job => job.id) || [])
        .order('created_at', { ascending: false })
        .limit(5);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
      } else {
        // Transform the data to match the Application interface
        const transformedApplications = (applicationsData || []).map((app: ApplicationResponse) => ({
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          student: app.student && app.student.length > 0 ? {
            full_name: app.student[0].full_name,
            email: app.student[0].email
          } : { full_name: '', email: '' },
          full_name: app.student && app.student.length > 0 ? app.student[0].full_name : '',
          email: app.student && app.student.length > 0 ? app.student[0].email : '',
          job: app.job && app.job.length > 0 ? {
            title: app.job[0].title
          } : { title: '' },
          title: app.job && app.job.length > 0 ? app.job[0].title : ''
        }));
        setRecentApplications(transformedApplications);
      }

      // Fetch stats
      const { count: totalJobs } = await supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true })
        .eq('employer_id', user?.id);

      const { count: activeJobs } = await supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true })
        .eq('employer_id', user?.id)
        .eq('status', 'published');

      const { count: totalApplications } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('job_id', jobsData?.map(job => job.id) || []);

      const { count: pendingApplications } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('job_id', jobsData?.map(job => job.id) || [])
        .eq('status', 'pending');

      setStats({
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        totalApplications: totalApplications || 0,
        pendingApplications: pendingApplications || 0
      });

    } catch (error) {
      console.error('Error fetching employer data:', error);
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
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
        <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
        <Link href="/dashboard/employer/post-job" className="btn-primary flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" />
          Post New Job
        </Link>
      </div>

      {/* Profile Completion Alert */}
      {!employerProfile && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your company profile is incomplete. 
                <Link href="/onboarding" className="font-medium text-yellow-700 underline">
                  Complete your profile
                </Link> to post jobs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Briefcase className="h-6 w-6 text-primary-600" />
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
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.activeJobs}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <Users className="h-6 w-6 text-blue-600" />
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Applications</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.pendingApplications}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Job Listings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Job Listings</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {jobListings.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {jobListings.map((job) => (
                  <li key={job.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {job.location} • {job.type}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(job.created_at).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <Users className="h-4 w-4 mr-1" />
                          {job.applications_count} applications
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No job listings yet</p>
                <Link href="/dashboard/employer/post-job" className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
                  Post your first job
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
          {jobListings.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/employer/jobs" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all job listings
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Applications</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentApplications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentApplications.map((application) => (
                  <li key={application.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {application.student.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {application.job.title}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No applications yet</p>
                <p className="mt-2 text-sm text-gray-500">
                  Applications will appear here when candidates apply to your job listings
                </p>
              </div>
            )}
          </div>
          {recentApplications.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/employer/applications" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all applications
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Company Profile Summary */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Company Profile</h3>
        </div>
        {employerProfile ? (
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{employerProfile.company_name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Industry</dt>
                <dd className="mt-1 text-sm text-gray-900">{employerProfile.industry || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{employerProfile.company_size || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {employerProfile.website ? (
                    <a href={employerProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                      {employerProfile.website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {employerProfile.description || 'No company description provided'}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <Link href="/dashboard/employer/profile" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Edit Company Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-4">
              <p className="text-gray-500">Complete your company profile to attract better candidates</p>
              <Link href="/onboarding" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Complete Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
