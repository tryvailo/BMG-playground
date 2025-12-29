/**
 * Case Study Analyzer
 *
 * Analyzes case study pages for structure, specialty, and PII compliance.
 */

import type { CheerioAPI } from 'cheerio';

import type {
  CaseStudyStructure,
  CaseStudiesBySpecialty,
  PIIComplianceInfo,
} from './types';

/**
 * Analyze case study structure
 */
export function analyzeCaseStudyStructure($: CheerioAPI): CaseStudyStructure {
  const textContent = $('body').text().toLowerCase();

  // Check for complaint/symptoms section
  const complaintPatterns = [
    'жалоба',
    'complaint',
    'симптом',
    'symptom',
    'проблема',
    'problem',
    'скарга',
  ];
  const hasComplaint = complaintPatterns.some((pattern) => textContent.includes(pattern));

  // Check for diagnosis section
  const diagnosisPatterns = [
    'діагноз',
    'diagnosis',
    'діагностика',
    'diagnostic',
    'визначено',
    'diagnosed',
  ];
  const hasDiagnosis = diagnosisPatterns.some((pattern) => textContent.includes(pattern));

  // Check for treatment section
  const treatmentPatterns = [
    'лікування',
    'treatment',
    'терапія',
    'therapy',
    'процедура',
    'procedure',
    'операція',
    'surgery',
  ];
  const hasTreatment = treatmentPatterns.some((pattern) => textContent.includes(pattern));

  // Check for result section
  const resultPatterns = [
    'результат',
    'result',
    'outcome',
    'результати',
    'results',
    'після лікування',
    'after treatment',
  ];
  const hasResult = resultPatterns.some((pattern) => textContent.includes(pattern));

  // Check for timeline
  const timelinePatterns = [
    'timeline',
    'часова лінія',
    'період',
    'period',
    'через',
    'after',
    'місяць',
    'month',
    'тиждень',
    'week',
  ];
  const hasTimeline = timelinePatterns.some((pattern) => textContent.includes(pattern));

  // Check for metrics (before/after)
  const metricsPatterns = [
    'до і після',
    'before and after',
    'до-та-після',
    'показник',
    'metric',
    'результат до',
    'result before',
    'результат після',
    'result after',
  ];
  const hasMetrics = metricsPatterns.some((pattern) => textContent.includes(pattern));

  // Check for doctor commentary
  const commentaryPatterns = [
    'коментар лікаря',
    'doctor comment',
    'коментар',
    'commentary',
    'експертна думка',
    'expert opinion',
    'пояснення',
    'explanation',
  ];
  const hasDoctorCommentary = commentaryPatterns.some((pattern) => textContent.includes(pattern));

  // Calculate completeness score
  const sections = [
    hasComplaint,
    hasDiagnosis,
    hasTreatment,
    hasResult,
    hasTimeline,
    hasMetrics,
    hasDoctorCommentary,
  ];
  const completedSections = sections.filter(Boolean).length;
  const completenessScore = Math.round((completedSections / sections.length) * 100);

  return {
    has_complaint: hasComplaint,
    has_diagnosis: hasDiagnosis,
    has_treatment: hasTreatment,
    has_result: hasResult,
    has_timeline: hasTimeline,
    has_metrics: hasMetrics,
    has_doctor_commentary: hasDoctorCommentary,
    completeness_score: completenessScore,
  };
}

/**
 * Detect specialty from case study
 */
export function detectCaseStudySpecialty($: CheerioAPI): string | null {
  const textContent = $('body').text().toLowerCase();
  const url = $('base').attr('href') || '';

  // Medical specialties mapping
  const specialties: Record<string, string[]> = {
    Cardiology: ['кардіологія', 'cardiology', 'серце', 'heart'],
    Dentistry: ['стоматологія', 'dentistry', 'зуби', 'teeth', 'dental'],
    Ophthalmology: ['офтальмологія', 'ophthalmology', 'очей', 'eyes', 'vision'],
    Dermatology: ['дерматологія', 'dermatology', 'шкіра', 'skin'],
    Orthopedics: ['ортопедія', 'orthopedics', 'кістки', 'bones'],
    Neurology: ['неврологія', 'neurology', 'нерви', 'nerves'],
    Surgery: ['хірургія', 'surgery', 'операція', 'operative'],
    Gynecology: ['гінекологія', 'gynecology', 'жіноче', 'women'],
  };

  for (const [specialty, keywords] of Object.entries(specialties)) {
    if (
      keywords.some((keyword) => textContent.includes(keyword)) ||
      keywords.some((keyword) => url.toLowerCase().includes(keyword))
    ) {
      return specialty;
    }
  }

  return null;
}

