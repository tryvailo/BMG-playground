/**
 * This file contains utility functions for duplicate content analysis.
 * It is NOT a server action file - it's a regular module with pure functions.
 * Functions are imported and used in route handlers, not called as server actions.
 * 
 * IMPORTANT: This file must NOT have 'use server' directive.
 * It's a pure utility module that can be used in both server and client contexts.
 */

import type { FirecrawlDocument } from '~/lib/modules/audit/types';

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

/**
 * Duplicate analysis result for a pair of pages
 */
export interface DuplicateResult {
  urlA: string;
  urlB: string;
  similarity: number; // 0-100 formatted
  titleA: string;
  titleB: string;
}

/**
 * Complete duplicate analysis result
 */
export interface DuplicateAnalysisResult {
  pagesScanned: number;
  duplicatesFound: number;
  results: DuplicateResult[];
}

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Clean text: convert to lowercase, remove punctuation and special characters
 */
function cleanText(text: string): string {
  return text
    .toLowerCase()
    // Replace punctuation and special chars with spaces
    .replace(/[^\w\s]/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert text into words array
 */
function textToWords(text: string): string[] {
  const cleaned = cleanText(text);
  return cleaned.split(' ').filter((word) => word.length > 0);
}

/**
 * Create a Set of 3-word shingles from text
 * 
 * Example: "the quick brown fox" -> Set(["the quick brown", "quick brown fox"])
 * 
 * @param text - Input text to shingle
 * @returns Set of 3-word shingle strings
 */
function createShingles(text: string): Set<string> {
  const words = textToWords(text);
  const shingles = new Set<string>();

  // Need at least 3 words to create a shingle
  if (words.length < 3) {
    return shingles;
  }

  // Create shingles of 3 consecutive words
  for (let i = 0; i <= words.length - 3; i++) {
    const shingle = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    shingles.add(shingle);
  }

  return shingles;
}

/**
 * Calculate Jaccard similarity between two sets
 * 
 * Jaccard similarity = |A ∩ B| / |A ∪ B|
 * 
 * @param setA - First set
 * @param setB - Second set
 * @returns Similarity score between 0 and 1
 */
function jaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) {
    return 1.0; // Both empty = identical
  }

  if (setA.size === 0 || setB.size === 0) {
    return 0.0; // One empty, one not = no similarity
  }

  // Calculate intersection
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) {
      intersection++;
    }
  });

  // Calculate union
  const union = setA.size + setB.size - intersection;

  if (union === 0) {
    return 0.0;
  }

  return intersection / union;
}

/**
 * Check if one set is a subset of another (subset detection)
 * 
 * This detects cases where one page contains all content from another page.
 * For example, a blog archive page might contain all posts from an author page.
 * 
 * IMPORTANT: This function only triggers when the smaller page represents a significant
 * portion of the larger page (>= 60%). This prevents false positives where a small
 * mention or block on a larger page is detected as duplicate content.
 * 
 * @param smallerSet - The smaller set (potential subset)
 * @param largerSet - The larger set (potential superset)
 * @param threshold - Minimum percentage of smaller set that must be in larger set (default: 0.85)
 * @param minShinglesForSubset - Minimum number of shingles required for subset detection (default: 10)
 * @param minSizeRatio - Minimum ratio of smaller/larger size to consider subset (default: 0.6 = 60%)
 * @returns Similarity score if subset detected, or null if not a subset
 */
