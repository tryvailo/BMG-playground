/**
 * Schema.org Structured Data Validator
 * Week 3, Days 3: Tech Audit
 * Validates 8 main schema types for SEO
 */

export interface SchemaValidationResult {
  type: string;
  present: boolean;
  valid: boolean;
  count: number;
  issues: string[];
  recommendations: string[];
}

export interface SchemaAuditResult {
  url: string;
  schemas: Record<string, SchemaValidationResult>;
  totalScore: number; // 0-100
  criticalIssues: number;
  warningIssues: number;
  timestamp: Date;
}

/**
 * Main schema types to validate
 */
const SCHEMA_TYPES = [
  'Organization',
  'LocalBusiness',
  'Product',
  'Article',
  'BreadcrumbList',
  'FAQPage',
  'VideoObject',
  'AggregateRating',
];

/**
 * Validate schema.org structured data from HTML
 */
export function validateSchemas(html: string): SchemaAuditResult {
  const schemas: Record<string, SchemaValidationResult> = {};
  let criticalIssues = 0;
  let warningIssues = 0;

  for (const schemaType of SCHEMA_TYPES) {
    const result = validateSchema(html, schemaType);
    schemas[schemaType] = result;

    if (!result.valid && result.present) {
      criticalIssues++;
    } else if (!result.present) {
      warningIssues++;
    }
  }

  // Calculate total score: each present schema = 12.5 points (8 types)
  const presentSchemas = Object.values(schemas).filter((s) => s.present && s.valid)
    .length;
  const totalScore = Math.min(100, (presentSchemas / SCHEMA_TYPES.length) * 100);

  return {
    url: '',
    schemas,
    totalScore: Math.round(totalScore),
    criticalIssues,
    warningIssues,
    timestamp: new Date(),
  };
}

/**
 * Validate single schema type
 */
function validateSchema(html: string, schemaType: string): SchemaValidationResult {
  // Look for JSON-LD scripts
  const jsonLdRegex = /"@type"\s*:\s*"([^"]+)"/g;
  const microDataRegex = new RegExp(`itemtype="[^"]*${schemaType}[^"]*"`, 'i');

  let matches = 0;
  let valid = false;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check JSON-LD
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    if (match[1] === schemaType) {
      matches++;
      valid = validateSchemaStructure(html, schemaType, 'json-ld');
    }
  }

  // Check microdata
  if (microDataRegex.test(html)) {
    matches++;
    valid = validateSchemaStructure(html, schemaType, 'microdata');
  }

  if (matches === 0) {
    recommendations.push(`Add ${schemaType} schema to improve SEO`);
  }

  if (matches > 0 && !valid) {
    issues.push(`${schemaType} schema is present but may have missing required fields`);
    getSchemaRequiredFields(schemaType).forEach((field) => {
      if (!html.includes(`"${field}"`)) {
        issues.push(`Missing required field: ${field}`);
      }
    });
  }

  return {
    type: schemaType,
    present: matches > 0,
    valid: valid && matches > 0,
    count: matches,
    issues,
    recommendations,
  };
}

/**
 * Validate schema structure
 */
function validateSchemaStructure(
  html: string,
  schemaType: string,
  format: 'json-ld' | 'microdata'
): boolean {
  const requiredFields = getSchemaRequiredFields(schemaType);

  if (format === 'json-ld') {
    // Simple validation: check if required fields are present
    return requiredFields.some((field) => html.includes(`"${field}"`));
  } else {
    return requiredFields.some((field) =>
      html.includes(`itemprop="${field}"`)
    );
  }
}

/**
 * Get required fields for each schema type
 */
function getSchemaRequiredFields(schemaType: string): string[] {
  const fields: Record<string, string[]> = {
    Organization: ['name', 'url', 'logo', 'sameAs'],
    LocalBusiness: ['name', 'address', 'telephone', 'url'],
    Product: ['name', 'description', 'image', 'offers'],
    Article: ['headline', 'datePublished', 'author', 'image'],
    BreadcrumbList: ['itemListElement', 'position', 'name'],
    FAQPage: ['mainEntity', 'question', 'acceptedAnswer'],
    VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
    AggregateRating: ['ratingValue', 'ratingCount', 'bestRating'],
  };

  return fields[schemaType] || [];
}

/**
 * Get recommended schema types based on content
 */
export function getRecommendedSchemas(html: string): string[] {
  const recommended: string[] = [];

  if (html.includes('article') || html.includes('blog')) {
    recommended.push('Article');
  }

  if (html.includes('video') || html.includes('youtube')) {
    recommended.push('VideoObject');
  }

  if (html.includes('product') || html.includes('price')) {
    recommended.push('Product');
  }

  if (html.includes('faq') || html.includes('question')) {
    recommended.push('FAQPage');
  }

  if (html.includes('address') || html.includes('phone')) {
    recommended.push('LocalBusiness');
  }

  if (!html.includes('breadcrumb')) {
    recommended.push('BreadcrumbList');
  }

  return [...new Set(recommended)];
}

/**
 * Generate schema.org JSON-LD template
 */
export function generateSchemaTemplate(
  schemaType: string,
  data: Record<string, unknown>
): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    ...data,
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Validate schema JSON
 */
export function validateSchemaJson(
  json: string,
  schemaType: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(json);

    if (parsed['@type'] !== schemaType) {
      errors.push(
        `Schema type mismatch. Expected ${schemaType}, got ${parsed['@type']}`
      );
    }

    if (!parsed['@context']) {
      errors.push('Missing @context field');
    }

    const requiredFields = getSchemaRequiredFields(schemaType);
    requiredFields.forEach((field) => {
      if (!parsed[field] && !parsed[field.toLowerCase()]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        error instanceof Error ? error.message : 'Invalid JSON',
      ],
    };
  }
}

/**
 * Get badge variant for schema score
 */
export function getSchemaScoreBadgeVariant(
  score: number
): 'success' | 'warning' | 'destructive' | 'outline' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'destructive';
}

/**
 * Get schema score rating
 */
export function getSchemaScoreRating(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 25) return 'Fair';
  return 'Poor';
}
