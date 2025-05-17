'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSuperAdmin, getEvents, Event } from '@/lib/superadmin';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAdmin = await isSuperAdmin();
        if (!isAdmin) {
          router.push('/login');
          return;
        }

        // Fetch events
        const eventsData = await getEvents();
        setEvents(eventsData || []);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
                <h1 className="text-xl font-bold text-gray-800">Super Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/superadmin/events/create" className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Create Event
              </Link>
              <button
                onClick={() => {
                  // Sign out logic here
                  router.push('/login');
                }}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Total Events</h3>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{events.length}</div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <Link href="/superadmin/events" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View all events
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {events.filter(e => new Date(e.start_date) > new Date()).length}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <Link href="/superadmin/events?filter=upcoming" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View upcoming events
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                <div className="mt-3 space-y-2">
                  <Link href="/superadmin/events/create" className="block text-sm text-blue-600 hover:text-blue-500">
                    Create New Event
                  </Link>
                  <Link href="/superadmin/events" className="block text-sm text-blue-600 hover:text-blue-500">
                    Manage Events
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h2>
            <div className="bg-white p-4 shadow overflow-hidden sm:rounded-md">
              {events.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No events found. Create your first event!
                </div>
              ) : (
                <div className="space-y-6">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                      <Link href={`/superadmin/events/${event.id}`} className="block">
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
                              <h3 className="text-lg font-medium text-blue-600 truncate">{event.title}</h3>
                              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${event.status === 'published' ? 'bg-green-100 text-green-800' : 
                                  event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              {/* Date */}
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {new Date(event.start_date).toLocaleDateString()} at {new Date(event.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
