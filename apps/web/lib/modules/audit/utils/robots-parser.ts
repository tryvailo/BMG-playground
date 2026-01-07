/**
 * robots.txt Parser and Analyzer
 * 
 * Parses robots.txt content and analyzes configuration quality
 * for GEO (Generative Engine Optimization) compliance.
 */

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

export interface RobotsTxtRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

export interface RobotsTxtAnalysis {
  present: boolean;
  content: string;
  hasSitemap: boolean;
  sitemapUrls: string[];
  rules: RobotsTxtRule[];
  disallowAll: boolean; // Disallow: / for all user agents
  blocksAIBots: boolean; // Blocks GPTBot, ChatGPT-User, anthropic-ai, etc.
  blockedAIBots: string[]; // List of blocked AI bots
  hasWildcardUserAgent: boolean; // Has User-agent: *
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Known AI bot user agents that should NOT be blocked for GEO
 */
const AI_BOT_USER_AGENTS = [
  'gptbot',
  'chatgpt-user',
  'anthropic-ai',
  'claude-web',
  'claudebot',
  'cohere-ai',
  'perplexitybot',
  'google-extended',
  'bingbot', // Also used for AI features
  'googlebot', // General search
];

/**
 * Common paths that are OK to disallow (not a problem)
 */
const ACCEPTABLE_DISALLOW_PATHS = [
  '/admin',
  '/admin/',
  '/login',
  '/login/',
  '/register',
  '/register/',
  '/cart',
  '/cart/',
  '/checkout',
  '/checkout/',
  '/user',
  '/user/',
  '/account',
  '/account/',
  '/wp-admin',
  '/wp-admin/',
  '/api',
  '/api/',
  '/private',
  '/private/',
  '/test',
  '/test/',
  '/tmp',
  '/tmp/',
  '/*.pdf$',
  '/cgi-bin',
  '/cgi-bin/',
];

/*
 * -------------------------------------------------------
 * Parser Functions
 * -------------------------------------------------------
 */

/**
 * Parse robots.txt content into structured rules
 */
function parseRobotsTxt(content: string): {
  rules: RobotsTxtRule[];
  sitemapUrls: string[];
} {
  const lines = content.split('\n').map((line) => line.trim());
  const rules: RobotsTxtRule[] = [];
  const sitemapUrls: string[] = [];

  let currentRule: RobotsTxtRule | null = null;

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Parse directive
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (directive) {
      case 'user-agent':
        // Start a new rule for this user agent
        if (currentRule) {
          rules.push(currentRule);
        }
        currentRule = {
          userAgent: value.toLowerCase(),
          disallow: [],
          allow: [],
        };
        break;

      case 'disallow':
        if (currentRule && value) {
          currentRule.disallow.push(value);
        }
        break;

      case 'allow':
        if (currentRule && value) {
          currentRule.allow.push(value);
        }
        break;

      case 'sitemap':
        if (value) {
          sitemapUrls.push(value);
        }
        break;

      // Crawl-delay and other directives are ignored for now
    }
  }

  // Don't forget the last rule
  if (currentRule) {
    rules.push(currentRule);
  }

  return { rules, sitemapUrls };
}

/**
 * Check if a rule blocks all paths (Disallow: /)
 */
function blocksAllPaths(rule: RobotsTxtRule): boolean {
  return rule.disallow.some((path) => path === '/' || path === '/*');
}

/**
 * Check if robots.txt blocks AI bots
 */
function checkAIBotBlocking(rules: RobotsTxtRule[]): {
  blocksAIBots: boolean;
  blockedBots: string[];
} {
  const blockedBots: string[] = [];

  for (const rule of rules) {
    const userAgent = rule.userAgent.toLowerCase();

    // Check if this user agent matches any AI bot
    for (const aiBot of AI_BOT_USER_AGENTS) {
      if (userAgent === aiBot || userAgent.includes(aiBot)) {
        // Check if it blocks all paths
        if (blocksAllPaths(rule)) {
          blockedBots.push(aiBot);
        }
      }
    }

    // Check wildcard user agent that blocks everything
    if (userAgent === '*' && blocksAllPaths(rule)) {
      // If wildcard blocks everything, all AI bots are blocked
      // unless there are specific allow rules for them
      const hasSpecificAIRules = rules.some((r) =>
        AI_BOT_USER_AGENTS.some((bot) => r.userAgent.toLowerCase().includes(bot))
      );

      if (!hasSpecificAIRules) {
        // All AI bots are blocked by wildcard
        blockedBots.push('* (all bots)');
      }
    }
  }

  return {
    blocksAIBots: blockedBots.length > 0,
    blockedBots: [...new Set(blockedBots)], // Remove duplicates
  };
}

/**
 * Calculate score and generate recommendations
 */
