'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Filter } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { Event } from '@/lib/superadmin';
import EventCard from '@/components/events/EventCard';
import EventEnrollmentForm from '@/components/events/EventEnrollmentForm';

export default function StudentEvents() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [enrollingEvent, setEnrollingEvent] = useState<Event | null>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchEvents();
        fetchUserRegistrations();
      }
    }
  }, [user, loading, filter, categoryFilter, typeFilter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published');

      // Apply category filter if selected
      if (categoryFilter) {
        query = query.eq('event_category', categoryFilter);
      }

      // Apply type filter if selected
      if (typeFilter) {
        query = query.eq('event_type', typeFilter);
      }

      // Apply date filter
      const now = new Date().toISOString();
      if (filter === 'upcoming') {
        query = query.gte('start_date', now);
      } else if (filter === 'past') {
        query = query.lt('start_date', now);
      }

      // Order by date
      query = query.order('start_date', { ascending: filter === 'upcoming' });

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setUserRegistrations((data || []).map(reg => reg.event_id));
    } catch (error) {
      console.error('Error fetching user registrations:', error);
    }
  };

  const handleEnrollClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setEnrollingEvent(event);
    }
  };

  const handleEnrollmentSuccess = () => {
    setEnrollingEvent(null);
    setEnrollmentSuccess(true);
    fetchUserRegistrations();
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setEnrollmentSuccess(false);
    }, 5000);
  };

  const isEventRegistered = (eventId: string) => {
    return userRegistrations.includes(eventId);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
              filter === 'upcoming'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
              filter === 'past'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Past
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Events
          </button>
        </div>
      </div>

      {/* Success message */}
      {enrollmentSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                You have successfully enrolled in the event!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="categoryFilter" className="sr-only">
                Category
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Categories</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Webinar">Webinar</option>
                <option value="Internship">Internship</option>
                <option value="Conference">Conference</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Training">Training</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="typeFilter" className="sr-only">
                Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value ?? '')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                <option value="In-Person">In-Person</option>
                <option value="Virtual">Virtual</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard 
              key={event.id || ''} 
              event={event} 
              onEnroll={event.id && isEventRegistered(event.id) ? () => {} : handleEnrollClick} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">
            {filter === 'upcoming'
              ? 'There are no upcoming events scheduled at this time.'
              : filter === 'past'
              ? 'There are no past events to display.'
              : 'There are no events matching your filters.'}
          </p>
        </div>
      )}

      {/* Enrollment Form Modal */}
      {enrollingEvent && user && (
        <EventEnrollmentForm
          event={enrollingEvent}
          userId={user.id}
          onClose={() => setEnrollingEvent(null)}
          onSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
}
