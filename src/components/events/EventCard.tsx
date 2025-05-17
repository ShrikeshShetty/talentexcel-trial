import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Tag, DollarSign } from 'lucide-react';
import { Event } from '@/lib/superadmin';

interface EventCardProps {
  event: Event;
  onEnroll: (eventId: string) => void;
}

export default function EventCard({ event, onEnroll }: EventCardProps) {
  const isUpcoming = new Date(event.start_date) > new Date();
  const isFree = event.registration_fee === 0 || event.registration_fee === null;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Keep the time in UTC to avoid timezone shifts
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Event Image */}
      <div className="relative h-40 bg-gray-200">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : event.logo_url ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
            <img 
              src={event.logo_url} 
              alt={event.title} 
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 font-medium">No Image</span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {event.event_category}
          </span>
        </div>
      </div>
      
      {/* Event Content */}
      <div className="flex-1 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          {/* Date */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDate(event.start_date)}</span>
          </div>
          
          {/* Time */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatTime(event.start_date)} - {formatTime(event.end_date)}</span>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {/* Event Type */}
          <div className="flex items-center text-sm text-gray-600">
            <Tag className="h-4 w-4 mr-2 text-gray-400" />
            <span>{event.event_type}</span>
          </div>
          
          {/* Registration Fee */}
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
            <span>{isFree ? 'Free' : `$${event.registration_fee}`}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {event.description}
        </p>
      </div>
      
      {/* Footer with buttons */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex space-x-2">
          <Link 
            href={`/events/${event.id}`}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Details
          </Link>
          
          {isUpcoming && event.status === 'published' && event.id && (
            <button
              onClick={() => onEnroll(event.id as string)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isFree ? 'Join Now' : 'Enroll Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
