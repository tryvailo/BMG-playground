/**
 * Resolves the translation file for a given language and namespace.
 *
 */
export async function i18nResolver(language: string, namespace: string) {
  try {
    // Normalize namespace to match file naming (case-sensitive on some systems)
    // Try both exact case and lowercase
    const normalizedNamespace = namespace;
    
    // Use explicit path resolution for better Turbopack compatibility
    const data = await import(
      `../../locales/${language}/${normalizedNamespace}.json`
    );

    return data.default || data as Record<string, string>;
  } catch (_error) {
    // Try lowercase version if exact case fails
    try {
      const lowercaseNamespace = namespace.toLowerCase();
      const data = await import(
        `../../locales/${language}/${lowercaseNamespace}.json`
      );
      return data.default || data as Record<string, string>;
    } catch (fallbackError) {
      // Fallback to empty object if file doesn't exist
      console.warn(
        `Failed to load locale file: locales/${language}/${namespace}.json (tried both cases)`,
        error,
      );
      return {};
    }
  }
}
