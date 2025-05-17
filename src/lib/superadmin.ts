import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Super Admin Authentication
export async function authenticateSuperAdmin(email: string, password: string) {
  try {
    console.log('Starting super admin authentication for:', email);
    
    // First authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      console.error('Auth succeeded but no user data returned');
      throw new Error('Authentication failed');
    }
    
    console.log('Basic authentication successful, user ID:', authData.user.id);

    // Then check if the user is a super_admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      throw userError;
    }
    
    console.log('User role from database:', userData?.role);
    
    if (userData.role !== 'super_admin') {
      console.error('User is not a super admin, role:', userData.role);
      // Sign out if not a super admin
      await supabase.auth.signOut();
      throw new Error('Unauthorized: Not a super admin');
    }

    // Check if user exists in super_admins table
    const { data: superAdminData, error: superAdminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (superAdminError) {
      console.error('Error checking super_admins table:', superAdminError);
      // We'll continue even if there's an error here, as the role check already passed
    } else {
      console.log('Super admin record found:', superAdminData);
    }

    // Update last login time - only if the super admin record exists
    if (superAdminData) {
      const { error: updateError } = await supabase
        .from('super_admins')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error('Error updating last login time:', updateError);
        // Continue anyway, this is not critical
      } else {
        console.log('Updated last login time successfully');
      }
    } else {
      console.warn('No super_admin record found for this user, skipping last login update');
    }

    console.log('Super admin authentication successful');
    return { user: authData.user, role: userData.role };
  } catch (error) {
    console.error('Super admin authentication error:', error);
    throw error;
  }
}

// Check if current user is a super admin
export async function isSuperAdmin() {
  try {
    console.log('Checking if user is a super admin...');
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      console.log('No active session found');
      return false;
    }
    
    console.log('Session found, user ID:', session.session.user.id);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error checking user role:', userError);
      return false;
    }
    
    if (!userData) {
      console.error('No user data found');
      return false;
    }
    
    const isSuperAdmin = userData?.role === 'super_admin';
    console.log('Is super admin?', isSuperAdmin);
    
    return isSuperAdmin;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

// Event Management Functions
export type EventType = 'In-Person' | 'Virtual' | 'Hybrid';
export type EventCategory = 'Workshop' | 'Seminar' | 'Webinar' | 'Internship' | 'Conference' | 'Hackathon' | 'Training' | 'Other';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface Event {
  id?: string;
  title: string;
  description: string;
  logo_url?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  event_type: EventType;
  location?: string;
  registration_fee?: number;
  speaker_1?: string;
  speaker_2?: string;
  event_category: EventCategory;
  status: EventStatus;
}

export interface EventParticipant {
  id: string;
  registration_id: string;
  full_name: string;
  email: string;
  phone?: string;
  institution?: string;
  department?: string;
  year_of_study?: string;
  additional_info?: any;
  created_at: string;
  registration: {
    registration_status: string;
    payment_status: string;
    payment_amount: number;
    payment_date?: string;
    created_at: string;
    user: {
      id: string;
      email: string;
    };
  };
}

// Create a new event
export async function createEvent(eventData: Event) {
  try {
    console.log('Creating new event:', eventData.title);
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      console.error('No active session found');
      throw new Error('Not authenticated');
    }
    
    // Create event even if image uploads failed (they'll be null)
    // This allows events to be created even if the storage bucket doesn't exist yet
    const eventToInsert = {
      ...eventData,
      created_by: session.session.user.id
    };
    
    console.log('Inserting event into database');
    const { data, error } = await supabase
      .from('events')
      .insert(eventToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting event into database:', error);
      throw error;
    }
    
    console.log('Event created successfully:', data.id);
    return data;
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    // Provide more helpful error message for common issues
    if ((error as any).code === '42P01') {
      throw new Error('Events table not found. Make sure you have run the database setup script.');
    } else if ((error as any).statusCode === 404 || (error as any).message?.includes('not found')) {
      throw new Error('Resource not found. Check if your database tables are properly set up.');
    }
    
    throw error;
  }
}

// Update an existing event
export async function updateEvent(id: string, eventData: Partial<Event>) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// Get all events with optional filtering
export async function getEvents(filters?: {
  category?: EventCategory;
  type?: EventType;
  status?: EventStatus;
}) {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (filters?.category) {
      query = query.eq('event_category', filters.category);
    }
    
    if (filters?.type) {
      query = query.eq('event_type', filters.type);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Get a single event by ID
export async function getEventById(id: string) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

// Delete an event
export async function deleteEvent(id: string) {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Upload event image or logo
export async function uploadEventImage(file: File, type: 'logo' | 'image') {
  try {
    // Check if the file is valid
    if (!file) {
      console.log('No file provided, skipping upload');
      return null;
    }

    console.log(`Uploading event ${type}:`, file.name);
    
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    
    // Use a simple file path
    const filePath = fileName;
    
    // Try uploading to each bucket until one works
    // Order of preference: public, storage, events
    const bucketOptions = ['public', 'storage', 'events'];
    let uploadSuccess = false;
    let publicUrl = null;
    let usedBucket = '';
    
    for (const bucket of bucketOptions) {
      try {
        console.log(`Attempting upload to ${bucket} bucket...`);
        
        // Upload the file
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.log(`Upload to ${bucket} failed:`, error.message);
          continue; // Try next bucket
        }
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
          console.log(`Could not get public URL from ${bucket}`);
          continue; // Try next bucket
        }
        
        // Success!
        publicUrl = urlData.publicUrl;
        usedBucket = bucket;
        uploadSuccess = true;
        console.log(`Upload to ${bucket} succeeded! URL:`, publicUrl);
        break;
      } catch (err) {
        console.log(`Error trying ${bucket} bucket:`, err);
        // Continue to next bucket
      }
    }
    
    if (!uploadSuccess) {
      console.error('All upload attempts failed');
      throw new Error('Could not upload file to any storage bucket');
    }
    
    console.log(`${type} uploaded successfully to ${usedBucket}:`, publicUrl);
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading event ${type}:`, error);
    throw error;
  }
}

// Helper function to try uploading to a specific bucket
async function tryUploadToBucket(bucketName: string, filePath: string, file: File) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// Get event participants
export async function getEventParticipants(eventId: string) {
  try {
    console.log('Fetching participants for event:', eventId);
    
    // First get the registrations for this specific event
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId);
    
    if (regError) {
      console.error('Error fetching event registrations:', regError);
      throw regError;
    }
    
    // If no registrations found, return empty array
    if (!registrations || registrations.length === 0) {
      console.log(`No registrations found for event ${eventId}`);
      return [];
    }
    
    // Get registration IDs
    const registrationIds = registrations.map(reg => reg.id);
    
    // Now fetch participants with these registration IDs
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        *,
        registration:registration_id(
          registration_status,
          payment_status,
          payment_amount,
          payment_date,
          created_at,
          event_id,
          user:user_id(
            id,
            email
          )
        )
      `)
      .in('registration_id', registrationIds);
    
    if (error) {
      console.error('Error fetching event participants:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} participants for event ${eventId}`);
    return data || [];
  } catch (error) {
    console.error('Error in getEventParticipants:', error);
    throw error;
  }
}

// Get event registration status for a user
export async function getEventRegistrationStatus(eventId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking registration status:', error);
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error in getEventRegistrationStatus:', error);
    throw error;
  }
}
