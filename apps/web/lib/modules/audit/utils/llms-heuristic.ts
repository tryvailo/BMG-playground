import type { LlmsTxtAnalysis } from './llms-analyzer';

/**
 * Heuristic fallback for llms.txt analysis.
 * Produces a best-effort score, missing sections and actionable recommendations
 * without relying on OpenAI. This keeps UI helpful when AI analysis fails.
 * 
 * This is a pure utility function (not a Server Action), so it's in a separate file
 * without 'use server' directive.
 */
export function heuristicLlmsAnalysis(content: string, note?: string): LlmsTxtAnalysis & { analysisMethod: 'heuristic'; fallbackReason?: string } {
  const _lower = content.toLowerCase();
  const hasHeading = /(^|\n)#+\s+\w+/m.test(content);
  const hasOrganization = /organization|organization name|clinic|hospital|medical/i.test(content);
  const hasDoctors = /doctor|dr\.|physician|specialist|licen(s|c)e|license/i.test(content);
  const hasAddresses = /\b\d{1,4}\s+\w+|address:|street|city|postcode|postal code|zip/i.test(content);
  const hasPhone = /\+?\d{5,15}|phone:/i.test(content);
  const hasServices = /service|procedure|conditions treated|conditions|treat(s|ment)/i.test(content);
  const hasDates = /updated|updated:\s*\d{4}|\b20\d{2}\b|\b\d{4}-\d{2}-\d{2}\b/i.test(content);

  let score = 0;
  if (hasOrganization) score += 20;
  if (hasAddresses && hasPhone) score += 25; // local service info
  if (hasDoctors) score += 25; // authority / EEAT signals
  if (hasServices) score += 20;
  if (hasHeading && hasDates) score += 10; // technical quality + freshness

  score = Math.max(0, Math.min(100, score));

  const missing: string[] = [];
  if (!hasOrganization) missing.push('Organization identity (name, aliases)');
  if (!hasAddresses) missing.push('Office locations with full addresses');
  if (!hasPhone) missing.push('Phone numbers in local format');
  if (!hasDoctors) missing.push("Doctor/specialist profiles with credentials");
  if (!hasServices) missing.push('Service definitions (procedure descriptions, conditions treated)');
  if (!hasHeading) missing.push('Structured headings (H1/H2/H3) for readability');

  const recs: string[] = [];
  if (!hasOrganization) recs.push('Add an "Organization" section: full legal name, aliases, and geographic focus (cities/regions).');
  if (!hasAddresses) recs.push('List each office with full address and postal code (e.g., Kiev, ул. Пушкина, 12, 01001).');
  if (!hasPhone) recs.push('Add phone numbers in international format (e.g., +38-044-XXX-XXXX).');
  if (!hasDoctors) recs.push('Create a "Doctors" section with names, degrees, specializations and license numbers.');
  if (!hasServices) recs.push('For each service, provide a short description, conditions treated and expected outcomes.');
  if (!hasHeading) recs.push('Use Markdown headings (H1/H2/H3) to structure llms.txt for easier parsing by LLMs.');
  if (!hasDates) recs.push('Add last-updated dates for freshness signals.');

  // If the heuristic produced a very low score but the file exists, add a helpful recommendation
  if (score < 30 && content.trim().length > 0) {
    recs.unshift('File exists but lacks critical GEO/EEAT sections — follow the recommendations below to reach a baseline AIV score.');
  }

  const summary = note
    ? `Heuristic analysis applied due to AI error (${note}). See missing sections and recommendations.`
    : 'Heuristic analysis: basic llms.txt checks completed.';

  return {
    score,
    summary,
    missing_sections: missing,
    recommendations: recs,
    analysisMethod: 'heuristic',
    fallbackReason: note,
  } as unknown as LlmsTxtAnalysis & { analysisMethod: 'heuristic'; fallbackReason?: string };
}

