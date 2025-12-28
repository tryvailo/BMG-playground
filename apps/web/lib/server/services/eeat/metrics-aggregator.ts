/**
 * Metrics Aggregator
 *
 * Aggregates E-E-A-T audit results from multiple pages to calculate
 * percentage metrics as required by the specification.
 */

import type {
  EEATAuditResult,
  AuthorMetrics,
  DoctorExpertiseMetrics,
  ScientificSourcesMetrics,
} from './types';

/**
 * Calculate author metrics from multiple page results
 */
export function calculateAuthorMetrics(
  results: EEATAuditResult[],
): AuthorMetrics {
  // Filter to only article pages
  const articleResults = results.filter(
    (r) => r.authorship.article_author?.is_article === true,
  );

  const totalArticles = articleResults.length;
  const articlesWithAuthor = articleResults.filter(
    (r) => r.authorship.article_author?.has_author_block === true,
  ).length;

  // Calculate percentage of articles with authors
  const blogPagesWithAuthorPercent =
    totalArticles > 0 ? Math.round((articlesWithAuthor / totalArticles) * 100) : 0;

  // Count authors with credentials
  // This includes both article authors and author profiles
  const authorsWithCredentials = results.filter(
    (r) =>
      (r.authorship.article_author?.has_author_block === true &&
        r.authorship.author_credentials_found === true) ||
      (r.authorship.author_profile?.has_qualifications === true),
  ).length;

  const totalAuthors = results.filter(
    (r) =>
      r.authorship.article_author?.has_author_block === true ||
      r.authorship.author_profile !== undefined,
  ).length;

  const authorsWithCredentialsPercent =
    totalAuthors > 0 ? Math.round((authorsWithCredentials / totalAuthors) * 100) : 0;

  // Count medical authors
  const articlesWithMedicalAuthor = articleResults.filter(
    (r) => r.authorship.article_author?.is_medical_author === true,
  ).length;

  const blogPagesWithMedicalAuthorPercent =
    totalArticles > 0 ? Math.round((articlesWithMedicalAuthor / totalArticles) * 100) : 0;

  return {
    blog_pages_with_author_percent: blogPagesWithAuthorPercent,
    authors_with_credentials_percent: authorsWithCredentialsPercent,
    total_articles: totalArticles,
    articles_with_author: articlesWithAuthor,
    blog_pages_with_medical_author_percent: blogPagesWithMedicalAuthorPercent,
  };
}

/**
 * Calculate doctor expertise metrics from multiple page results
 */
export function calculateDoctorExpertiseMetrics(
  results: EEATAuditResult[],
): DoctorExpertiseMetrics | undefined {
  // Filter to doctor/team pages (URLs containing /doctors/, /team/, etc.)
  // We'll identify them by checking if they have author blocks or are doctor profile pages
  const doctorPages = results.filter(
    (r) =>
      r.authorship.has_author_blocks === true ||
      r.authorship.author_profile !== undefined,
  );

  if (doctorPages.length === 0) {
    return undefined;
  }

  // Check for credentials
  const doctorPagesWithCredentials = doctorPages.filter(
    (r) =>
      r.authorship.author_credentials_found === true ||
      r.authorship.author_profile?.has_credentials_links === true,
  ).length;

  const totalDoctorPages = doctorPages.length;

  const doctorPagesWithCredentialsPercent =
    totalDoctorPages > 0
      ? Math.round((doctorPagesWithCredentials / totalDoctorPages) * 100)
      : 0;

  return {
    doctor_pages_with_credentials_percent: doctorPagesWithCredentialsPercent,
    total_doctor_pages: totalDoctorPages,
    doctor_pages_with_credentials: doctorPagesWithCredentials,
  };
}

/**
 * Calculate scientific sources metrics from multiple page results
 */
export function calculateScientificSourcesMetrics(
  results: EEATAuditResult[],
): ScientificSourcesMetrics | undefined {
  // Filter to article pages (medical articles)
  const articleResults = results.filter(
    (r) => r.authorship.article_author?.is_article === true,
  );

  if (articleResults.length === 0) {
    return undefined;
  }

  const articlesWithSources = articleResults.filter(
    (r) => r.authority.scientific_sources_count > 0,
  ).length;

  const totalArticles = articleResults.length;

  const articlesWithSourcesPercent =
    totalArticles > 0 ? Math.round((articlesWithSources / totalArticles) * 100) : 0;

  return {
    total_articles: totalArticles,
    articles_with_sources: articlesWithSources,
    articles_with_sources_percent: articlesWithSourcesPercent,
  };
}

/**
 * Aggregate all metrics from multiple page results
 */
export function aggregateMetrics(results: EEATAuditResult[]): {
  authorMetrics: AuthorMetrics;
  doctorMetrics?: DoctorExpertiseMetrics;
  scientificMetrics?: ScientificSourcesMetrics;
} {
  return {
    authorMetrics: calculateAuthorMetrics(results),
    doctorMetrics: calculateDoctorExpertiseMetrics(results),
    scientificMetrics: calculateScientificSourcesMetrics(results),
  };
}
