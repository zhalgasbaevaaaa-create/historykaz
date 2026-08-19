import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fumyvbpuajculylbifks.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bXl2YnB1YWpjdWx5bGJpZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjM0NjUsImV4cCI6MjEwMjY5OTQ2NX0.pqouWJGDyuZ8dE7aiD_FFjgS7YxQuxlKkhnfekfIL3o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function appRedirectUrl(): string {
  const u = new URL(window.location.href);
  const path = u.pathname.endsWith('/') ? u.pathname : u.pathname + '/';
  return `${u.origin}${path}`;
}
