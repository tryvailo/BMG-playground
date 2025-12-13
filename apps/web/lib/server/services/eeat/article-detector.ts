/**
 * Article Detection and Author Analysis
 *
 * Detects if a page is an article and analyzes author information.
 */

import { load, type CheerioAPI } from 'cheerio';

import type {
  ArticleAuthorInfo,
  AuthorProfileInfo,
} from './types';

/**
 * Check if page is identified as an article
 */
export function isArticlePage($: CheerioAPI, url: string): boolean {
  // Check HTML5 semantic tags
  if ($('article').length > 0) {
    return true;
  }

  // Check common article classes
  const articleClasses = [
    'article',
    'blog-post',
    'post',
    'entry',
    'content-article',
    'news-item',
  ];
  for (const className of articleClasses) {
    if ($(`.${className}`).length > 0 || $(`[class*="${className}"]`).length > 0) {
      return true;
    }
  }

  // Check URL patterns
  const urlLower = url.toLowerCase();
  if (
    urlLower.includes('/blog/') ||
    urlLower.includes('/article/') ||
    urlLower.includes('/post/') ||
    urlLower.includes('/news/') ||
    urlLower.includes('/стаття/')
  ) {
    return true;
  }

  // Check structured data
  if ($('[itemtype*="Article"]').length > 0 || $('[itemtype*="BlogPosting"]').length > 0) {
    return true;
  }

  return false;
}

/**
 * Extract author information from article page
 */
export function extractArticleAuthor($: CheerioAPI): ArticleAuthorInfo {
  const isArticle = isArticlePage($, '');
  let hasAuthorBlock = false;
  let authorName: string | undefined;
  let hasAuthorProfileLink = false;
  let authorProfileUrl: string | undefined;

  if (!isArticle) {
    return {
      is_article: false,
      has_author_block: false,
      has_author_profile_link: false,
    };
  }

  // Check for author block using various selectors
  const authorSelectors = [
    '.author',
    '.byline',
    '.article-author',
    '.post-author',
    '[itemprop="author"]',
    '[rel="author"]',
    '.author-info',
    '.author-block',
  ];

  for (const selector of authorSelectors) {
    const authorElement = $(selector).first();
    if (authorElement.length > 0) {
      hasAuthorBlock = true;

      // Try to extract author name
      const nameText = authorElement.text().trim();
      if (nameText && !authorName) {
        // Clean up name (remove common prefixes)
        authorName = nameText
          .replace(/^(Автор|Author|By):?\s*/i, '')
          .trim()
          .split('\n')[0]
          .split(',')[0]
          .trim();
      }

      // Check for author profile link
      const profileLink = authorElement.find('a[href]').first();
      if (profileLink.length > 0) {
        hasAuthorProfileLink = true;
        const href = profileLink.attr('href');
        if (href) {
          authorProfileUrl = href.startsWith('http') ? href : new URL(href, 'https://example.com').toString();
        }
      }
    }
  }

  // Also check for author link in article metadata
  if (!hasAuthorProfileLink) {
    $('a[href*="/author/"], a[href*="/doctors/"], a[href*="/team/"]').each((_, element) => {
      const linkText = $(element).text().toLowerCase();
      if (
        linkText.includes('author') ||
        linkText.includes('автор') ||
        linkText.includes('doctor') ||
        linkText.includes('лікар')
      ) {
        hasAuthorProfileLink = true;
        const href = $(element).attr('href');
        if (href && !authorProfileUrl) {
          authorProfileUrl = href.startsWith('http') ? href : new URL(href, 'https://example.com').toString();
        }
        return false; // Break
      }
    });
  }

  return {
    is_article: true,
    has_author_block: hasAuthorBlock,
    author_name: authorName,
    has_author_profile_link: hasAuthorProfileLink,
    author_profile_url: authorProfileUrl,
  };
}

/**
 * Analyze author profile page
 */
export function analyzeAuthorProfile($: CheerioAPI): AuthorProfileInfo {
  const textContent = $('body').text().toLowerCase();

  // Check for qualifications
  const qualificationPatterns = [
    'dr.',
    'doctor',
    'md',
    'к.м.н.',
    'phd',
    'професор',
    'professor',
    'доцент',
    'assistant professor',
  ];
  const hasQualifications = qualificationPatterns.some((pattern) =>
    textContent.includes(pattern),
  );

  // Check for position/title
  const positionPatterns = [
    'cardiologist',
    'surgeon',
    'dentist',
    'ophthalmologist',
    'кардіолог',
    'хірург',
    'стоматолог',
    'офтальмолог',
    'position',
    'должность',
    'посада',
  ];
  const hasPosition = positionPatterns.some((pattern) => textContent.includes(pattern));

  // Check for years of experience
  const experiencePatterns = [
    /\d+\+?\s*(років|years|рік|year)/i,
    /(досвід|experience).*\d+/i,
    /\d+\s*(років|years)\s*(досвіду|experience)/i,
  ];
  const hasExperienceYears = experiencePatterns.some((pattern) => pattern.test(textContent));

  // Check for links to diplomas/certificates
  let hasCredentialsLinks = false;
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase();
    if (
      href.includes('diploma') ||
      href.includes('certificate') ||
      href.includes('license') ||
      href.includes('диплом') ||
      href.includes('сертификат') ||
      href.includes('ліцензія') ||
      text.includes('diploma') ||
      text.includes('certificate')
    ) {
      hasCredentialsLinks = true;
      return false; // Break
    }
  });

  // Also check images with alt text
  $('img[alt]').each((_, element) => {
    const alt = $(element).attr('alt')?.toLowerCase() || '';
    if (
      alt.includes('diploma') ||
      alt.includes('certificate') ||
      alt.includes('диплом') ||
      alt.includes('сертификат')
    ) {
      hasCredentialsLinks = true;
      return false; // Break
    }
  });

  return {
    has_qualifications: hasQualifications,
    has_position: hasPosition,
    has_experience_years: hasExperienceYears,
    has_credentials_links: hasCredentialsLinks,
  };
}

