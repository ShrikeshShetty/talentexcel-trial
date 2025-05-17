'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

type CompleteProfileFormData = {
  fullName: string;
  role: 'student' | 'employer' | 'tpo';
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompleteProfileFormData>();
  useEffect(() => {
    // Get user data from localStorage
    const storedData = localStorage.getItem('tempUserData');
    if (!storedData) {
      // Instead of showing an error, just redirect to login
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedData);
      setTempUserData(userData);
      // Pre-fill the name if available
      if (userData.full_name) {
        setValue('fullName', userData.full_name);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [setValue, router]);
  const onSubmit = async (data: CompleteProfileFormData) => {
    if (!tempUserData) {
      // If there's no temp user data, redirect to login
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      // Create the user record with the selected role
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: tempUserData.id,
          email: tempUserData.email,
          full_name: data.fullName,
          role: data.role,
          profile_completed: false
        });

      if (insertError) throw insertError;

      // Clean up localStorage
      localStorage.removeItem('tempUserData');

      toast.success('Profile created successfully!');
      
      // Redirect to role-specific onboarding
      router.push('/onboarding');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete profile');
      console.error('Error completing profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome! Please select your role to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                {...register('fullName', {
                  required: 'Full name is required',
                })}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                I am a
              </label>
              <select
                id="role"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                {...register('role', {
                  required: 'Please select your role',
                })}
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="employer">Employer</option>
                <option value="tpo">Training & Placement Officer</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg 
                    className="animate-spin h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
              ) : null}
              Continue to Onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
