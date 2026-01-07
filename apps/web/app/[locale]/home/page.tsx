import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardTabs } from './_components/dashboard-tabs';
import { SubscriptionStatus } from '~/components/subscription-status';

export default function HomePage() {
  return (
    <>
      <PageHeader description={'Your AI visibility at a glance'} />

      <PageBody>
        <div className="space-y-6">
          <SubscriptionStatus />
          <DashboardTabs />
        </div>
      </PageBody>
    </>
  );
}
