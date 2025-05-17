'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSuperAdmin, getEvents, deleteEvent, Event, EventType, EventCategory, EventStatus } from '@/lib/superadmin';
import Link from 'next/link';

export default function EventsList() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<{
    category?: EventCategory;
    type?: EventType;
    status?: EventStatus;
  }>({});
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAdmin = await isSuperAdmin();
        if (!isAdmin) {
          router.push('/login');
          return;
        }

        // Check for filter in URL
        const urlFilter = searchParams?.get('filter');
        if (urlFilter === 'upcoming') {
          // We'll handle this on the client side after fetching all events
        }

        // Fetch events
        const eventsData = await getEvents(filter);
        
        // Filter for upcoming events if needed
        if (urlFilter === 'upcoming') {
          setEvents((eventsData || []).filter(e => new Date(e.start_date) > new Date()));
        } else {
          setEvents(eventsData || []);
        }
      } catch (error) {
        console.error('Events list error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, searchParams, filter]);

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setLoading(true);
        await deleteEvent(id);
        setEvents(events.filter(event => event.id !== id));
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (filterType: 'category' | 'type' | 'status', value: string | undefined) => {
    setFilter(prev => {
      if (!value) {
        const newFilter = { ...prev };
        delete newFilter[filterType];
        return newFilter;
      }
      return { 
        ...prev, 
        [filterType]: value as any 
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/superadmin/dashboard" className="text-xl font-bold text-gray-800">
                  Super Admin
                </Link>
                <span className="mx-2 text-gray-500">/</span>
                <h1 className="text-xl font-bold text-gray-800">Events</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/superadmin/events/create" className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Events Management</h2>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
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
              
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              >
                <option value="">All Types</option>
                <option value="In-Person">In-Person</option>
                <option value="Virtual">Virtual</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              
              <select
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-4 shadow overflow-hidden sm:rounded-md">
            {events.length > 0 ? (
              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex">
                      {/* Event Image */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {event.image_url ? (
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-full object-contain" 
                          />
                        ) : event.logo_url ? (
                          <img 
                            src={event.logo_url} 
                            alt={event.title}
                            className="w-full h-full object-contain p-2" 
                          />
                        ) : (
                          <span className="text-xs text-gray-500">No Image</span>
                        )}
                      </div>
                      
                      {/* Event Details */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between">
                          <Link href={`/superadmin/events/${event.id}`}>
                            <h3 className="text-lg font-medium text-blue-600 truncate">{event.title}</h3>
                          </Link>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${event.status === 'published' ? 'bg-green-100 text-green-800' : 
                              event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                              event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          {/* Date */}
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {new Date(event.start_date).toLocaleDateString()} at {new Date(event.start_date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true, timeZone: 'UTC'})}
                          </div>
                          
                          {/* Event Type */}
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {event.event_type}
                          </div>
                          
                          {/* Event Category */}
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            {event.event_category}
                          </div>
                          
                          {/* Location if available */}
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Brief Description */}
                        <div className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {event.description}
                        </div>
                        
                        {/* Actions */}
                        <div className="mt-4 flex space-x-4">
                          <Link 
                            href={`/superadmin/events/${event.id}`} 
                            className="font-medium text-blue-600 hover:text-blue-500 text-sm"
                          >
                            View
                          </Link>
                          <Link 
                            href={`/superadmin/events/edit/${event.id}`} 
                            className="font-medium text-indigo-600 hover:text-indigo-500 text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => event.id && handleDeleteEvent(event.id)}
                            className="font-medium text-red-600 hover:text-red-500 text-sm text-left"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No events found. {filter.category || filter.type || filter.status ? 'Try changing your filters.' : 'Create your first event!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