function calculateScoreAndRecommendations(
  present: boolean,
  hasSitemap: boolean,
  sitemapUrls: string[],
  rules: RobotsTxtRule[],
  disallowAll: boolean,
  blocksAIBots: boolean,
  blockedBots: string[],
): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  let score = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!present) {
    issues.push('Файл robots.txt відсутній');
    recommendations.push('Створіть файл robots.txt для керування індексацією');
    return { score: 0, issues, recommendations };
  }

  // Base score for having robots.txt
  score += 20;

  // Sitemap check (+30 points)
  if (hasSitemap && sitemapUrls.length > 0) {
    score += 30;
  } else {
    issues.push('Sitemap не вказаний в robots.txt');
    recommendations.push('Додайте директиву Sitemap: https://yoursite.com/sitemap.xml');
  }

  // Disallow all check (-50 points if blocking everything)
  if (disallowAll) {
    score -= 50;
    issues.push('Disallow: / блокує весь сайт для пошукових систем');
    recommendations.push('Видаліть "Disallow: /" або замініть на конкретні шляхи');
  } else {
    score += 25;
  }

  // AI bots blocking check (-30 points)
  if (blocksAIBots) {
    score -= 30;
    issues.push(`AI-боти заблоковані: ${blockedBots.join(', ')}`);
    recommendations.push('Для GEO-оптимізації дозвольте доступ AI-ботам (GPTBot, ChatGPT-User, PerplexityBot)');
  } else {
    score += 25;
  }

  // Check for proper structure
  const hasWildcardAgent = rules.some((r) => r.userAgent === '*');
  if (hasWildcardAgent) {
    score += 10; // Good practice to have wildcard rule
  }

  // Check for problematic disallow rules
  const wildcardRule = rules.find((r) => r.userAgent === '*');
  if (wildcardRule) {
    const problematicPaths = wildcardRule.disallow.filter(
      (path) =>
        !ACCEPTABLE_DISALLOW_PATHS.some(
          (acceptable) => path.toLowerCase() === acceptable.toLowerCase()
        ) && path !== '' && path !== '/'
    );

    if (problematicPaths.length > 5) {
      issues.push(`Забагато заблокованих шляхів (${problematicPaths.length})`);
      recommendations.push('Перегляньте список Disallow правил - можливо деякі зайві');
    }
  }

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));

  return { score, issues, recommendations };
}

/*
 * -------------------------------------------------------
 * Main Export Function
 * -------------------------------------------------------
 */

/**
 * Fetch and analyze robots.txt from a URL
 */
export async function fetchAndAnalyzeRobotsTxt(
  baseUrl: string,
): Promise<RobotsTxtAnalysis> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const robotsTxtUrl = `${normalizedBaseUrl}/robots.txt`;

  try {
    console.log(`[RobotsParser] Fetching robots.txt from: ${robotsTxtUrl}`);

    const response = await fetch(robotsTxtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
        Accept: 'text/plain, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log(`[RobotsParser] robots.txt not found: ${response.status}`);
      return {
        present: false,
        content: '',
        hasSitemap: false,
        sitemapUrls: [],
        rules: [],
        disallowAll: false,
        blocksAIBots: false,
        blockedAIBots: [],
        hasWildcardUserAgent: false,
        issues: ['Файл robots.txt відсутній'],
        recommendations: ['Створіть файл robots.txt для керування індексацією'],
        score: 0,
      };
    }

    const content = await response.text();
    console.log(`[RobotsParser] robots.txt fetched, size: ${content.length} chars`);

    if (!content || content.trim().length === 0) {
      return {
        present: true,
        content: '',
        hasSitemap: false,
        sitemapUrls: [],
        rules: [],
        disallowAll: false,
        blocksAIBots: false,
        blockedAIBots: [],
        hasWildcardUserAgent: false,
        issues: ['Файл robots.txt пустий'],
        recommendations: ['Додайте правила до robots.txt'],
        score: 10,
      };
    }

    // Parse content
    const { rules, sitemapUrls } = parseRobotsTxt(content);

    // Check for disallow all
    const wildcardRule = rules.find((r) => r.userAgent === '*');
    const disallowAll = wildcardRule ? blocksAllPaths(wildcardRule) : false;

    // Check for AI bot blocking
    const { blocksAIBots, blockedBots } = checkAIBotBlocking(rules);

    // Calculate score and recommendations
    const { score, issues, recommendations } = calculateScoreAndRecommendations(
      true,
      sitemapUrls.length > 0,
      sitemapUrls,
      rules,
      disallowAll,
      blocksAIBots,
      blockedBots,
    );

    console.log(`[RobotsParser] Analysis complete. Score: ${score}/100`);

    return {
      present: true,
      content,
      hasSitemap: sitemapUrls.length > 0,
      sitemapUrls,
      rules,
      disallowAll,
      blocksAIBots,
      blockedAIBots: blockedBots,
      hasWildcardUserAgent: rules.some((r) => r.userAgent === '*'),
      issues,
      recommendations,
      score,
    };
  } catch (error) {
    console.error('[RobotsParser] Error fetching robots.txt:', error);
    return {
      present: false,
      content: '',
      hasSitemap: false,
      sitemapUrls: [],
      rules: [],
      disallowAll: false,
      blocksAIBots: false,
      blockedAIBots: [],
      hasWildcardUserAgent: false,
      issues: ['Помилка при отриманні robots.txt'],
      recommendations: ['Перевірте доступність файлу robots.txt'],
      score: 0,
    };
  }
}
