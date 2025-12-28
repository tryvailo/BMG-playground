import { Home, User, Shield, Settings, FileText, MapPin, Briefcase, Cog, Zap } from 'lucide-react';
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
        label: 'common:routes.servicesManagement',
        path: pathsConfig.app.servicesManagement,
        Icon: <Briefcase className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.technicalAudit',
        path: pathsConfig.app.techAudit,
        Icon: <Settings className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.contentOptimization',
        path: pathsConfig.app.contentOptimization,
        Icon: <FileText className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.eeatAssessment',
        path: pathsConfig.app.eeatAssessment,
        Icon: <Shield className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.localIndicators',
        path: pathsConfig.app.localIndicators,
        Icon: <MapPin className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.competitors',
        path: pathsConfig.app.competitors,
        Icon: <Zap className={iconClasses} />,
      },
      {
        label: 'common:routes.configuration',
        path: pathsConfig.app.configuration,
        Icon: <Cog className={iconClasses} />,
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
