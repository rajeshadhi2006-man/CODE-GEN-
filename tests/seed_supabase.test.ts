import { describe, it, expect } from 'vitest';
import { fetchAllDataFromSupabase } from '../src/services/supabaseService';
import { testSupabaseConnection } from '../src/lib/supabase';

describe('Supabase Production Live Integration', () => {
  it('connects directly to configured Supabase database without error', async () => {
    const conn = await testSupabaseConnection();
    expect(conn.success).toBe(true);

    const data = await fetchAllDataFromSupabase();
    expect(data.error).toBeUndefined();
    expect(Array.isArray(data.employees)).toBe(true);
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(Array.isArray(data.projects)).toBe(true);
    console.log(`Supabase connection confirmed: ${data.employees.length} employees, ${data.tasks.length} tasks, ${data.projects.length} projects`);
  }, 25000);
});
