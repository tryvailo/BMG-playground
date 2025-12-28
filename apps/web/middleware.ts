import type { NextRequest } from 'next/server';
import { NextResponse, URLPattern } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';

import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';
import { createMiddlewareClient } from '@kit/supabase/middleware-client';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';
import { routing } from '~/i18n/routing';

const CSRF_SECRET_COOKIE = 'csrfSecret';
const NEXT_ACTION_HEADER = 'next-action';

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|locales|assets|api/*).*)'],
};

const getUser = (request: NextRequest, response: NextResponse) => {
  const supabase = createMiddlewareClient(request, response);

  return supabase.auth.getClaims();
};

export async function middleware(request: NextRequest) {
  // First, handle internationalization routing
  const intlResponse = intlMiddleware(request);

  // If intl middleware returns a redirect, return it immediately
  if (intlResponse && intlResponse.status === 307) {
    return intlResponse;
  }

  // Use the response from intl middleware or create a new one
  const response = intlResponse || NextResponse.next();

  // set a unique request ID for each request
  // this helps us log and trace requests
  setRequestId(request);

  // apply CSRF protection for mutating requests
  const csrfResponse = await withCsrfMiddleware(request, response);

  // handle patterns for specific routes
  const handlePattern = matchUrlPattern(request.url);

  // if a pattern handler exists, call it
  if (handlePattern) {
    const patternHandlerResponse = await handlePattern(request, csrfResponse);

    // if a pattern handler returns a response, return it
    if (patternHandlerResponse) {
      return patternHandlerResponse;
    }
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    csrfResponse.headers.set('x-action-path', request.nextUrl.pathname);
  }

  // if no pattern handler returned a response,
  // return the session response
  return csrfResponse;
}

async function withCsrfMiddleware(
  request: NextRequest,
  response = new NextResponse(),
) {
  // set up CSRF protection
  const csrfProtect = createCsrfProtect({
    cookie: {
      secure: appConfig.production,
      name: CSRF_SECRET_COOKIE,
    },
    // ignore CSRF errors for server actions since protection is built-in
    ignoreMethods: isServerAction(request)
      ? ['POST']
      : // always ignore GET, HEAD, and OPTIONS requests
        ['GET', 'HEAD', 'OPTIONS'],
  });

  try {
    await csrfProtect(request, response);

    return response;
  } catch {
    // if there is a CSRF error, return a 403 response
    if (error instanceof CsrfError) {
      return NextResponse.json('Invalid CSRF token', {
        status: 401,
      });
    }

    throw error;
  }
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}
/**
 * Define URL patterns and their corresponding handlers.
 */
function getPatterns() {
  return [
    {
      // Match /:locale/auth/* or /auth/* (for backwards compatibility)
      pattern: new URLPattern({ pathname: '/:locale?/auth/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        // the user is logged out, so we don't need to do anything
        if (!data?.claims) {
          return;
        }

        // Extract locale from pathname if present
        const pathname = req.nextUrl.pathname;
        const localeMatch = pathname.match(/^\/(en|ukr)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        const verifyMfaPath = `/${locale}${pathsConfig.auth.verifyMfa}`;
        const homePath = `/${locale}${pathsConfig.app.home}`;

        // check if we need to verify MFA (user is authenticated but needs to verify MFA)
        const isVerifyMfa = pathname === verifyMfaPath;

        // If user is logged in and does not need to verify MFA,
        // redirect to home page.
        if (!isVerifyMfa) {
          return NextResponse.redirect(
            new URL(homePath, req.nextUrl.origin).href,
          );
        }
      },
    },
    {
      // Match /:locale/home/* or /home/* (for backwards compatibility)
      pattern: new URLPattern({ pathname: '/:locale?/home/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);

        const origin = req.nextUrl.origin;
        const pathname = req.nextUrl.pathname;
        const next = pathname;

        // Extract locale from pathname if present
        const localeMatch = pathname.match(/^\/(en|ukr)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        const signInPath = `/${locale}${pathsConfig.auth.signIn}`;
        const verifyMfaPath = `/${locale}${pathsConfig.auth.verifyMfa}`;

        // If user is not logged in, redirect to sign in page.
        if (!data?.claims) {
          const redirectPath = `${signInPath}?next=${next}`;

          return NextResponse.redirect(new URL(redirectPath, origin).href);
        }

        const supabase = createMiddlewareClient(req, res);

        const requiresMultiFactorAuthentication =
          await checkRequiresMultiFactorAuthentication(supabase);

        // If user requires multi-factor authentication, redirect to MFA page.
        if (requiresMultiFactorAuthentication) {
          return NextResponse.redirect(
            new URL(verifyMfaPath, origin).href,
          );
        }
      },
    },
  ];
}

/**
 * Match URL patterns to specific handlers.
 * @param url
 */
function matchUrlPattern(url: string) {
  const patterns = getPatterns();
  const input = url.split('?')[0];

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input);

    if (patternResult !== null && 'pathname' in patternResult) {
      return pattern.handler;
    }
  }
}

/**
 * Set a unique request ID for each request.
 * @param request
 */
function setRequestId(request: Request) {
  request.headers.set('x-correlation-id', crypto.randomUUID());
}
