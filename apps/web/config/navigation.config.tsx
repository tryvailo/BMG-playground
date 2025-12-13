import { Home, User, Shield, Settings, FileText, MapPin, Briefcase, Cog } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'common:routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'Services Management',
        path: pathsConfig.app.servicesManagement,
        Icon: <Briefcase className={iconClasses} />,
        end: true,
      },
      {
        label: 'Technical Audit',
        path: pathsConfig.app.techAudit,
        Icon: <Settings className={iconClasses} />,
        end: true,
      },
      {
        label: 'Content Optimization',
        path: pathsConfig.app.contentOptimization,
        Icon: <FileText className={iconClasses} />,
        end: true,
      },
      {
        label: 'E-E-A-T Assessment',
        path: pathsConfig.app.eeatAssessment,
        Icon: <Shield className={iconClasses} />,
        end: true,
      },
      {
        label: 'Local Indicators',
        path: pathsConfig.app.localIndicators,
        Icon: <MapPin className={iconClasses} />,
        end: true,
      },
      {
        label: 'Configuration',
        path: pathsConfig.app.configuration,
        Icon: <Cog className={iconClasses} />,
        end: true,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
