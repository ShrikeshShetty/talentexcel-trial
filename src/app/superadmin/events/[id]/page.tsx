'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isSuperAdmin, getEventById, Event, deleteEvent, getEventParticipants, EventParticipant } from '@/lib/superadmin';
import Link from 'next/link';
import Image from 'next/image';
import { Download, Search, User, Mail, Phone, Building, BookOpen, Calendar } from 'lucide-react';

export default function EventDetail() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAdmin = await isSuperAdmin();
        if (!isAdmin) {
          router.push('/login');
          return;
        }

        // Fetch event details
        if (eventId) {
          const eventData = await getEventById(eventId);
          setEvent(eventData);
          
          // Fetch participants
          fetchParticipants();
        }
      } catch (error) {
        console.error('Event detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, eventId]);
  
  const fetchParticipants = async () => {
    if (!eventId) return;
    
    setLoadingParticipants(true);
    try {
      const participantsData = await getEventParticipants(eventId);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setLoading(true);
        await deleteEvent(eventId);
        router.push('/superadmin/events');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC' // Keep the time in UTC to avoid timezone shifts
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h2>
          <Link href="/superadmin/events" className="text-blue-600 hover:text-blue-800">
            Return to Events List
          </Link>
        </div>
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
                <Link href="/superadmin/events" className="text-xl font-bold text-gray-800">
                  Events
                </Link>
                <span className="mx-2 text-gray-500">/</span>
                <h1 className="text-xl font-bold text-gray-800 truncate max-w-xs">
                  {event.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/superadmin/events/edit/${eventId}`}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Edit Event
              </Link>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                  ${event.status === 'published' ? 'bg-green-100 text-green-800' : 
                    event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                    event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
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
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{event.title}</h2>
                <div className="mt-2 flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${event.event_type === 'In-Person' ? 'bg-blue-100 text-blue-800' : 
                      event.event_type === 'Virtual' ? 'bg-purple-100 text-purple-800' : 
                      'bg-indigo-100 text-indigo-800'}`}>
                    {event.event_type}
                  </span>
                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {event.event_category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Event Details</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Start Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(event.start_date)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">End Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(event.end_date)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {event.location || (event.event_type === 'Virtual' ? 'Online Event' : 'No location specified')}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Registration Fee</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {event.registration_fee ? `$${event.registration_fee.toFixed(2)}` : 'Free'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Speakers</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="list-disc pl-5">
                      {event.speaker_1 && <li>{event.speaker_1}</li>}
                      {event.speaker_2 && <li>{event.speaker_2}</li>}
                      {!event.speaker_1 && !event.speaker_2 && <li>No speakers listed</li>}
                    </ul>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                    {event.description}
                  </dd>
                </div>
              </dl>
            </div>
            {/* Participants Section */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Event Participants</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search participants..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Implement CSV export
                      alert('Export functionality will be implemented soon');
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-200">
                {loadingParticipants ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : participants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participant
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Institution
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registration
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registered On
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants
                          .filter(participant => {
                            if (!searchTerm) return true;
                            const searchLower = searchTerm.toLowerCase();
                            return (
                              participant.full_name.toLowerCase().includes(searchLower) ||
                              participant.email.toLowerCase().includes(searchLower) ||
                              (participant.institution && participant.institution.toLowerCase().includes(searchLower)) ||
                              (participant.department && participant.department.toLowerCase().includes(searchLower))
                            );
                          })
                          .map((participant) => (
                            <tr key={participant.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{participant.full_name}</div>
                                    <div className="text-sm text-gray-500">{participant.year_of_study || 'N/A'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center text-sm text-gray-900">
                                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                    <span>{participant.email}</span>
                                  </div>
                                  {participant.phone && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                      <span>{participant.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  {participant.institution ? (
                                    <div className="flex items-center text-sm text-gray-900">
                                      <Building className="h-4 w-4 mr-1 text-gray-400" />
                                      <span>{participant.institution}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">Not specified</span>
                                  )}
                                  {participant.department && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                                      <span>{participant.department}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.registration?.registration_status === 'registered' ? 'bg-green-100 text-green-800' : participant.registration?.registration_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {participant.registration?.registration_status ? participant.registration.registration_status.charAt(0).toUpperCase() + participant.registration.registration_status.slice(1) : 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.registration?.payment_status === 'completed' ? 'bg-green-100 text-green-800' : participant.registration?.payment_status === 'free' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {participant.registration?.payment_status === 'free' ? 'Free Event' : participant.registration?.payment_status ? participant.registration.payment_status.charAt(0).toUpperCase() + participant.registration.payment_status.slice(1) : 'Unknown'}
                                </span>
                                {participant.registration?.payment_amount && participant.registration.payment_amount > 0 && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    ${participant.registration.payment_amount.toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                  <span>{participant.registration?.created_at ? new Date(participant.registration.created_at).toLocaleDateString() : 'Unknown'}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No participants yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No one has enrolled in this event yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
