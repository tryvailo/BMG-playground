/**
 * Script to verify duplicate content detection results
 * Tests specific URL pairs that were flagged as duplicates
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (_error) {
  console.warn('Could not load .env.local file');
}

import { crawlSiteContent } from '../lib/modules/audit/firecrawl-service';
import { analyzeContentDuplicates } from '../lib/utils/duplicate-analyzer';

// Test URLs from user's results
const testUrls = [
  'https://complimed.com.ua/author/admin/',
  'https://complimed.com.ua/category/%d0%b1%d0%b5%d0%b7-%d1%80%d1%83%d0%b1%d1%80%d0%b8%d0%ba%d0%b8-uk/',
  'https://complimed.com.ua/blog-2/',
];

interface TestResult {
  url: string;
  title: string;
  contentLength: number;
  wordCount: number;
  shingleCount: number;
  preview: string;
}

async function fetchAndAnalyzePages(urls: string[]) {
  console.log('🔍 Fetching pages...\n');
  
  const pages = await crawlSiteContent(urls[0]!, 50);
  
  // Filter to only the pages we're testing
  const testPages = pages.filter((page) => {
    const pageUrl = page.metadata.url;
    return urls.some((testUrl) => {
      // Normalize URLs for comparison
      const normalizedTestUrl = decodeURIComponent(testUrl).toLowerCase();
      const normalizedPageUrl = pageUrl.toLowerCase();
      return normalizedPageUrl.includes(normalizedTestUrl) || 
             normalizedTestUrl.includes(normalizedPageUrl);
    });
  });

  console.log(`📄 Found ${testPages.length} test pages out of ${pages.length} total pages\n`);

  // Display page info
  const pageInfo: TestResult[] = [];
  for (const page of testPages) {
    const content = page.markdown || page.content || '';
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const preview = content.substring(0, 200).replace(/\n/g, ' ').trim();
    
    pageInfo.push({
      url: page.metadata.url,
      title: page.metadata.title || 'Untitled',
      contentLength: content.length,
      wordCount: words.length,
      shingleCount: 0, // Will calculate
      preview: preview + (content.length > 200 ? '...' : ''),
    });
  }

  console.log('📋 Page Information:');
  console.log('='.repeat(80));
  pageInfo.forEach((info, idx) => {
    console.log(`\n${idx + 1}. ${info.title}`);
    console.log(`   URL: ${info.url}`);
    console.log(`   Content Length: ${info.contentLength} chars`);
    console.log(`   Word Count: ${info.wordCount} words`);
    console.log(`   Preview: ${info.preview}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  // Run duplicate analysis
  console.log('🔬 Running duplicate analysis...\n');
  const analysis = analyzeContentDuplicates(testPages);

  console.log('📊 Analysis Results:');
  console.log('='.repeat(80));
  console.log(`Pages Scanned: ${analysis.pagesScanned}`);
  console.log(`Duplicates Found: ${analysis.duplicatesFound}\n`);

  if (analysis.results.length > 0) {
    console.log('🔴 Duplicate Pairs:');
    analysis.results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. Similarity: ${result.similarity}%`);
      console.log(`   Page A: ${result.titleA}`);
      console.log(`   URL: ${result.urlA}`);
      console.log(`   Page B: ${result.titleB}`);
      console.log(`   URL: ${result.urlB}`);
    });
  } else {
    console.log('✅ No duplicates found in the test pages');
  }

  // Manual comparison for specific pairs
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Manual Content Comparison:\n');

  if (testPages.length >= 2) {
    const page1 = testPages[0]!;
    const page2 = testPages[1]!;
    
    const content1 = (page1.markdown || page1.content || '').trim();
    const content2 = (page2.markdown || page2.content || '').trim();
    
    console.log(`Comparing:`);
    console.log(`  A: ${page1.metadata.title || page1.metadata.url}`);
    console.log(`  B: ${page2.metadata.title || page2.metadata.url}\n`);
    
    console.log(`Content A length: ${content1.length} chars`);
    console.log(`Content B length: ${content2.length} chars`);
    console.log(`Length difference: ${Math.abs(content1.length - content2.length)} chars\n`);
    
    // Show first 500 chars of each
    console.log('First 500 chars of A:');
    console.log('-'.repeat(80));
    console.log(content1.substring(0, 500));
    console.log('-'.repeat(80) + '\n');
    
    console.log('First 500 chars of B:');
    console.log('-'.repeat(80));
    console.log(content2.substring(0, 500));
    console.log('-'.repeat(80) + '\n');
    
    // Check if content is identical
    if (content1 === content2) {
      console.log('⚠️  WARNING: Content is 100% identical (exact match)');
    } else {
      const similarity = analysis.results.find(
        (r) => 
          (r.urlA === page1.metadata.url && r.urlB === page2.metadata.url) ||
          (r.urlA === page2.metadata.url && r.urlB === page1.metadata.url)
      );
      if (similarity) {
        console.log(`✅ Algorithm detected ${similarity.similarity}% similarity`);
      }
    }
  }

  return { pages: testPages, analysis, pageInfo };
}

async function main() {
  try {
    console.log('🚀 Starting Duplicate Content Verification\n');
    console.log('Test URLs:');
    testUrls.forEach((url, idx) => {
      console.log(`  ${idx + 1}. ${url}`);
    });
    console.log('');

    const _result = await fetchAndAnalyzePages(testUrls);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verification Complete');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();

