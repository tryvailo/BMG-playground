import type { JwtPayload } from '@supabase/supabase-js';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
} from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import { Tables } from '~/lib/database.types';

// Horizon UI Design Tokens
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  background: '#F4F7FE',
  textPrimary: '#1B2559',
};

export function HomeSidebar(props: {
  account?: Tables<'accounts'>;
  user: JwtPayload;
}) {
  return (
    <Sidebar
      collapsible={'icon'}
      className="border-none"
      style={{ backgroundColor: 'white' }}
    >
      <SidebarHeader className={'h-16 justify-center'}>
        <div className={'flex items-center justify-between space-x-2'}>
          <div>
            <AppLogo className={'max-w-full'} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarNavigation config={navigationConfig} />
      </SidebarContent>

      <SidebarFooter
        className="border-t"
        style={{ borderColor: HORIZON.background }}
      >
        <ProfileAccountDropdownContainer
          user={props.user}
          account={props.account}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
