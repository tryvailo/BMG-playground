import { describe, it, expect } from 'vitest';
import { heuristicLlmsAnalysis } from '../llms-heuristic';

describe('llms-analyzer heuristic fallback', () => {
  it('detects core sections and gives a higher score', () => {
    const content = `# Organization\nClinic "Добро",
Address: вул. Шевченка 10, Київ, 01001\nPhone: +380441234567\n\n# Doctors\nDr. Ivanov, MD, license 12345\n\n# Services\nCardiology: we treat heart conditions\nUpdated: 2024-10-01`;

    const result = heuristicLlmsAnalysis(content, 'test');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.missing_sections).not.toContain('Organization identity (name, aliases)');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.analysisMethod).toBe('heuristic');
  });

  it('flags missing sections and returns low score for minimal content', () => {
    const content = `llms placeholder`;
    const result = heuristicLlmsAnalysis(content, 'test');
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.missing_sections.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.analysisMethod).toBe('heuristic');
  });
});
