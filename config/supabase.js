// config/supabase.js
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Use Expo public env vars so they are safely inlined for client apps
const extra = (Constants?.expoConfig?.extra || {});
const SUPABASE_URL =
	process.env.EXPO_PUBLIC_SUPABASE_URL ||
	extra.EXPO_PUBLIC_SUPABASE_URL ||
	'https://dddkvozqqyibxhjxvnvg.supabase.co';
const SUPABASE_ANON_KEY =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZGt2b3pxcXlpYnhoanh2bnZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIyMjg1NiwiZXhwIjoyMDc1Nzk4ODU2fQ.mVDxW1Ph5m3XMAhpMPAbhZBlogRRMOMJoz3qP45NwU8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
