
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://puyqzdoveokrdhitjwug.supabase.co';
const supabaseKey = 'sb_publishable_Pwa1B6cM6miveVrWpI6yCA_R8zDyR5s';

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
