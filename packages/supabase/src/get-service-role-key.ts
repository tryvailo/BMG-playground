import 'server-only';

import { z } from 'zod';

const message =
  'Invalid Supabase Service Role Key. Please add the environment variable SUPABASE_SERVICE_ROLE_KEY.';

/**
 * @name getServiceRoleKey
 * @description Get the Supabase Service Role Key.
 * ONLY USE IN SERVER-SIDE CODE. DO NOT EXPOSE THIS TO CLIENT-SIDE CODE.
 */
export function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Debug logging in development
  if (process.env.NODE_ENV !== 'production') {
    if (!key) {
      console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
      console.error('[Supabase] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    } else {
      console.log('[Supabase] Service role key found, length:', key.length);
    }
  }
  
  return z
    .string({
      required_error: message,
    })
    .min(1, {
      message: message,
    })
    .parse(key);
}

/**
 * Displays a warning message if the Supabase Service Role is being used.
 */
export function warnServiceRoleKeyUsage() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[Dev Only] This is a simple warning to let you know you are using the Supabase Service Role. Make sure it's the right call.`,
    );
  }
}
