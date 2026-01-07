
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://puyqzdoveokrdhitjwug.supabase.co';
const supabaseKey = 'sb_publishable_Pwa1B6cM6miveVrWpI6yCA_R8zDyR5s';

// Initialize with persistent session false for this utility tool
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const checkSupabaseConnection = async () => {
  try {
    // We use a simple select to verify the table exists
    const { data, error } = await supabase.from('presets').select('id').limit(1);
    if (error) {
      console.error("Supabase Connection Error:", error);
      return { success: false, message: error.message, code: error.code };
    }
    return { success: true, message: "Connected" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
