import { createClient } from '@supabase/supabase-js';

const getEnv = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://hnracrjqlzywocrnjazu.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_lPURhRpa2GS1vyGyY-Bb9w_5trxfwHf');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

