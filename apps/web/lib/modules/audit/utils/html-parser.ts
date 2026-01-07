/**
 * HTML Parser Utility
 * Week 4: Parse and extract data from HTML content
 */

export interface ParsedHTML {
  title: string;
  description: string;
  canonical: string;
  charset: string;
  viewport: string;
  lang: string;
  headings: HeadingAnalysis;
  images: ImageAnalysis[];
  links: LinkAnalysis[];
  scripts: number;
  stylesheets: number;
}

export interface HeadingAnalysis {
  h1Count: number;
  h1Texts: string[];
  h2Count: number;
  h3Count: number;
}

export interface ImageAnalysis {
  src: string;
  alt: string;
  hasAlt: boolean;
  width?: string;
  height?: string;
}

export interface LinkAnalysis {
  href: string;
  text: string;
  isExternal: boolean;
  isNofollow: boolean;
}

/**
 * Parse HTML and extract key information
 */
export function parseHTML(html: string, pageUrl?: string): ParsedHTML {
  return {
    title: extractTitle(html),
    description: extractDescription(html),
    canonical: extractCanonical(html),
    charset: extractCharset(html),
    viewport: extractViewport(html),
    lang: extractLang(html),
    headings: analyzeHeadings(html),
    images: analyzeImages(html),
    links: analyzeLinks(html, pageUrl),
    scripts: countScripts(html),
    stylesheets: countStylesheets(html),
  };
}

/**
 * Extract title
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract meta description
 */
function extractDescription(html: string): string {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract canonical URL
 */
export function extractCanonical(html: string): string {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract charset
 */
function extractCharset(html: string): string {
  const match = html.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract viewport
 */
function extractViewport(html: string): string {
  const match = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? '';
}

/**
 * Extract language
 */
function extractLang(html: string): string {
  const match = html.match(/<html[^>]*\s+lang=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? '';
}

/**
 * Analyze heading structure
 */
function analyzeHeadings(html: string): HeadingAnalysis {
  const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
  const h2Regex = /<h2[^>]*>([^<]*)<\/h2>/gi;
  const h3Regex = /<h3[^>]*>([^<]*)<\/h3>/gi;

  const h1Texts: string[] = [];
  let h1Match;
  while ((h1Match = h1Regex.exec(html)) !== null) {
    const text = h1Match[1];
    if (text) h1Texts.push(text.trim());
  }

  let h2Count = 0;
  while (h2Regex.exec(html) !== null) {
    h2Count++;
  }

  let h3Count = 0;
  while (h3Regex.exec(html) !== null) {
    h3Count++;
  }

  return {
    h1Count: h1Texts.length,
    h1Texts,
    h2Count,
    h3Count,
  };
}

/**
 * Analyze images
 */
function analyzeImages(html: string): ImageAnalysis[] {
  const imgRegex = /<img[^>]*>/gi;
  const images: ImageAnalysis[] = [];

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];

    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']*?)["']/i);
    const widthMatch = imgTag.match(/width=["']?([^"'\s>]+)/i);
    const heightMatch = imgTag.match(/height=["']?([^"'\s>]+)/i);

    const src = srcMatch?.[1] ?? '';
    const alt = altMatch?.[1] ?? '';
    images.push({
      src,
      alt,
      hasAlt: alt.length > 0,
      width: widthMatch?.[1],
      height: heightMatch?.[1],
    });
  }

  return images;
}

/**
 * Analyze links
 */
function analyzeLinks(html: string, pageUrl?: string): LinkAnalysis[] {
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  const links: LinkAnalysis[] = [];

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1] ?? '';
    const text = match[2]?.trim() ?? '';
    const fullTag = match[0] ?? '';

    const isExternal = isExternalLink(href, pageUrl);
    const isNofollow = /rel=["']([^"']*)["']/i.test(fullTag) &&
      /rel=["']([^"']*)["']/i.exec(fullTag)?.[1]?.includes('nofollow');

    links.push({
      href,
      text,
      isExternal,
      isNofollow: !!isNofollow,
    });
  }

  return links;
}

/**
 * Check if link is external
 */
function isExternalLink(href: string, pageUrl?: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('/') || href.startsWith('.')) {
    return false;
  }

  if (!pageUrl) return href.startsWith('http');

  try {
    const pageHost = new URL(pageUrl).hostname;
    const linkHost = new URL(href).hostname;
    return pageHost !== linkHost;
  } catch {
    return false;
  }
}

/**
 * Count script tags
 */
function countScripts(html: string): number {
  const scriptRegex = /<script[^>]*>/gi;
  const matches = html.match(scriptRegex);
  return matches ? matches.length : 0;
}

/**
 * Count stylesheets
 */
function countStylesheets(html: string): number {
  const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
  const styleRegex = /<style[^>]*>/gi;

  const linkMatches = html.match(linkRegex);
  const styleMatches = html.match(styleRegex);

  return (linkMatches ? linkMatches.length : 0) + (styleMatches ? styleMatches.length : 0);
}

/**
 * Analyze content structure
 */
export function analyzeContentStructure(html: string) {
  const parsed = parseHTML(html);

  const issues: string[] = [];
  const recommendations: string[] = [];

  // H1 check
  if (parsed.headings.h1Count === 0) {
    issues.push('Missing H1 tag');
    recommendations.push('Add exactly one H1 tag');
  } else if (parsed.headings.h1Count > 1) {
    issues.push('Multiple H1 tags found');
    recommendations.push('Use only one H1 tag per page');
  }

  // H2 check
  if (parsed.headings.h2Count === 0) {
    recommendations.push('Consider adding H2 tags for better structure');
  }

  // Image alt text check
  const imagesWithoutAlt = parsed.images.filter((img) => !img.hasAlt);
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    recommendations.push('Add descriptive alt text to all images');
  }

  // Charset check
  if (!parsed.charset) {
    issues.push('Missing charset declaration');
    recommendations.push('Add <meta charset="UTF-8"> in <head>');
  }

  // Viewport check
  if (!parsed.viewport) {
    issues.push('Missing viewport meta tag');
    recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  return {
    parsed,
    issues,
    recommendations,
    score: calculateStructureScore(issues),
  };
}

/**
 * Calculate structure score
 */
function calculateStructureScore(issues: string[]): number {
  let score = 100;
  issues.forEach(() => {
    score -= 15;
  });
  return Math.max(0, score);
}
