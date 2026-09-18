import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fully integrated live Supabase project credentials configured directly in code
export const SUPABASE_URL = 'https://svuxowuosmhzujcekqnk.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dXhvd3Vvc21oenVqY2VrcW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjE3MzYsImV4cCI6MjEwNTI5NzczNn0.uaJ-FvEVI7fCZIn3y5jTkMfmsUSouDcQWkEQlOroFGk';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return true;
}

export function getStoredSupabaseCredentials() {
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
}

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('employees').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to connect to Supabase' };
  }
}
