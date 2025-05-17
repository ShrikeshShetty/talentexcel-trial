'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent, uploadEventImage, Event, EventType, EventCategory, EventStatus } from '@/lib/superadmin';
import Link from 'next/link';

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [eventData, setEventData] = useState<Partial<Event>>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'In-Person',
    event_category: 'Workshop',
    status: 'draft',
    registration_fee: 0,
    speaker_1: '',
    speaker_2: '',
    location: ''
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [useExternalUrls, setUseExternalUrls] = useState<boolean>(false); // Default to file uploads

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'image') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'logo') {
        setLogoFile(e.target.files[0]);
      } else {
        setImageFile(e.target.files[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalLogoUrl = undefined;
      let finalImageUrl = undefined;
      let uploadErrors = [];

      if (useExternalUrls) {
        // Use external URLs directly
        finalLogoUrl = logoUrl || undefined;
        finalImageUrl = imageUrl || undefined;
      } else {
        // Try to upload files if present
        if (logoFile) {
          try {
            console.log('Uploading logo file:', logoFile.name);
            finalLogoUrl = await uploadEventImage(logoFile, 'logo');
            console.log('Logo upload successful, URL:', finalLogoUrl);
          } catch (error: any) {
            console.warn('Logo upload failed:', error);
            uploadErrors.push(`Logo upload failed: ${error.message || 'Unknown error'}`);
          }
        }

        if (imageFile) {
          try {
            console.log('Uploading image file:', imageFile.name);
            finalImageUrl = await uploadEventImage(imageFile, 'image');
            console.log('Image upload successful, URL:', finalImageUrl);
          } catch (error: any) {
            console.warn('Image upload failed:', error);
            uploadErrors.push(`Image upload failed: ${error.message || 'Unknown error'}`);
          }
        }

        // If both uploads failed, show error and stop
        if (uploadErrors.length > 0 && ((logoFile && !finalLogoUrl) || (imageFile && !finalImageUrl))) {
          setError(`Image upload issues: ${uploadErrors.join(', ')}. Please check your Supabase storage configuration or use external URLs.`);
          setLoading(false);
          return;
        }
      }

      // Log the URLs before creating the event
      console.log('Creating event with the following URLs:');
      console.log('Logo URL:', finalLogoUrl);
      console.log('Image URL:', finalImageUrl);

      // Create event with URLs (either external or uploaded)
      const eventToCreate = {
        ...eventData,
        logo_url: finalLogoUrl || null,
        image_url: finalImageUrl || null,
      } as Event;

      console.log('Event data being sent to database:', eventToCreate);
      const newEvent = await createEvent(eventToCreate);

      router.push(`/superadmin/events/${newEvent.id}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-xl font-bold text-gray-800">Create</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Event Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="event_category" className="block text-sm font-medium text-gray-700">
                      Event Category *
                    </label>
                    <select
                      id="event_category"
                      name="event_category"
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={eventData.event_category}
                      onChange={handleInputChange}
                    >
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

                  <div className="sm:col-span-3">
                    <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
                      Event Type *
                    </label>
                    <select
                      id="event_type"
                      name="event_type"
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={eventData.event_type}
                      onChange={handleInputChange}
                    >
                      <option value="In-Person">In-Person</option>
                      <option value="Virtual">Virtual</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date and Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      id="start_date"
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date and Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      id="end_date"
                      required
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.end_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.location}
                      onChange={handleInputChange}
                      placeholder={eventData.event_type === 'Virtual' ? 'Online Meeting Link' : 'Physical Location'}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="registration_fee" className="block text-sm font-medium text-gray-700">
                      Registration Fee
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="registration_fee"
                        id="registration_fee"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={eventData.registration_fee}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="speaker_1" className="block text-sm font-medium text-gray-700">
                      Speaker 1
                    </label>
                    <input
                      type="text"
                      name="speaker_1"
                      id="speaker_1"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.speaker_1}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="speaker_2" className="block text-sm font-medium text-gray-700">
                      Speaker 2
                    </label>
                    <input
                      type="text"
                      name="speaker_2"
                      id="speaker_2"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={eventData.speaker_2}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-6 mb-4">
                    <div className="flex items-center">
                      <input
                        id="useExternalUrls"
                        name="useExternalUrls"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={useExternalUrls}
                        onChange={(e) => setUseExternalUrls(e.target.checked)}
                      />
                      <label htmlFor="useExternalUrls" className="ml-2 block text-sm text-gray-700">
                        Use external image URLs instead of local file uploads
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      By default, you can upload images from your computer. Check this option only if you prefer to use external image URLs.
                    </p>
                  </div>

                  {useExternalUrls ? (
                    <>
                      <div className="sm:col-span-3">
                        <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                          Event Logo URL
                        </label>
                        <input
                          type="url"
                          id="logoUrl"
                          name="logoUrl"
                          placeholder="https://example.com/logo.png"
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Enter a URL for the event logo (recommended size: 200x200px)
                        </p>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                          Event Banner Image URL
                        </label>
                        <input
                          type="url"
                          id="imageUrl"
                          name="imageUrl"
                          placeholder="https://example.com/banner.jpg"
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Enter a URL for the event banner image (recommended size: 1200x600px)
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sm:col-span-3">
                        <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                          Event Logo
                        </label>
                        <div className="mt-1 flex items-center">
                          <div className="w-full">
                            <label className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                  <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                    Upload a file
                                    <input 
                                      id="logo" 
                                      name="logo" 
                                      type="file" 
                                      accept="image/*" 
                                      className="sr-only" 
                                      onChange={(e) => handleFileChange(e, 'logo')}
                                    />
                                  </span>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                        {logoFile && (
                          <div className="mt-2 flex items-center">
                            <span className="inline-block h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                              <img 
                                src={URL.createObjectURL(logoFile)} 
                                alt="Logo preview" 
                                className="h-full w-full object-contain" 
                              />
                            </span>
                            <span className="ml-2 text-sm text-gray-500">{logoFile.name}</span>
                          </div>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Upload a small logo for the event (recommended size: 200x200px)
                        </p>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                          Event Banner Image
                        </label>
                        <div className="mt-1 flex items-center">
                          <div className="w-full">
                            <label className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                  <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                    Upload a file
                                    <input 
                                      id="image" 
                                      name="image" 
                                      type="file" 
                                      accept="image/*" 
                                      className="sr-only" 
                                      onChange={(e) => handleFileChange(e, 'image')}
                                    />
                                  </span>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                        {imageFile && (
                          <div className="mt-2 flex items-center">
                            <span className="inline-block h-10 w-20 rounded-md overflow-hidden bg-gray-100">
                              <img 
                                src={URL.createObjectURL(imageFile)} 
                                alt="Banner preview" 
                                className="h-full w-full object-contain" 
                              />
                            </span>
                            <span className="ml-2 text-sm text-gray-500">{imageFile.name}</span>
                          </div>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Upload a banner image for the event (recommended size: 1200x600px)
                        </p>
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status *
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={eventData.status}
                      onChange={handleInputChange}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Link
                    href="/superadmin/events"
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
