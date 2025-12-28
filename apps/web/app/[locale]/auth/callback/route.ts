import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  const { nextPath } = await service.exchangeCodeForSession(request, {
    redirectPath: pathsConfig.app.home,
  });

  // Extract locale from pathname if present, otherwise use default
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(en|ukr)/);
  const locale = localeMatch ? localeMatch[1] : 'en';
  
  // Ensure nextPath includes locale prefix
  const redirectPath = nextPath.startsWith(`/${locale}`) 
    ? nextPath 
    : `/${locale}${nextPath}`;

  return NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
}
