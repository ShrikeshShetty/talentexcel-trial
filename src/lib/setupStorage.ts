import { supabase } from './supabaseClient';

/**
 * Ensures that the required storage buckets exist
 * Run this function when initializing your application
 */
export async function ensureStorageBucketsExist() {
  try {
    console.log('Checking storage buckets...');
    
    // Check if events bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return false;
    }
    
    const eventsBucketExists = buckets.some(bucket => bucket.name === 'events');
    
    if (!eventsBucketExists) {
      console.log('Events bucket does not exist, creating it...');
      
      // Create the events bucket
      const { error: createError } = await supabase.storage.createBucket('events', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating events bucket:', createError);
        return false;
      }
      
      console.log('Events bucket created successfully');
    } else {
      console.log('Events bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
    return false;
  }
}

/**
 * Tests the storage functionality by uploading a small test file
 */
export async function testStorageUpload() {
  try {
    console.log('Testing storage upload...');
    
    // Create a small test file
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
    
    // Try to upload to events bucket
    const { data, error } = await supabase.storage
      .from('events')
      .upload(`test_${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error testing storage upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('Storage upload test successful:', data);
    return {
      success: true,
      path: data.path
    };
  } catch (error: any) {
    console.error('Error testing storage upload:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
