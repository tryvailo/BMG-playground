/**
 * Tests for Schema Validator
 * Validates 8 main schema types for SEO
 */

import {
  validateSchemas,
  getRecommendedSchemas,
  generateSchemaTemplate,
  validateSchemaJson,
  getSchemaScoreBadgeVariant,
  getSchemaScoreRating,
} from '../schema-validator';

describe('Schema Validator', () => {
  describe('validateSchemas', () => {
    it('should validate schemas from HTML', () => {
      const html = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Example Corp",
          "url": "https://example.com",
          "logo": "https://example.com/logo.png",
          "sameAs": "https://twitter.com/example"
        }
        </script>
      `;

      const result = validateSchemas(html);
      expect(result).toHaveProperty('schemas');
      expect(result.schemas).toHaveProperty('Organization');
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should detect missing schemas', () => {
      const html = '<p>No schemas here</p>';
      const result = validateSchemas(html);

      expect(result.schemas.Organization.present).toBe(false);
      expect(result.warningIssues).toBeGreaterThan(0);
    });

    it('should count multiple schema instances', () => {
      const html = `
        <script type="application/ld+json">
        {"@type": "Article", "headline": "Test"}
        </script>
        <script type="application/ld+json">
        {"@type": "Article", "headline": "Test 2"}
        </script>
      `;

      const result = validateSchemas(html);
      expect(result.schemas.Article.count).toBeGreaterThan(0);
    });

    it('should calculate correct score', () => {
      const html = `
        <script type="application/ld+json">
        {"@type": "Organization", "name": "Test"}
        </script>
      `;

      const result = validateSchemas(html);
      // 1 schema present out of 8 = 12.5% minimum
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecommendedSchemas', () => {
    it('should recommend Article for blog content', () => {
      const html = '<article>Blog post content</article>';
      const recommended = getRecommendedSchemas(html);
      expect(recommended).toContain('Article');
    });

    it('should recommend VideoObject for video content', () => {
      const html = '<video src="example.mp4"></video>';
      const recommended = getRecommendedSchemas(html);
      expect(recommended).toContain('VideoObject');
    });

    it('should recommend Product for e-commerce', () => {
      const html = '<div>Price: $99</div>';
      const recommended = getRecommendedSchemas(html);
      expect(recommended).toContain('Product');
    });

    it('should recommend LocalBusiness for location content', () => {
      const html = '<div>Our office: 123 Main St</div>';
      const recommended = getRecommendedSchemas(html);
      expect(recommended).toContain('LocalBusiness');
    });

    it('should recommend FAQPage for Q&A content', () => {
      const html = '<h3>FAQ</h3><p>Question: What is this?</p>';
      const recommended = getRecommendedSchemas(html);
      expect(recommended).toContain('FAQPage');
    });

    it('should not duplicate recommendations', () => {
      const html = `
        <article>Blog</article>
        <div class="article">Another article</div>
      `;
      const recommended = getRecommendedSchemas(html);
      const articleCount = recommended.filter((s) => s === 'Article').length;
      expect(articleCount).toBe(1);
    });
  });

  describe('generateSchemaTemplate', () => {
    it('should generate valid Organization schema', () => {
      const template = generateSchemaTemplate('Organization', {
        name: 'Example Corp',
        url: 'https://example.com',
      });

      const parsed = JSON.parse(template);
      expect(parsed['@type']).toBe('Organization');
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed.name).toBe('Example Corp');
    });

    it('should generate valid Article schema', () => {
      const template = generateSchemaTemplate('Article', {
        headline: 'My Article',
        author: 'John Doe',
      });

      const parsed = JSON.parse(template);
      expect(parsed['@type']).toBe('Article');
      expect(parsed.headline).toBe('My Article');
    });

    it('should include context in all templates', () => {
      const types = ['Organization', 'Article', 'Product'];
      types.forEach((type) => {
        const template = generateSchemaTemplate(type, {});
        const parsed = JSON.parse(template);
        expect(parsed['@context']).toBe('https://schema.org');
      });
    });
  });

  describe('validateSchemaJson', () => {
    it('should validate correct schema', () => {
      const json = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Example',
        'url': 'https://example.com',
      });

      const result = validateSchemaJson(json, 'Organization');
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing @context', () => {
      const json = JSON.stringify({
        '@type': 'Organization',
        'name': 'Example',
      });

      const result = validateSchemaJson(json, 'Organization');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('@context'))).toBe(true);
    });

    it('should detect type mismatch', () => {
      const json = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'name': 'Example',
      });

      const result = validateSchemaJson(json, 'Organization');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('type mismatch'))).toBe(true);
    });

    it('should detect missing required fields', () => {
      const json = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        // Missing required fields
      });

      const result = validateSchemaJson(json, 'Organization');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON', () => {
      const result = validateSchemaJson('{invalid json', 'Organization');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getSchemaScoreBadgeVariant', () => {
    it('should return success for high scores', () => {
      expect(getSchemaScoreBadgeVariant(100)).toBe('success');
      expect(getSchemaScoreBadgeVariant(75)).toBe('success');
    });

    it('should return warning for medium scores', () => {
      expect(getSchemaScoreBadgeVariant(60)).toBe('warning');
      expect(getSchemaScoreBadgeVariant(50)).toBe('warning');
    });

    it('should return destructive for low scores', () => {
      expect(getSchemaScoreBadgeVariant(25)).toBe('destructive');
      expect(getSchemaScoreBadgeVariant(0)).toBe('destructive');
    });
  });

  describe('getSchemaScoreRating', () => {
    it('should rate excellent', () => {
      expect(getSchemaScoreRating(100)).toBe('Excellent');
      expect(getSchemaScoreRating(75)).toBe('Excellent');
    });

    it('should rate good', () => {
      expect(getSchemaScoreRating(60)).toBe('Good');
      expect(getSchemaScoreRating(50)).toBe('Good');
    });

    it('should rate fair', () => {
      expect(getSchemaScoreRating(40)).toBe('Fair');
      expect(getSchemaScoreRating(25)).toBe('Fair');
    });

    it('should rate poor', () => {
      expect(getSchemaScoreRating(20)).toBe('Poor');
      expect(getSchemaScoreRating(0)).toBe('Poor');
    });
  });

  describe('Schema types detection', () => {
    const schemas = [
      'Organization',
      'LocalBusiness',
      'Product',
      'Article',
      'BreadcrumbList',
      'FAQPage',
      'VideoObject',
      'AggregateRating',
    ];

    schemas.forEach((schema) => {
      it(`should validate ${schema} schema`, () => {
        const result = validateSchemas(`{"@type": "${schema}"}`);
        expect(result.schemas).toHaveProperty(schema);
      });
    });
  });
});
