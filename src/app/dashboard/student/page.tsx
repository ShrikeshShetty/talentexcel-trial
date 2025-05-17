'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import { Briefcase, Clock, CheckCircle, AlertCircle, Calendar, MapPin } from 'lucide-react';

interface JobApplication {
  id: string;
  job: {
    title: string;
    employer: {
      company_name: string;
    };
  };
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  created_at: string;
}

interface JobApplicationResponse {
  id: any;
  status: any;
  created_at: any;
  job: {
    title: any;
    employer: {
      company_name: any;
    }[];
  }[];
}

interface SavedJob {
  id: string;
  job: {
    id: string;
    title: string;
    employer: {
      company_name: string;
    };
    location: string;
    type: string;
    created_at: string;
  };
}

interface SavedJobResponse {
  id: any;
  job: {
    id: any;
    title: any;
    location: any;
    type: any;
    created_at: any;
    employer: {
      company_name: any;
    }[];
  }[];
}

export default function Page() {
  const { user, loading } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user) {
      fetchStudentData();
    }
  }, [user, loading]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching student profile:', profileError);
      } else {
        setStudentProfile(profileData);
      }
      
      // Fetch upcoming events
      const now = new Date().toISOString();
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(3);
        
      if (eventsError) {
        console.error('Error fetching upcoming events:', eventsError);
      } else {
        setUpcomingEvents(eventsData || []);
      }

      // Fetch recent applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job:job_id (
            title,
            employer:employer_id (
              company_name
            )
          )
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
      } else {
        // Transform the data to match the JobApplication interface
        const transformedApplications = (applicationsData || []).map((app: JobApplicationResponse) => ({
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          job: {
            title: app.job && app.job.length > 0 ? app.job[0].title : '',
            employer: {
              company_name: app.job && app.job.length > 0 && app.job[0].employer && app.job[0].employer.length > 0 
                ? app.job[0].employer[0].company_name 
                : ''
            }
          }
        }));
        setApplications(transformedApplications);
      }

      // Fetch saved jobs
      const { data: savedJobsData, error: savedJobsError } = await supabase
        .from('saved_jobs')
        .select(`
          id,
          job:job_id (
            id,
            title,
            location,
            type,
            created_at,
            employer:employer_id (
              company_name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (savedJobsError) {
        console.error('Error fetching saved jobs:', savedJobsError);
      } else {
        // Transform the data to match the SavedJob interface
        const transformedSavedJobs = (savedJobsData || []).map((saved: SavedJobResponse) => ({
          id: saved.id,
          job: {
            id: saved.job && saved.job.length > 0 ? saved.job[0].id : '',
            title: saved.job && saved.job.length > 0 ? saved.job[0].title : '',
            location: saved.job && saved.job.length > 0 ? saved.job[0].location : '',
            type: saved.job && saved.job.length > 0 ? saved.job[0].type : '',
            created_at: saved.job && saved.job.length > 0 ? saved.job[0].created_at : '',
            employer: {
              company_name: saved.job && saved.job.length > 0 && saved.job[0].employer && saved.job[0].employer.length > 0 
                ? saved.job[0].employer[0].company_name 
                : ''
            }
          }
        }));
        setSavedJobs(transformedSavedJobs);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
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
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <div className="flex space-x-3">
          <Link href="/dashboard/student/events" className="btn-secondary flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </Link>
          <Link href="/jobs" className="btn-primary flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* Profile Completion Alert */}
      {!studentProfile && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your profile is incomplete. 
                <Link href="/onboarding" className="font-medium text-yellow-700 underline">
                  Complete your profile
                </Link> to apply for jobs.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Events</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {upcomingEvents.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(event.start_date).toLocaleDateString()}, {new Date(event.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        {event.location && (
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      <Link 
                        href={`/dashboard/student/events`} 
                        className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No upcoming events</p>
                <Link href="/dashboard/student/events" className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
                  Browse all events
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
          {upcomingEvents.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/student/events" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all events
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
            {applications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <li key={application.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {application.job.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {application.job.employer.company_name}
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
                <Link href="/jobs" className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
                  Browse jobs and apply
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
          {applications.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/student/applications" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all applications
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* Saved Jobs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Saved Jobs</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {savedJobs.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {savedJobs.map((savedJob) => (
                  <li key={savedJob.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {savedJob.job.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {savedJob.job.employer.company_name}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span className="mr-2">
                            {savedJob.job.location} • {savedJob.job.type}
                          </span>
                        </div>
                      </div>
                      <Link 
                        href={`/jobs/${savedJob.job.id}`}
                        className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No saved jobs</p>
                <Link href="/jobs" className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
                  Browse jobs
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
          {savedJobs.length > 0 && (
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link href="/dashboard/student/saved-jobs" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all saved jobs
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile Summary */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Summary</h3>
        </div>
        {studentProfile ? (
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">College/University</dt>
                <dd className="mt-1 text-sm text-gray-900">{studentProfile.college || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Degree</dt>
                <dd className="mt-1 text-sm text-gray-900">{studentProfile.degree || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Graduation Year</dt>
                <dd className="mt-1 text-sm text-gray-900">{studentProfile.graduation_year || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Resume</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {studentProfile.resume_url ? (
                    <a href={studentProfile.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                      View Resume
                    </a>
                  ) : (
                    'Not uploaded'
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Skills</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {studentProfile.skills && studentProfile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.skills.map((skill: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    'No skills listed'
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <Link href="/dashboard/student/profile" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Edit Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-4">
              <p className="text-gray-500">Complete your profile to improve your job matches</p>
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