function checkSubsetSimilarity<T>(
  smallerSet: Set<T>,
  largerSet: Set<T>,
  threshold: number = 0.85,
  minShinglesForSubset: number = 10,
  minSizeRatio: number = 0.6,
): number | null {
  if (smallerSet.size === 0 || largerSet.size === 0) {
    return null;
  }

  // Filter out false positives: ignore pages with too few shingles
  // Pages with very little content (e.g., navigation-only pages) should not trigger subset detection
  if (smallerSet.size < minShinglesForSubset) {
    return null;
  }

  // Calculate size ratio: how much of the larger page does the smaller page represent?
  const sizeRatio = smallerSet.size / largerSet.size;

  // CRITICAL: Only consider subset relationship if smaller page represents >= 60% of larger page
  // This prevents false positives where:
  // - A doctor's page (small) is mentioned on a service page (large) - NOT duplicate
  // - A small article block appears on a category page - NOT duplicate
  // - A real archive page contains all posts from author page - IS duplicate (if >= 60%)
  if (sizeRatio < minSizeRatio) {
    // Smaller page is less than 60% of larger page - likely just a mention/block, not duplicate
    return null;
  }

  // Also check if the size ratio is too extreme (e.g., 1 shingle vs 1000 shingles)
  // This prevents false positives from navigation elements matching
  if (sizeRatio < 0.01) {
    // If smaller set is less than 1% of larger set, it's likely just navigation/template elements
    return null;
  }

  // Count how many items from smaller set are in larger set
  let found = 0;
  smallerSet.forEach((item) => {
    if (largerSet.has(item)) {
      found++;
    }
  });

  // Calculate what percentage of smaller set is contained in larger set
  const containmentRatio = found / smallerSet.size;

  // If threshold is met, calculate similarity based on containment
  // We use a formula that gives high similarity (85-95%) for subset relationships
  if (containmentRatio >= threshold) {
    // Scale the containment ratio to 85-95% range for subset relationships
    // This indicates "one page contains most/all of another page"
    const similarity = 0.85 + (containmentRatio - threshold) * (0.1 / (1 - threshold));
    return Math.min(similarity, 0.95); // Cap at 95% for subset relationships
  }

  return null;
}

/**
 * Get page title from FirecrawlDocument
 */
