import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardTabs } from './_components/dashboard-tabs';

export default function HomePage() {
  return (
    <>
      <PageHeader description={'Your AI visibility at a glance'} />

      <PageBody>
        <DashboardTabs />
      </PageBody>
    </>
  );
}
