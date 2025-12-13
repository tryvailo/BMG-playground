import { z } from 'zod';

const PathsSchema = z.object({
  auth: z.object({
    signIn: z.string().min(1),
    signUp: z.string().min(1),
    verifyMfa: z.string().min(1),
    callback: z.string().min(1),
    passwordReset: z.string().min(1),
    passwordUpdate: z.string().min(1),
  }),
  app: z.object({
    home: z.string().min(1),
    servicesManagement: z.string().min(1),
    profileSettings: z.string().min(1),
    techAudit: z.string().min(1),
    contentOptimization: z.string().min(1),
    eeatAssessment: z.string().min(1),
    localIndicators: z.string().min(1),
    configuration: z.string().min(1),
  }),
  marketing: z.object({
    pricing: z.string().min(1),
    checkout: z.string().min(1),
  }),
});

const pathsConfigRaw = {
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verifyMfa: '/auth/verify',
    callback: '/auth/callback',
    passwordReset: '/auth/password-reset',
    passwordUpdate: '/update-password',
  },
  app: {
    home: '/home',
    servicesManagement: '/home/services-management',
    profileSettings: '/home/settings',
    techAudit: '/home/tech-audit',
    contentOptimization: '/home/content-optimization',
    eeatAssessment: '/home/eeat-assessment',
    localIndicators: '/home/local-indicators',
    configuration: '/home/configuration',
  },
  marketing: {
    pricing: '/pricing',
    checkout: '/checkout',
  },
} as const;

const pathsConfig = PathsSchema.parse(pathsConfigRaw);

export default pathsConfig;
