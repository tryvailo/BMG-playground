import { redirect } from '~/lib/navigation';
import { getLocale } from 'next-intl/server';

import { MultiFactorChallengeContainer } from '@kit/auth/mfa';
import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

interface Props {
  searchParams: Promise<{
    next?: string;
  }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signIn'),
  };
};

async function VerifyPage(props: Props) {
  const client = getSupabaseServerClient();
  const locale = await getLocale();

  const { data } = await client.auth.getClaims();

  if (!data?.claims) {
    redirect({ href: pathsConfig.auth.signIn, locale });
  }

  const needsMfa = await checkRequiresMultiFactorAuthentication(client);

  if (!needsMfa) {
    redirect({ href: pathsConfig.auth.signIn, locale });
  }

  const nextPath = (await props.searchParams).next;
  const redirectPath = nextPath ?? pathsConfig.app.home;

  if (!data?.claims) {
    redirect({ href: pathsConfig.auth.signIn, locale });
  }

  const userId = data?.claims?.sub;
  if (!userId || typeof userId !== 'string') {
    redirect({ href: pathsConfig.auth.signIn, locale });
  }

  return (
    <MultiFactorChallengeContainer
      userId={userId as string}
      paths={{
        redirectPath,
      }}
    />
  );
}

export default withI18n(VerifyPage);
