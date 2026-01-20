import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://raajyimggsqjhhfwjyyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYWp5aW1nZ3NxamhoZndqeXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTE4ODMsImV4cCI6MjA4NDQ2Nzg4M30.fwFlzwUdJnKSzlZB9k94_QAQElWzq2FzEpmMiCxLmAI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
