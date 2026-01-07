
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables or use fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://puyqzdoveokrdhitjwug.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_Pwa1B6cM6miveVrWpI6yCA_R8zDyR5s';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your .env.local file');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('presets').select('id').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Connected" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
