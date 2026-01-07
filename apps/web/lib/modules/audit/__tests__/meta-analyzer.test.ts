/**
 * Tests for Meta Analyzer
 * Analyze meta tags from HTML
 */

import {
  analyzeMetaTags,
  getMetaTagBadgeVariant,
  getMetaTagStatus,
  formatMetaContent,
  getMetaScoreBadgeVariant,
  getMetaScoreRating,
} from '../meta-analyzer';

describe('Meta Analyzer', () => {
  describe('analyzeMetaTags', () => {
    it('should analyze complete meta tags', () => {
      const html = `
        <html>
          <head>
            <title>Sample Page Title</title>
            <meta name="description" content="This is a sample page description" />
            <link rel="canonical" href="https://example.com/page" />
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta property="og:title" content="OG Title" />
            <meta property="og:description" content="OG Description" />
            <meta name="twitter:card" content="summary" />
          </head>
        </html>
      `;

      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('canonical');
      expect(result).toHaveProperty('score');
    });

    it('should detect missing title', () => {
      const html = '<html><head></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.title.present).toBe(false);
      expect(result.criticalIssues).toBeGreaterThan(0);
    });

    it('should detect optimal title length (30-60 chars)', () => {
      const htmlShort = '<html><head><title>Short</title></head></html>';
      const htmlGood = '<html><head><title>This is a Good Title for SEO Testing</title></head></html>';
      const htmlLong = '<html><head><title>This is a very long title that exceeds the maximum recommended character limit</title></head></html>';

      const shortResult = analyzeMetaTags(htmlShort, 'https://example.com');
      const goodResult = analyzeMetaTags(htmlGood, 'https://example.com');
      const longResult = analyzeMetaTags(htmlLong, 'https://example.com');

      expect(shortResult.title.optimal).toBe(false);
      expect(goodResult.title.optimal).toBe(true);
      expect(longResult.title.optimal).toBe(false);
    });

    it('should detect optimal description length (120-160 chars)', () => {
      const htmlShort = '<html><head><meta name="description" content="Short" /></head></html>';
      const htmlGood = '<html><head><meta name="description" content="This is a good meta description that is long enough to be optimal and contains useful information about the page content" /></head></html>';
      const htmlLong = '<html><head><meta name="description" content="This is a very long description that exceeds the maximum recommended character limit for meta descriptions and should be truncated to improve user experience in search results" /></head></html>';

      const shortResult = analyzeMetaTags(htmlShort, 'https://example.com');
      const goodResult = analyzeMetaTags(htmlGood, 'https://example.com');
      const longResult = analyzeMetaTags(htmlLong, 'https://example.com');

      expect(shortResult.description.optimal).toBe(false);
      expect(goodResult.description.optimal).toBe(true);
      expect(longResult.description.optimal).toBe(false);
    });

    it('should detect canonical URL', () => {
      const htmlWithCanonical = '<html><head><link rel="canonical" href="https://example.com" /></head></html>';
      const htmlWithoutCanonical = '<html><head></head></html>';

      const resultWith = analyzeMetaTags(htmlWithCanonical, 'https://example.com');
      const resultWithout = analyzeMetaTags(htmlWithoutCanonical, 'https://example.com');

      expect(resultWith.canonical.present).toBe(true);
      expect(resultWithout.canonical.present).toBe(false);
    });

    it('should detect viewport meta tag', () => {
      const htmlWithViewport = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head></html>';
      const htmlWithoutViewport = '<html><head></head></html>';

      const resultWith = analyzeMetaTags(htmlWithViewport, 'https://example.com');
      const resultWithout = analyzeMetaTags(htmlWithoutViewport, 'https://example.com');

      expect(resultWith.viewport.present).toBe(true);
      expect(resultWith.viewport.optimal).toBe(true);
      expect(resultWithout.viewport.present).toBe(false);
    });

    it('should calculate score correctly', () => {
      const htmlComplete = `
        <html>
          <head>
            <title>Good Title for SEO</title>
            <meta name="description" content="This is a complete meta description with all the necessary content for optimal SEO results" />
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="canonical" href="https://example.com" />
          </head>
        </html>
      `;

      const result = analyzeMetaTags(htmlComplete, 'https://example.com');
      expect(result.score).toBeGreaterThan(50);
    });
  });

  describe('getMetaTagBadgeVariant', () => {
    it('should return success for optimal tags', () => {
      expect(getMetaTagBadgeVariant(true, true)).toBe('success');
    });

    it('should return warning for present but not optimal', () => {
      expect(getMetaTagBadgeVariant(false, true)).toBe('warning');
    });

    it('should return destructive for missing tags', () => {
      expect(getMetaTagBadgeVariant(false, false)).toBe('destructive');
    });
  });

  describe('getMetaTagStatus', () => {
    it('should return Optimal', () => {
      expect(getMetaTagStatus(true, true)).toBe('Optimal');
    });

    it('should return Present but needs improvement', () => {
      expect(getMetaTagStatus(false, true)).toBe('Present but needs improvement');
    });

    it('should return Missing', () => {
      expect(getMetaTagStatus(false, false)).toBe('Missing');
    });
  });

  describe('formatMetaContent', () => {
    it('should return em dash for empty content', () => {
      expect(formatMetaContent('')).toBe('—');
    });

    it('should truncate long content', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = formatMetaContent(longText, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBeLessThanOrEqual(26);
    });

    it('should not truncate short content', () => {
      const shortText = 'Short';
      expect(formatMetaContent(shortText, 20)).toBe('Short');
    });
  });

  describe('getMetaScoreBadgeVariant', () => {
    it('should return success for high scores', () => {
      expect(getMetaScoreBadgeVariant(85)).toBe('success');
      expect(getMetaScoreBadgeVariant(90)).toBe('success');
    });

    it('should return warning for medium scores', () => {
      expect(getMetaScoreBadgeVariant(60)).toBe('warning');
      expect(getMetaScoreBadgeVariant(70)).toBe('warning');
    });

    it('should return destructive for low scores', () => {
      expect(getMetaScoreBadgeVariant(30)).toBe('destructive');
      expect(getMetaScoreBadgeVariant(0)).toBe('destructive');
    });
  });

  describe('getMetaScoreRating', () => {
    it('should rate Excellent', () => {
      expect(getMetaScoreRating(90)).toBe('Excellent');
      expect(getMetaScoreRating(80)).toBe('Excellent');
    });

    it('should rate Good', () => {
      expect(getMetaScoreRating(70)).toBe('Good');
      expect(getMetaScoreRating(60)).toBe('Good');
    });

    it('should rate Fair', () => {
      expect(getMetaScoreRating(50)).toBe('Fair');
      expect(getMetaScoreRating(40)).toBe('Fair');
    });

    it('should rate Poor', () => {
      expect(getMetaScoreRating(30)).toBe('Poor');
      expect(getMetaScoreRating(0)).toBe('Poor');
    });
  });

  describe('Open Graph Tags', () => {
    it('should detect OG title', () => {
      const html = '<html><head><meta property="og:title" content="OG Title" /></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.ogTitle.present).toBe(true);
      expect(result.ogTitle.content).toBe('OG Title');
    });

    it('should detect OG description', () => {
      const html = '<html><head><meta property="og:description" content="OG Description" /></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.ogDescription.present).toBe(true);
    });

    it('should detect OG image', () => {
      const html = '<html><head><meta property="og:image" content="https://example.com/image.jpg" /></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.ogImage.present).toBe(true);
    });
  });

  describe('Twitter Card', () => {
    it('should detect twitter card', () => {
      const html = '<html><head><meta name="twitter:card" content="summary" /></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.twitterCard.present).toBe(true);
      expect(result.twitterCard.optimal).toBe(true);
    });

    it('should validate twitter card type', () => {
      const htmlValid = '<html><head><meta name="twitter:card" content="summary_large_image" /></head></html>';
      const htmlInvalid = '<html><head><meta name="twitter:card" content="invalid" /></head></html>';

      const resultValid = analyzeMetaTags(htmlValid, 'https://example.com');
      const resultInvalid = analyzeMetaTags(htmlInvalid, 'https://example.com');

      expect(resultValid.twitterCard.optimal).toBe(true);
      expect(resultInvalid.twitterCard.optimal).toBe(false);
    });
  });

  describe('Robots Meta Tag', () => {
    it('should detect robots meta tag', () => {
      const html = '<html><head><meta name="robots" content="index, follow" /></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.robots.present).toBe(true);
      expect(result.robots.optimal).toBe(true);
    });

    it('should detect noindex', () => {
      const html = '<html><head><meta name="robots" content="noindex, follow" /></head></html>';
      const result = analyzeMetaTags(html, 'https://example.com');
      expect(result.robots.optimal).toBe(false);
    });
  });
});
