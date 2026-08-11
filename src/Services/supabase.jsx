// src/Services/supabase.jsx
import { createClient } from '@supabase/supabase-js';

// Fallback check to capture either PUBLISHABLE or ANON key environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are properly loaded
if (!supabaseUrl || !supabasePublishableKey) {
  console.error(
    '❌ Supabase Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in your .env file!'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);