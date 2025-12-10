import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { getMessages } from 'next-intl/server';
import { Link } from '~/lib/navigation';

import { ArrowLeft } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import { SiteHeader } from './[locale]/(marketing)/_components/site-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:notFound');

  return {
    title,
  };
};

const NotFoundPage = async () => {
  const client = getSupabaseServerClient();

  let claims = null;
  try {
    const { data } = await client.auth.getClaims();
    claims = data;
  } catch (error) {
    // Supabase might not be available (e.g., Docker not running)
    // Continue without auth claims
    console.warn('[NotFoundPage] Could not fetch auth claims:', error);
  }
  
  // Get locale and messages for next-intl
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={'flex h-screen flex-1 flex-col'}>
        <SiteHeader user={claims?.claims} />

      <div
        className={
          'container m-auto flex w-full flex-1 flex-col items-center justify-center'
        }
      >
        <div className={'flex flex-col items-center space-y-12'}>
          <div>
            <h1 className={'font-heading text-8xl font-extrabold xl:text-9xl'}>
              <Trans i18nKey={'common:pageNotFoundHeading'} />
            </h1>
          </div>

          <div className={'flex flex-col items-center space-y-8'}>
            <div className={'flex flex-col items-center space-y-2.5'}>
              <div>
                <Heading level={1}>
                  <Trans i18nKey={'common:pageNotFound'} />
                </Heading>
              </div>

              <p className={'text-muted-foreground'}>
                <Trans i18nKey={'common:pageNotFoundSubHeading'} />
              </p>
            </div>

            <Button asChild variant={'outline'}>
              <Link href={'/'}>
                <ArrowLeft className={'mr-2 h-4'} />

                <Trans i18nKey={'common:backToHomePage'} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      </div>
    </NextIntlClientProvider>
  );
};

export default withI18n(NotFoundPage);
