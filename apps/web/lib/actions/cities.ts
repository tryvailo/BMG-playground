'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getCitiesByCountryCode } from '~/lib/data/cities';

const GetCitiesSchema = z.object({
  countryCode: z.string().min(1, 'Country code is required'),
});

export interface City {
  id: string;
  name: string;
  country_code: string;
  created_at?: string;
}

/**
 * Get cities for a specific country
 * For Ukraine (UA): loads from database
 * For other countries (US, UK, DE, FR): returns local data
 */
export const getCities = enhanceAction(
  async (params: z.infer<typeof GetCitiesSchema>): Promise<City[]> => {
    const { countryCode } = params;

    // For Ukraine, load from database
    if (countryCode === 'UA') {
      const supabase = getSupabaseServerClient();

      // Note: Using type assertion because ukraine_cities table is not in the generated Supabase types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('ukraine_cities')
        .select('*')
        .eq('country_code', countryCode)
        .order('name', { ascending: true });

      if (error) {
        console.error('[Cities] Error fetching cities from database:', error);
        return [];
      }

      return (data || []) as City[];
    }

    // For other countries, use local data
    const localCities = getCitiesByCountryCode(countryCode);
    // Convert to City format with generated IDs
    return localCities.map((city, index) => ({
      id: `local-${countryCode}-${index}`,
      name: city.name,
      country_code: city.countryCode,
    }));
  },
  {
    schema: GetCitiesSchema,
  },
);