function getPageTitle(doc: FirecrawlDocument): string {
  return doc.metadata?.title || doc.metadata?.url || 'Untitled';
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Analyze content duplicates across crawled pages
 * 
 * This function:
 * 1. Filters out pages with empty markdown
 * 2. Filters out pages with insufficient content (minimum word count)
 * 3. Cleans and preprocesses text
 * 4. Creates 3-word shingles for each page
 * 5. Filters out pages with too few shingles (likely navigation-only pages)
 * 6. Compares all page pairs using Jaccard similarity
 * 7. Identifies duplicates with similarity > 85%
 * 
 * @param pages - Array of FirecrawlDocument pages to analyze
 * @param minWords - Minimum number of words required for a page to be analyzed (default: 50)
 * @param minShingles - Minimum number of shingles required for comparison (default: 10)
 * @param minSizeRatio - Minimum ratio (smaller/larger) for subset detection (default: 0.6 = 60%)
 *                       Prevents false positives where small pages are mentioned on large pages
 * @returns DuplicateAnalysisResult with found duplicates
 * 
 * @example
 * ```typescript
 * const documents = await crawlSiteContent('https://example.com');
 * const duplicates = analyzeContentDuplicates(documents);
 * console.log(`Found ${duplicates.duplicatesFound} duplicate pairs`);
 * ```
 */
export function analyzeContentDuplicates(
  pages: FirecrawlDocument[],
  minWords: number = 50,
  minShingles: number = 10,
  minSizeRatio: number = 0.6,
): DuplicateAnalysisResult {
  // Step 1: Preprocessing - Filter out pages with empty markdown
  let validPages = pages.filter((page) => {
    const content = page.markdown || page.content || '';
    return content.trim().length > 0;
  });

  // Step 1.5: Filter out pages with insufficient content
  // This prevents false positives from pages with only navigation/template elements
  const pagesBeforeWordFilter = validPages.length;
  validPages = validPages.filter((page) => {
    const content = page.markdown || page.content || '';
    const words = textToWords(content);
    const wordCount = words.length;
    
    if (wordCount < minWords) {
      console.log(
        `[DuplicateAnalyzer] Skipping page with insufficient content: ${page.metadata?.url || 'unknown'} (${wordCount} words, minimum: ${minWords})`,
      );
      return false;
    }
    return true;
  });

  const pagesScanned = validPages.length;
  const pagesFiltered = pagesBeforeWordFilter - pagesScanned;

  if (pagesFiltered > 0) {
    console.log(
      `[DuplicateAnalyzer] Filtered out ${pagesFiltered} page(s) with insufficient content (< ${minWords} words)`,
    );
  }

  if (pagesScanned < 2) {
    console.log('[DuplicateAnalyzer] Not enough pages to compare (need at least 2 after filtering)');
    return {
      pagesScanned,
      duplicatesFound: 0,
      results: [],
    };
  }

  console.log(`[DuplicateAnalyzer] Analyzing ${pagesScanned} pages for duplicates...`);

  // Step 2: Preprocess pages - create shingles for each page
  const pageShingles: Array<{ doc: FirecrawlDocument; shingles: Set<string> }> = [];

  for (const page of validPages) {
    const content = page.markdown || page.content || '';
    const shingles = createShingles(content);
    
    // Additional filter: skip pages with too few shingles
    if (shingles.size < minShingles) {
      console.log(
        `[DuplicateAnalyzer] Skipping page with too few shingles: ${page.metadata?.url || 'unknown'} (${shingles.size} shingles, minimum: ${minShingles})`,
      );
      continue;
    }
    
    pageShingles.push({ doc: page, shingles });
  }

  if (pageShingles.length < 2) {
    console.log('[DuplicateAnalyzer] Not enough pages with sufficient shingles to compare');
    return {
      pagesScanned,
      duplicatesFound: 0,
      results: [],
    };
  }

  // Step 3: Compare all unique pairs
  const duplicates: DuplicateResult[] = [];
  const threshold = 0.85; // 85% similarity threshold

  for (let i = 0; i < pageShingles.length; i++) {
    for (let j = i + 1; j < pageShingles.length; j++) {
      const pageA = pageShingles[i];
      const pageB = pageShingles[j];
      
      if (!pageA || !pageB) continue;
      
      const { doc: docA, shingles: shinglesA } = pageA;
      const { doc: docB, shingles: shinglesB } = pageB;

      let similarity: number | null = null;
      let detectionMethod = '';

      // First, try standard Jaccard similarity
      const jaccardSim = jaccardSimilarity(shinglesA, shinglesB);
      
      if (jaccardSim > threshold) {
        similarity = jaccardSim;
        detectionMethod = 'jaccard';
      } else {
        // If Jaccard similarity is below threshold, check for subset relationships
        // This catches cases where one page contains most/all content from another page
        // Use minShingles parameter to prevent false positives from small pages
        
        // Check if A is subset of B (A is smaller and mostly contained in B)
        // Only trigger if A represents >= 60% of B (prevents false positives from mentions/blocks)
        const subsetSimAB = checkSubsetSimilarity(shinglesA, shinglesB, 0.85, minShingles, minSizeRatio);
        if (subsetSimAB !== null) {
          similarity = subsetSimAB;
          detectionMethod = 'subset-A-in-B';
        } else {
          // Check if B is subset of A (B is smaller and mostly contained in A)
          // Only trigger if B represents >= 60% of A (prevents false positives from mentions/blocks)
          const subsetSimBA = checkSubsetSimilarity(shinglesB, shinglesA, 0.85, minShingles, minSizeRatio);
          if (subsetSimBA !== null) {
            similarity = subsetSimBA;
            detectionMethod = 'subset-B-in-A';
          }
        }
      }

      // If similarity detected (either Jaccard or subset), mark as duplicate
      if (similarity !== null && similarity > threshold) {
        const urlA = docA.metadata.url;
        const urlB = docB.metadata.url;
        const titleA = getPageTitle(docA);
        const titleB = getPageTitle(docB);

        duplicates.push({
          urlA,
          urlB,
          similarity: Math.round(similarity * 100), // Convert to 0-100
          titleA,
          titleB,
        });

        console.log(
          `[DuplicateAnalyzer] Found duplicate: ${urlA} <-> ${urlB} (${Math.round(similarity * 100)}% similar, method: ${detectionMethod})`,
        );
      }
    }
  }

  console.log(`[DuplicateAnalyzer] Analysis complete. Found ${duplicates.length} duplicate pairs`);

  return {
    pagesScanned,
    duplicatesFound: duplicates.length,
    results: duplicates,
  };
}