/**
 * Get case studies by specialty
 */
export function getCaseStudiesBySpecialty(
  caseStudyUrls: string[],
  $pages: Map<string, CheerioAPI>,
): CaseStudiesBySpecialty[] {
  const specialtyCounts = new Map<string, number>();

  for (const url of caseStudyUrls) {
    const $ = $pages.get(url);
    if (!$) continue;

    const specialty = detectCaseStudySpecialty($);
    if (specialty) {
      specialtyCounts.set(specialty, (specialtyCounts.get(specialty) || 0) + 1);
    } else {
      // Count as "Other" if specialty not detected
      specialtyCounts.set('Other', (specialtyCounts.get('Other') || 0) + 1);
    }
  }

  return Array.from(specialtyCounts.entries()).map(([specialty, count]) => ({
    specialty,
    count,
  }));
}

/**
 * Check PII compliance
 */
export function checkPIICompliance($: CheerioAPI): PIIComplianceInfo {
  const textContent = $('body').text();

  // Check for full names (common patterns)
  const fullNamePatterns = [
    /\b[А-ЯІЇЄҐ][а-яіїєґ]+\s+[А-ЯІЇЄҐ]\.\s*[А-ЯІЇЄҐ]\./g, // Ukrainian initials
    /\b[А-ЯІЇЄҐ][а-яіїєґ]+\s+[А-ЯІЇЄҐ][а-яіїєґ]+\s+[А-ЯІЇЄҐ][а-яіїєґ]+/g, // Full Ukrainian name
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Full English name
  ];

  let namesAnonymized = true;
  for (const pattern of fullNamePatterns) {
    const matches = textContent.match(pattern);
    if (matches && matches.length > 0) {
      // Check if names are in patient context (not doctor names)
      // This is a simple heuristic - in production, might need more sophisticated analysis
      const patientContextKeywords = ['пацієнт', 'patient', 'хворий', 'sick'];
      const hasPatientContext = patientContextKeywords.some((keyword) =>
        textContent.toLowerCase().includes(keyword),
      );

      if (hasPatientContext) {
        // Check if anonymized (initials or "Patient N")
        const isAnonymized = matches.some((match) => {
          const matchLower = match.toLowerCase();
          return (
            matchLower.includes('пацієнт') ||
            matchLower.includes('patient') ||
            /[А-ЯІЇЄҐA-Z]\.[А-ЯІЇЄҐA-Z]\./.test(match) // Initials pattern
          );
        });

        if (!isAnonymized) {
          namesAnonymized = false;
          break;
        }
      }
    }
  }

  // Check for addresses
  const addressPatterns = [
    /м\.\s*[А-ЯІЇЄҐа-яіїєґ\w]+,?\s*вул\./i,
    /вул\.\s*[А-ЯІЇЄҐа-яіїєґ\w\s]+,?\s*\d+/i,
    /\d+\s*[А-ЯІЇЄҐа-яіїєґ\w\s]+(?:вул|street)/i,
  ];
  const addressesAbsent = !addressPatterns.some((pattern) => {
    const matches = textContent.match(pattern);
    // Addresses are OK if they're clinic addresses, not patient addresses
    // Simple heuristic: if address is near "клініка" or "clinic", it's OK
    if (matches) {
      const context = textContent.substring(
        Math.max(0, matches.index! - 50),
        Math.min(textContent.length, matches.index! + matches[0].length + 50),
      );
      return !context.toLowerCase().includes('клініка') && !context.toLowerCase().includes('clinic');
    }
    return false;
  });

  // Check for phone numbers (patient phones, not clinic phones)
  const phonePatterns = [
    /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    /tel:\+?\d+/gi,
  ];
  let phonesAbsent = true;
  for (const pattern of phonePatterns) {
    const matches = textContent.match(pattern);
    if (matches && matches.length > 0) {
      // Check if phones are in patient context
      const patientContextKeywords = ['пацієнт', 'patient', 'хворий'];
      const hasPatientContext = patientContextKeywords.some((keyword) =>
        textContent.toLowerCase().includes(keyword),
      );

      if (hasPatientContext) {
        // If phone is near "пацієнт" or "patient", it might be patient phone
        phonesAbsent = false;
        break;
      }
    }
  }

  const isCompliant = namesAnonymized && addressesAbsent && phonesAbsent;

  return {
    is_compliant: isCompliant,
    names_anonymized: namesAnonymized,
    addresses_absent: addressesAbsent,
    phones_absent: phonesAbsent,
  };
}

