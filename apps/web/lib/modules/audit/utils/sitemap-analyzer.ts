/**
 * Sitemap Analysis Module
 * Analyzes sitemap.xml for completeness, structure, and optimization
 */

export interface SitemapAnalysis {
  present: boolean;
  valid: boolean;
  urlCount: number;
  hasLastMod: number; // URLs with lastmod
  hasPriority: number; // URLs with priority
  hasChangefreq: number; // URLs with changefreq
  hasImages: number; // Image tags in sitemap
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Analyze sitemap content
 */
export async function analyzeSitemap(baseUrl: string): Promise<SitemapAnalysis> {
  const result: SitemapAnalysis = {
    present: false,
    valid: false,
    urlCount: 0,
    hasLastMod: 0,
    hasPriority: 0,
    hasChangefreq: 0,
    hasImages: 0,
    issues: [],
    recommendations: [],
    score: 0,
  };

  try {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      result.issues.push('Sitemap не знайдено або недоступний');
      result.recommendations.push('Створити та завантажити sitemap.xml в корень сайту');
      return result;
    }

    result.present = true;

    const content = await response.text();

    // Parse XML
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');

      // Check for parsing errors
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        result.issues.push('Sitemap має невалідну XML структуру');
        result.recommendations.push('Перевірити валідність XML у sitemap.xml');
        result.score = 10;
        return result;
      }

      result.valid = true;

      // Count URLs
      const urlElements = xmlDoc.getElementsByTagName('url');
      result.urlCount = urlElements.length;

      if (result.urlCount === 0) {
        result.issues.push('Sitemap не містить URL');
        result.recommendations.push('Додати мінімум 10 URL до sitemap');
        result.score = 20;
        return result;
      }

      // Analyze URL elements
      for (let i = 0; i < urlElements.length; i++) {
        const url = urlElements[i];
        if (!url) continue;

        // Check for lastmod
        const lastmod = url.getElementsByTagName('lastmod')[0];
        if (lastmod) result.hasLastMod++;

        // Check for priority
        const priority = url.getElementsByTagName('priority')[0];
        if (priority) result.hasPriority++;

        // Check for changefreq
        const changefreq = url.getElementsByTagName('changefreq')[0];
        if (changefreq) result.hasChangefreq++;

        // Check for images
        const images = url.getElementsByTagNameNS('http://www.google.com/schemas/sitemap-image/1.1', 'image');
        if (images.length > 0) {
          result.hasImages += images.length;
        }
      }

      // Calculate percentages
      const lastModPercent = (result.hasLastMod / result.urlCount) * 100;
      const priorityPercent = (result.hasPriority / result.urlCount) * 100;
      const changefreqPercent = (result.hasChangefreq / result.urlCount) * 100;

      // Scoring logic
      let score = 50; // Base score for having sitemap with valid XML

      // URL count scoring (10 points)
      if (result.urlCount >= 50) score += 10;
      else if (result.urlCount >= 10) score += Math.round((result.urlCount / 50) * 10);

      // lastmod scoring (15 points)
      if (lastModPercent >= 80) score += 15;
      else if (lastModPercent >= 50) score += 10;
      else if (lastModPercent > 0) score += 5;

      // Priority scoring (10 points)
      if (priorityPercent >= 80) score += 10;
      else if (priorityPercent >= 50) score += 5;

      // Changefreq scoring (10 points)
      if (changefreqPercent >= 80) score += 10;
      else if (changefreqPercent >= 50) score += 5;

      // Images scoring (5 points)
      if (result.hasImages > 0) score += 5;

      result.score = Math.min(100, score);

      // Generate issues
      if (lastModPercent < 50) {
        result.issues.push(`Лише ${Math.round(lastModPercent)}% URL мають lastmod тег`);
        result.recommendations.push('Додати lastmod для всіх URL (допомагає пошуковикам зрозуміти коли змінювався контент)');
      }

      if (priorityPercent < 50) {
        result.issues.push(`Лише ${Math.round(priorityPercent)}% URL мають priority`);
        result.recommendations.push('Додати priority теги для важливих сторінок (0.0-1.0)');
      }

      if (changefreqPercent < 50) {
        result.issues.push(`Лише ${Math.round(changefreqPercent)}% URL мають changefreq`);
        result.recommendations.push('Додати changefreq (daily, weekly, monthly) для оптимізації crawl budget');
      }

      if (result.hasImages === 0) {
        result.recommendations.push('Додати теги для зображень у sitemap для кращого індексування');
      }

      // Additional recommendations
      if (result.urlCount < 10) {
        result.recommendations.push(`Розглянути додавання більше URL (поточно: ${result.urlCount})`);
      }
    } catch (_parseError) {
      result.issues.push('Помилка при парсингу sitemap XML');
      result.recommendations.push('Перевірити структуру sitemap.xml та спробувати знову');
      result.score = 15;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      result.issues.push('Перевірка sitemap витекла (timeout)');
    } else {
      result.issues.push('Помилка при завантаженні sitemap');
    }
    result.recommendations.push('Перевірити доступність sitemap.xml');
    result.score = 0;
  }

  return result;
}
