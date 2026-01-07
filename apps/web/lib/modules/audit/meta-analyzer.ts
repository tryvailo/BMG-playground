/**
 * Meta Tags Analyzer
 * Week 4, Days 1-2: Analyze title, description, canonical, og tags, etc.
 */

export interface MetaTag {
  name: string;
  content: string;
  present: boolean;
  optimal: boolean;
  issue?: string;
  recommendation?: string;
}

export interface MetaAnalysisResult {
  url: string;
  title: MetaTag;
  description: MetaTag;
  canonical: MetaTag;
  viewport: MetaTag;
  charset: MetaTag;
  ogTitle: MetaTag;
  ogDescription: MetaTag;
  ogImage: MetaTag;
  twitterCard: MetaTag;
  robots: MetaTag;
  score: number; // 0-100
  criticalIssues: number;
  warningIssues: number;
  timestamp: Date;
}

/**
 * Analyze meta tags from HTML
 */
export function analyzeMetaTags(html: string, url: string): MetaAnalysisResult {
  const result: MetaAnalysisResult = {
    url,
    title: analyzeTitle(html),
    description: analyzeDescription(html),
    canonical: analyzeCanonical(html),
    viewport: analyzeViewport(html),
    charset: analyzeCharset(html),
    ogTitle: analyzeOGTag(html, 'og:title'),
    ogDescription: analyzeOGTag(html, 'og:description'),
    ogImage: analyzeOGTag(html, 'og:image'),
    twitterCard: analyzeTwitterCard(html),
    robots: analyzeRobots(html),
    score: 0,
    criticalIssues: 0,
    warningIssues: 0,
    timestamp: new Date(),
  };

  // Calculate score and issues
  let score = 100;
  let critical = 0;
  let warnings = 0;

  // Check critical tags
  if (!result.title.present) {
    critical++;
    score -= 15;
  } else if (!result.title.optimal) {
    warnings++;
    score -= 5;
  }

  if (!result.description.present) {
    critical++;
    score -= 15;
  } else if (!result.description.optimal) {
    warnings++;
    score -= 5;
  }

  if (!result.charset.present) {
    critical++;
    score -= 10;
  }

  if (!result.viewport.present) {
    critical++;
    score -= 10;
  }

  // Check recommended tags
  if (!result.canonical.present) {
    warnings++;
    score -= 5;
  }

  if (!result.ogTitle.present || !result.ogDescription.present) {
    warnings += 2;
    score -= 10;
  }

  if (!result.twitterCard.present) {
    warnings++;
    score -= 5;
  }

  result.score = Math.max(0, score);
  result.criticalIssues = critical;
  result.warningIssues = warnings;

  return result;
}

/**
 * Analyze title tag
 */
function analyzeTitle(html: string): MetaTag {
  const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
  const match = html.match(titleRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present && content.length >= 30 && content.length <= 60;

  return {
    name: 'title',
    content,
    present,
    optimal,
    issue: present ? (
      content.length < 30 ? 'Title too short (min 30 chars)' :
      content.length > 60 ? 'Title too long (max 60 chars)' :
      undefined
    ) : 'Missing title tag',
    recommendation: 'Keep between 30-60 characters, include target keyword',
  };
}

/**
 * Analyze meta description
 */
function analyzeDescription(html: string): MetaTag {
  const descRegex = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i;
  const match = html.match(descRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present && content.length >= 120 && content.length <= 160;

  return {
    name: 'description',
    content,
    present,
    optimal,
    issue: present ? (
      content.length < 120 ? 'Description too short (min 120 chars)' :
      content.length > 160 ? 'Description too long (max 160 chars)' :
      undefined
    ) : 'Missing meta description',
    recommendation: 'Keep between 120-160 characters, include call-to-action',
  };
}

/**
 * Analyze canonical URL
 */
function analyzeCanonical(html: string): MetaTag {
  const canonicalRegex = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i;
  const match = html.match(canonicalRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present;

  return {
    name: 'canonical',
    content,
    present,
    optimal,
    issue: !present ? 'Missing canonical URL' : undefined,
    recommendation: 'Add canonical to prevent duplicate content issues',
  };
}

/**
 * Analyze viewport
 */
function analyzeViewport(html: string): MetaTag {
  const viewportRegex = /<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i;
  const match = html.match(viewportRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present && content.includes('width=device-width');

  return {
    name: 'viewport',
    content,
    present,
    optimal,
    issue: !present ? 'Missing viewport meta tag' :
      !content.includes('width=device-width') ? 'Viewport not properly configured' :
      undefined,
    recommendation: 'Use: width=device-width, initial-scale=1',
  };
}

/**
 * Analyze charset
 */
function analyzeCharset(html: string): MetaTag {
  const charsetRegex = /<meta\s+charset=["']?([^"'\s>]+)/i;
  const match = html.match(charsetRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present && (content === 'utf-8' || content === 'UTF-8');

  return {
    name: 'charset',
    content,
    present,
    optimal,
    issue: !present ? 'Missing charset declaration' :
      !optimal ? 'Should use UTF-8' : undefined,
    recommendation: 'Add UTF-8 charset in <head>',
  };
}

/**
 * Analyze OG (Open Graph) tag
 */
function analyzeOGTag(html: string, property: string): MetaTag {
  const ogRegex = new RegExp(
    `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
    'i'
  );
  const match = html.match(ogRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present && content.length > 0;

  const name = property.replace('og:', '').toUpperCase();

  return {
    name: property,
    content,
    present,
    optimal,
    issue: !present ? `Missing ${name}` : undefined,
    recommendation: `Add ${property} for social media sharing`,
  };
}

/**
 * Analyze Twitter Card
 */
function analyzeTwitterCard(html: string): MetaTag {
  const twitterRegex = /<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i;
  const match = html.match(twitterRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = present && ['summary', 'summary_large_image', 'app', 'player'].includes(content);

  return {
    name: 'twitter:card',
    content,
    present,
    optimal,
    issue: !present ? 'Missing Twitter Card' : undefined,
    recommendation: 'Add twitter:card for Twitter sharing optimization',
  };
}

/**
 * Analyze robots meta tag
 */
function analyzeRobots(html: string): MetaTag {
  const robotsRegex = /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i;
  const match = html.match(robotsRegex);
  const content = match?.[1]?.trim() ?? '';
  const present = !!match;
  const optimal = !present || content.includes('index') && content.includes('follow');

  return {
    name: 'robots',
    content,
    present,
    optimal,
    issue: present && (!content.includes('index') || !content.includes('follow')) ?
      'Robots directive may prevent indexing' : undefined,
    recommendation: 'Use: index, follow',
  };
}

/**
 * Get meta tag badge variant
 */
export function getMetaTagBadgeVariant(
  optimal: boolean,
  present: boolean
): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (optimal) return 'success';
  if (present) return 'warning';
  return 'destructive';
}

/**
 * Get meta tag status
 */
export function getMetaTagStatus(optimal: boolean, present: boolean): string {
  if (optimal) return 'Optimal';
  if (present) return 'Present but needs improvement';
  return 'Missing';
}

/**
 * Format meta tag content for display
 */
export function formatMetaContent(content: string, maxLength: number = 50): string {
  if (!content) return '—';
  if (content.length > maxLength) {
    return content.substring(0, maxLength) + '...';
  }
  return content;
}

/**
 * Get score badge variant
 */
export function getMetaScoreBadgeVariant(
  score: number
): 'success' | 'warning' | 'destructive' {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'destructive';
}

/**
 * Get score rating
 */
export function getMetaScoreRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}
