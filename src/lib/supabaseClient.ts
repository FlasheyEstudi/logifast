import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkqinkhodbabqznmqsuk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcWlua2hvZGJhYnF6bm1xc3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDU0NzEsImV4cCI6MjEwMDc4MTQ3MX0.PU3u6kh_JrxhBUBRhO6hCKciLuvV_BVfvhAXs21iXeg';

export const supabaseRealtime = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
