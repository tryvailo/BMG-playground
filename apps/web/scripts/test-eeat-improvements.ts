/**
 * Test E-E-A-T Improvements (Comprehensive)
 * 
 * Verifies medical author detection, aggregator rating fetching, and aggregated metrics.
 */

import { analyzeEEAT, analyzeMultiplePages } from '../lib/server/services/eeat/eeat-analyzer';
import { calculateAuthorMetrics } from '../lib/server/services/eeat/metrics-aggregator';
import type { EEATAuditResult } from '../lib/server/services/eeat/types';

async function testEEATImprovements() {
  console.log('--- Testing E-E-A-T Improvements ---');

  // 1. Mock results for aggregation test
  const results: EEATAuditResult[] = [
    {
      authorship: {
        has_author_blocks: true,
        author_credentials_found: true,
        article_author: {
          is_article: true,
          has_author_block: true,
          has_author_profile_link: true,
          author_name: 'Dr. Ivanov',
          is_medical_author: true,
        },
      },
      trust: { has_privacy_policy: true, has_licenses: true, contact_page_found: true, nap_present: true },
      authority: { scientific_sources_count: 5, has_community_mentions: true },
      reputation: { linked_platforms: ['Google Maps'], social_links: [] },
      experience: { has_case_studies: true, experience_figures_found: true },
      recommendations: [],
      analysis_scope: 'single_page',
    },
    {
      authorship: {
        has_author_blocks: true,
        author_credentials_found: false,
        article_author: {
          is_article: true,
          has_author_block: true,
          has_author_profile_link: false,
          author_name: 'General Editor',
          is_medical_author: false,
        },
      },
      trust: { has_privacy_policy: true, has_licenses: true, contact_page_found: true, nap_present: true },
      authority: { scientific_sources_count: 0, has_community_mentions: false },
      reputation: { linked_platforms: [], social_links: [] },
      experience: { has_case_studies: false, experience_figures_found: false },
      recommendations: [],
      analysis_scope: 'single_page',
    }
  ];

  console.log('Testing calculateAuthorMetrics...');
  const metrics = calculateAuthorMetrics(results);

  console.log('Total Articles:', metrics.total_articles);
  console.log('Articles with Medical Author Percentage:', metrics.blog_pages_with_medical_author_percent + '%');

  if (metrics.blog_pages_with_medical_author_percent === 50) {
    console.log('✅ Medical author percentage correctly calculated (50%)!');
  } else {
    console.log('❌ Medical author percentage calculation FAILED. Expected 50, got:', metrics.blog_pages_with_medical_author_percent);
  }

  // 2. Mock HTML for single-page analysis
  const mockHtml = `
    <html>
      <body>
        <article>
          <h1>How to treat heart disease</h1>
          <div class="author-block">
            Автор: <a href="/doctors/ivanov">Іванов Іван, к.м.н., кардіолог</a>
          </div>
          <div class="reputation">
            <a href="https://doc.ua/doctor/kiev/ivan-ivanov">Наш рейтинг на doc.ua</a>
          </div>
        </article>
      </body>
    </html>
  `;

  console.log('\nRunning analyzeEEAT on mock HTML...');
  const result = await analyzeEEAT(mockHtml, 'https://clinic.example.com/blog/heart-disease');

  console.log('Is Medical Author:', result.authorship.article_author?.is_medical_author);
  console.log('Linked Platforms:', result.reputation.linked_platforms);

  if (result.authorship.article_author?.is_medical_author === true) {
    console.log('✅ Medical author successfully detected via HTML analysis!');
  } else {
    console.log('❌ Medical author NOT detected via HTML analysis.');
  }

  if (result.reputation.linked_platforms.includes('Doc.ua')) {
    console.log('✅ Doc.ua platform successfully detected!');
  } else {
    console.log('❌ Doc.ua platform NOT detected.');
  }
}

testEEATImprovements().catch(console.error);
