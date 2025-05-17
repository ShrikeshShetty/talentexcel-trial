'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type StudentFormData = {
  college: string;
  degree: string;
  graduationYear: string;
  skills: string;
};

type EmployerFormData = {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  description: string;
};

type TPOFormData = {
  instituteName: string;
  department: string;
  website: string;
};

export default function OnboardingPage() {
  const { user, userRole, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const studentForm = useForm<StudentFormData>();
  const employerForm = useForm<EmployerFormData>();
  const tpoForm = useForm<TPOFormData>();

  useEffect(() => {
    // Redirect if not authenticated or no role
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      } 
      
      if (!userRole) {
        router.push('/auth/complete-profile');
        return;
      }

      // Check if user has already completed onboarding
      const checkOnboarding = async () => {
        if (!user) return;

        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('profile_completed')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (userData?.profile_completed) {
            // Redirect to appropriate dashboard if profile is already completed
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
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      };

      checkOnboarding();
    }
  }, [isAuthenticated, loading, router, userRole, user]);

  const handleStudentSubmit = async (data: StudentFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Parse skills into an array
      const skillsArray = data.skills.split(',').map(skill => skill.trim());
      
      // Create student profile
      const { error } = await supabase
        .from('student_profiles')
        .insert([{
          user_id: user.id,
          college: data.college,
          degree: data.degree,
          graduation_year: data.graduationYear,
          skills: skillsArray
        }]);

      if (error) throw error;

      // Update user's profile_completed status
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile completed successfully!');
      router.push('/dashboard/student');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete profile');
      console.error('Error completing profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployerSubmit = async (data: EmployerFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employer_profiles')
        .insert([{
          user_id: user.id,
          company_name: data.companyName,
          industry: data.industry,
          company_size: data.companySize,
          website: data.website,
          description: data.description
        }]);

      if (error) throw error;

      // Update user's profile_completed status
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile completed successfully!');
      router.push('/dashboard/employer');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete profile');
      console.error('Error completing profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTPOSubmit = async (data: TPOFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Create TPO profile
      const { error: profileError } = await supabase
        .from('tpo_profiles')
        .insert([{
          user_id: user.id,
          institute_name: data.instituteName,
          department: data.department,
          website: data.website
        }]);

      if (profileError) throw profileError;

      // Update user's profile_completed status
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile completed successfully!');
      router.push('/dashboard/tpo');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete profile');
      console.error('Error completing profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please provide some additional information to complete your profile.
          </p>
        </div>

        {userRole === 'student' && (
          <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-6">
            <div>
              <label htmlFor="college" className="block text-sm font-medium text-gray-700">College/University</label>
              <input
                id="college"
                type="text"
                {...studentForm.register('college', { required: 'College name is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {studentForm.formState.errors.college && (
                <p className="mt-1 text-sm text-red-600">{studentForm.formState.errors.college.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700">Degree</label>
              <input
                id="degree"
                type="text"
                {...studentForm.register('degree', { required: 'Degree is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {studentForm.formState.errors.degree && (
                <p className="mt-1 text-sm text-red-600">{studentForm.formState.errors.degree.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700">Graduation Year</label>
              <input
                id="graduationYear"
                type="text"
                {...studentForm.register('graduationYear', { required: 'Graduation year is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {studentForm.formState.errors.graduationYear && (
                <p className="mt-1 text-sm text-red-600">{studentForm.formState.errors.graduationYear.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
              <input
                id="skills"
                type="text"
                {...studentForm.register('skills', { required: 'Skills are required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., JavaScript, React, Node.js"
              />
              {studentForm.formState.errors.skills && (
                <p className="mt-1 text-sm text-red-600">{studentForm.formState.errors.skills.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </form>
        )}

        {userRole === 'employer' && (
          <form onSubmit={employerForm.handleSubmit(handleEmployerSubmit)} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                id="companyName"
                type="text"
                {...employerForm.register('companyName', { required: 'Company name is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {employerForm.formState.errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{employerForm.formState.errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
              <input
                id="industry"
                type="text"
                {...employerForm.register('industry', { required: 'Industry is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {employerForm.formState.errors.industry && (
                <p className="mt-1 text-sm text-red-600">{employerForm.formState.errors.industry.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">Company Size</label>
              <select
                id="companySize"
                {...employerForm.register('companySize', { required: 'Company size is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
              {employerForm.formState.errors.companySize && (
                <p className="mt-1 text-sm text-red-600">{employerForm.formState.errors.companySize.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Company Website</label>
              <input
                id="website"
                type="url"
                {...employerForm.register('website', { required: 'Website is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="https://"
              />
              {employerForm.formState.errors.website && (
                <p className="mt-1 text-sm text-red-600">{employerForm.formState.errors.website.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Company Description</label>
              <textarea
                id="description"
                {...employerForm.register('description', { required: 'Description is required' })}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {employerForm.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600">{employerForm.formState.errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </form>
        )}

        {userRole === 'tpo' && (
          <form onSubmit={tpoForm.handleSubmit(handleTPOSubmit)} className="space-y-6">
            <div>
              <label htmlFor="instituteName" className="block text-sm font-medium text-gray-700">Institute Name</label>
              <input
                id="instituteName"
                type="text"
                {...tpoForm.register('instituteName', { required: 'Institute name is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {tpoForm.formState.errors.instituteName && (
                <p className="mt-1 text-sm text-red-600">{tpoForm.formState.errors.instituteName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
              <input
                id="department"
                type="text"
                {...tpoForm.register('department', { required: 'Department is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {tpoForm.formState.errors.department && (
                <p className="mt-1 text-sm text-red-600">{tpoForm.formState.errors.department.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Institute Website</label>
              <input
                id="website"
                type="url"
                {...tpoForm.register('website', { required: 'Website is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="https://"
              />
              {tpoForm.formState.errors.website && (
                <p className="mt-1 text-sm text-red-600">{tpoForm.formState.errors.website.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Completing Profile...' : 'Complete Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
