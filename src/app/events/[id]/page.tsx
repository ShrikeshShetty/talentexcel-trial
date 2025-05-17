'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Clock, Tag, DollarSign, Users, ArrowLeft } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { Event, getEventById, getEventRegistrationStatus } from '@/lib/superadmin';
import EventEnrollmentForm from '@/components/events/EventEnrollmentForm';

export default function EventDetail() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        if (!eventId) {
          setError('Event not found');
          return;
        }

        // Fetch event details
        const eventData = await getEventById(eventId);
        if (!eventData) {
          setError('Event not found');
          return;
        }
        
        setEvent(eventData);
        
        // Check if user is already registered
        if (user) {
          const registrationData = await getEventRegistrationStatus(eventId, user.id);
          setIsAlreadyRegistered(!!registrationData);
        }
        
        // Get participant count
        const { count, error: countError } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
          
        if (!countError) {
          setParticipantCount(count || 0);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchEventDetails();
    }
  }, [eventId, user, authLoading]);

  const handleEnrollClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setShowEnrollmentForm(true);
  };

  const handleEnrollmentSuccess = () => {
    setShowEnrollmentForm(false);
    setIsAlreadyRegistered(true);
    setParticipantCount(prev => prev + 1);
    setEnrollmentSuccess(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setEnrollmentSuccess(false);
    }, 5000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatTime = (dateString: string) => {
    // Parse the date string as UTC
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true, // Ensure 12-hour format with AM/PM
      timeZone: 'UTC' // Keep the time in UTC to avoid timezone shifts
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
            <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Link href="/dashboard/student/events" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(event.start_date) > new Date();
  const isFree = event.registration_fee === 0 || event.registration_fee === null;
  const canEnroll = isUpcoming && event.status === 'published' && !isAlreadyRegistered;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/dashboard/student/events" 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Events
            </Link>
          </div>

          {/* Success message */}
          {enrollmentSuccess && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    You have successfully enrolled in this event!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Event Header with Banner Image */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="relative w-full bg-gray-100">
              {event.image_url ? (
                <div className="flex justify-center items-center py-4">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="max-w-full h-auto object-contain"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Banner Image</span>
                </div>
              )}
              
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {event.event_category}
                </span>
              </div>
            </div>
            
            <div className="px-6 py-5 flex items-center">
              {/* Event Logo */}
              <div className="mr-6 flex-shrink-0">
                {event.logo_url ? (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                    <img
                      src={event.logo_url}
                      alt="Event Logo"
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-md">
                    <span className="text-gray-400 text-sm">No Logo</span>
                  </div>
                )}
              </div>
              
              {/* Event Title and Type */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900">{event.title}</h2>
                <div className="mt-2 flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${event.event_type === 'In-Person' ? 'bg-blue-100 text-blue-800' : 
                      event.event_type === 'Virtual' ? 'bg-purple-100 text-purple-800' : 
                      'bg-indigo-100 text-indigo-800'}`}>
                    {event.event_type}
                  </span>
                  <span className="ml-2 flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {participantCount} {participantCount === 1 ? 'Participant' : 'Participants'}
                  </span>
                </div>
              </div>
              
              {/* Enroll Button */}
              <div className="ml-4">
                {canEnroll ? (
                  <button
                    onClick={handleEnrollClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isFree ? 'Join Now' : 'Enroll Now'}
                  </button>
                ) : isAlreadyRegistered ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800">
                    Already Enrolled
                  </span>
                ) : !isUpcoming ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                    Event Ended
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800">
                    Not Available
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Event Details */}
            <div className="md:col-span-2 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Event Details</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Description</h4>
                <div className="prose max-w-none text-gray-500 whitespace-pre-line">
                  {event.description}
                </div>
                
                {(event.speaker_1 || event.speaker_2) && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Speakers</h4>
                    <ul className="list-disc pl-5 text-gray-500">
                      {event.speaker_1 && <li className="mb-2">{event.speaker_1}</li>}
                      {event.speaker_2 && <li>{event.speaker_2}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Event Information Sidebar */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Event Information</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                      Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(event.start_date)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <Clock className="h-5 w-5 mr-2 text-gray-400" />
                      Time
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatTime(event.start_date)} - {formatTime(event.end_date)}
                    </dd>
                  </div>
                  
                  {event.location && (
                    <div>
                      <dt className="flex items-center text-sm font-medium text-gray-500">
                        <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                        Location
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {event.location}
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <Tag className="h-5 w-5 mr-2 text-gray-400" />
                      Event Type
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {event.event_type}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                      Registration Fee
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {isFree ? 'Free' : `$${event.registration_fee?.toFixed(2)}`}
                    </dd>
                  </div>
                </dl>
                
                {canEnroll && (
                  <div className="mt-6">
                    <button
                      onClick={handleEnrollClick}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isFree ? 'Join Now' : 'Enroll Now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enrollment Form Modal */}
      {showEnrollmentForm && user && (
        <EventEnrollmentForm
          event={event}
          userId={user.id}
          onClose={() => setShowEnrollmentForm(false)}
          onSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
}
