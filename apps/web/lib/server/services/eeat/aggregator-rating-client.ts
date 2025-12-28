/**
 * Aggregator Rating Client
 *
 * Fetches and parses ratings from medical aggregators like doc.ua and Likarni.com.
 */

import { load } from 'cheerio';
import type { AggregatorRating } from './types';

/**
 * Fetch rating from a medical aggregator platform
 */
export async function fetchAggregatorRating(
    url: string,
    platformName: string
): Promise<AggregatorRating> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            return {
                platform: platformName,
                fetched: false,
            };
        }

        const html = await response.text();
        const $ = load(html);

        let rating: number | undefined;
        let reviewCount: number | undefined;

        if (url.includes('doc.ua')) {
            // doc.ua specific parsing
            // Heuristic: look for rating values in common classes or structured data if present
            const ratingText = $('.doctor-rating__value, .rating-value, .rating_num').first().text().trim();
            if (ratingText) {
                rating = parseFloat(ratingText.replace(',', '.'));
            }

            const reviewsText = $('.doctor-reviews__count, .reviews-count, .count_rev').first().text().trim();
            if (reviewsText) {
                const match = reviewsText.match(/\d+/);
                if (match) {
                    reviewCount = parseInt(match[0], 10);
                }
            }
        } else if (url.includes('likarni.com')) {
            // likarni.com specific parsing
            const ratingText = $('.rating-value, .score, [itemprop="ratingValue"]').first().text().trim();
            if (ratingText) {
                rating = parseFloat(ratingText.replace(',', '.'));
            }

            const reviewsText = $('.reviews-count, .count, [itemprop="reviewCount"]').first().text().trim();
            if (reviewsText) {
                const match = reviewsText.match(/\d+/);
                if (match) {
                    reviewCount = parseInt(match[0], 10);
                }
            }
        }

        // Generic fallback or refined parsing if specific missed
        if (rating === undefined || isNaN(rating)) {
            // Try to find any element that looks like a 4.x or 5.0 rating
            const genericRatingMatch = html.match(/ratingValue["']:\s*["']?(\d[.,]\d)["']?/i) ||
                html.match(/(\d[.,]\d)\s*(?:зірок|stars|rating)/i);
            if (genericRatingMatch && genericRatingMatch[1]) {
                rating = parseFloat(genericRatingMatch[1].replace(',', '.'));
            }
        }

        if (reviewCount === undefined || isNaN(reviewCount)) {
            const genericReviewsMatch = html.match(/reviewCount["']:\s*["']?(\d+)["']?/i);
            if (genericReviewsMatch && genericReviewsMatch[1]) {
                const parsedCount = parseInt(genericReviewsMatch[1], 10);
                if (!isNaN(parsedCount)) {
                    reviewCount = parsedCount;
                }
            }
        }

        return {
            platform: platformName,
            rating: rating && !isNaN(rating) ? rating : undefined,
            review_count: reviewCount && !isNaN(reviewCount) ? reviewCount : undefined,
            fetched: (rating !== undefined && !isNaN(rating)) || (reviewCount !== undefined && !isNaN(reviewCount)),
        };
    } catch {
        console.warn(`[AggregatorRatingClient] Failed to fetch rating from ${platformName}:`, error);
        return {
            platform: platformName,
            fetched: false,
        };
    }
}
