/**
 * Script to verify specific duplicate pairs found by the algorithm
 * Tests the exact URL pairs that were flagged
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
} catch (error) {
  console.warn('Could not load .env.local file');
}

import { crawlSiteContent } from '../lib/modules/audit/firecrawl-service';
import { analyzeContentDuplicates } from '../lib/utils/duplicate-analyzer';

// Specific pairs to test from user's results
const testPairs = [
  {
    name: 'Pair 1: Author vs Category (100% Match)',
    urlA: 'https://complimed.com.ua/author/admin/',
    urlB: 'https://complimed.com.ua/category/%d0%b1%d0%b5%d0%b7-%d1%80%d1%83%d0%b1%d1%80%d0%b8%d0%ba%d0%b8-uk/',
    expectedSimilarity: 100,
  },
  {
    name: 'Pair 2: Author vs Blog (95% Match)',
    urlA: 'https://complimed.com.ua/author/admin/',
    urlB: 'https://complimed.com.ua/blog-2/',
    expectedSimilarity: 95,
  },
];

async function fetchSinglePage(url: string) {
  console.log(`📥 Fetching: ${url}`);
  const pages = await crawlSiteContent(url, 1);
  if (pages.length === 0) {
    throw new Error(`No content found for ${url}`);
  }
  return pages[0]!;
}

function extractTextContent(markdown: string): string {
  // Remove markdown links, images, headers
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

function calculateSimpleSimilarity(textA: string, textB: string): number {
  const wordsA = textA.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const wordsB = textB.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  
  let intersection = 0;
  setA.forEach((word) => {
    if (setB.has(word)) {
      intersection++;
    }
  });
  
  const union = setA.size + setB.size - intersection;
  return union > 0 ? (intersection / union) * 100 : 0;
}

async function testPair(pair: typeof testPairs[0]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${pair.name}`);
  console.log('='.repeat(80));
  
  try {
    const pageA = await fetchSinglePage(pair.urlA);
    const pageB = await fetchSinglePage(pair.urlB);
    
    const contentA = pageA.markdown || pageA.content || '';
    const contentB = pageB.markdown || pageB.content || '';
    
    const textA = extractTextContent(contentA);
    const textB = extractTextContent(contentB);
    
    console.log(`\n📄 Page A: ${pageA.metadata.title || 'Untitled'}`);
    console.log(`   URL: ${pageA.metadata.url}`);
    console.log(`   Raw Content Length: ${contentA.length} chars`);
    console.log(`   Text Content Length: ${textA.length} chars`);
    console.log(`   Word Count: ${textA.split(/\s+/).length} words`);
    
    console.log(`\n📄 Page B: ${pageB.metadata.title || 'Untitled'}`);
    console.log(`   URL: ${pageB.metadata.url}`);
    console.log(`   Raw Content Length: ${contentB.length} chars`);
    console.log(`   Text Content Length: ${textB.length} chars`);
    console.log(`   Word Count: ${textB.split(/\s+/).length} words`);
    
    // Run algorithm
    console.log(`\n🔬 Running duplicate analysis algorithm...`);
    const analysis = analyzeContentDuplicates([pageA, pageB]);
    
    const foundPair = analysis.results.find(
      (r) =>
        (r.urlA === pageA.metadata.url && r.urlB === pageB.metadata.url) ||
        (r.urlA === pageB.metadata.url && r.urlB === pageA.metadata.url)
    );
    
    if (foundPair) {
      console.log(`\n✅ Algorithm Result:`);
      console.log(`   Similarity: ${foundPair.similarity}%`);
      console.log(`   Expected: ${pair.expectedSimilarity}%`);
      console.log(`   Difference: ${Math.abs(foundPair.similarity - pair.expectedSimilarity)}%`);
      
      if (Math.abs(foundPair.similarity - pair.expectedSimilarity) < 5) {
        console.log(`   ✅ Result matches expected (within 5% tolerance)`);
      } else {
        console.log(`   ⚠️  Result differs from expected`);
      }
    } else {
      console.log(`\n❌ Algorithm did NOT detect this as a duplicate`);
      console.log(`   Expected similarity: ${pair.expectedSimilarity}%`);
      console.log(`   Threshold: 85%`);
    }
    
    // Simple word-based comparison
    const simpleSimilarity = calculateSimpleSimilarity(textA, textB);
    console.log(`\n📊 Simple Word-Based Similarity: ${simpleSimilarity.toFixed(2)}%`);
    
    // Show content previews
    console.log(`\n📝 Content Preview A (first 300 chars):`);
    console.log('-'.repeat(80));
    console.log(textA.substring(0, 300) + '...');
    console.log('-'.repeat(80));
    
    console.log(`\n📝 Content Preview B (first 300 chars):`);
    console.log('-'.repeat(80));
    console.log(textB.substring(0, 300) + '...');
    console.log('-'.repeat(80));
    
    // Check if content is identical
    if (contentA.trim() === contentB.trim()) {
      console.log(`\n⚠️  WARNING: Raw content is 100% identical (exact match)`);
    } else if (textA === textB) {
      console.log(`\n⚠️  WARNING: Text content is 100% identical (after extraction)`);
    }
    
    return { pageA, pageB, analysis, foundPair, simpleSimilarity };
  } catch (error) {
    console.error(`\n❌ Error testing pair:`, error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Specific Duplicate Pair Verification\n');
  
  const results = [];
  
  for (const pair of testPairs) {
    const result = await testPair(pair);
    results.push({ pair, result });
    
    // Wait between requests
    if (pair !== testPairs[testPairs.length - 1]) {
      console.log(`\n⏳ Waiting 3 seconds before next test...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 Summary');
  console.log('='.repeat(80));
  
  results.forEach(({ pair, result }, idx) => {
    console.log(`\n${idx + 1}. ${pair.name}`);
    if (result && result.foundPair) {
      console.log(`   ✅ Detected: ${result.foundPair.similarity}% (Expected: ${pair.expectedSimilarity}%)`);
    } else {
      console.log(`   ❌ NOT Detected (Expected: ${pair.expectedSimilarity}%)`);
    }
  });
  
  console.log(`\n✅ Verification Complete`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

