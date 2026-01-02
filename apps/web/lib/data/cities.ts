/**
 * Top cities for each country in onboarding
 * Used for city selection step in onboarding flow
 */

export interface CityData {
  name: string;
  countryCode: string;
}

// Top 10 cities for United States
export const US_CITIES: CityData[] = [
  { name: 'New York', countryCode: 'US' },
  { name: 'Los Angeles', countryCode: 'US' },
  { name: 'Chicago', countryCode: 'US' },
  { name: 'Houston', countryCode: 'US' },
  { name: 'Phoenix', countryCode: 'US' },
  { name: 'Philadelphia', countryCode: 'US' },
  { name: 'San Antonio', countryCode: 'US' },
  { name: 'San Diego', countryCode: 'US' },
  { name: 'Dallas', countryCode: 'US' },
  { name: 'San Jose', countryCode: 'US' },
];

// Top 10 cities for United Kingdom
export const UK_CITIES: CityData[] = [
  { name: 'London', countryCode: 'UK' },
  { name: 'Manchester', countryCode: 'UK' },
  { name: 'Birmingham', countryCode: 'UK' },
  { name: 'Glasgow', countryCode: 'UK' },
  { name: 'Liverpool', countryCode: 'UK' },
  { name: 'Leeds', countryCode: 'UK' },
  { name: 'Edinburgh', countryCode: 'UK' },
  { name: 'Bristol', countryCode: 'UK' },
  { name: 'Cardiff', countryCode: 'UK' },
  { name: 'Belfast', countryCode: 'UK' },
];

// Top 10 cities for Germany
export const DE_CITIES: CityData[] = [
  { name: 'Berlin', countryCode: 'DE' },
  { name: 'Munich', countryCode: 'DE' },
  { name: 'Hamburg', countryCode: 'DE' },
  { name: 'Cologne', countryCode: 'DE' },
  { name: 'Frankfurt', countryCode: 'DE' },
  { name: 'Stuttgart', countryCode: 'DE' },
  { name: 'Düsseldorf', countryCode: 'DE' },
  { name: 'Dortmund', countryCode: 'DE' },
  { name: 'Essen', countryCode: 'DE' },
  { name: 'Leipzig', countryCode: 'DE' },
];

// Top 10 cities for France
export const FR_CITIES: CityData[] = [
  { name: 'Paris', countryCode: 'FR' },
  { name: 'Marseille', countryCode: 'FR' },
  { name: 'Lyon', countryCode: 'FR' },
  { name: 'Toulouse', countryCode: 'FR' },
  { name: 'Nice', countryCode: 'FR' },
  { name: 'Nantes', countryCode: 'FR' },
  { name: 'Strasbourg', countryCode: 'FR' },
  { name: 'Montpellier', countryCode: 'FR' },
  { name: 'Bordeaux', countryCode: 'FR' },
  { name: 'Lille', countryCode: 'FR' },
];

// Cities for Ukraine (from medical_centers_ukraine.tsv, unique cities only)
export const UA_CITIES: CityData[] = [
  { name: 'Івано-Франківськ', countryCode: 'UA' },
  { name: 'Ірпінь', countryCode: 'UA' },
  { name: 'Бориспіль', countryCode: 'UA' },
  { name: 'Бровари', countryCode: 'UA' },
  { name: 'Буча', countryCode: 'UA' },
  { name: 'Біла Церква', countryCode: 'UA' },
  { name: 'Васильків', countryCode: 'UA' },
  { name: 'Вишгород', countryCode: 'UA' },
  { name: 'Вишневе', countryCode: 'UA' },
  { name: 'Вінниця', countryCode: 'UA' },
  { name: 'Дніпро', countryCode: 'UA' },
  { name: 'Житомир', countryCode: 'UA' },
  { name: 'Запоріжжя', countryCode: 'UA' },
  { name: 'Кам\'янське', countryCode: 'UA' },
  { name: 'Київ', countryCode: 'UA' },
  { name: 'Ковель', countryCode: 'UA' },
  { name: 'Коломия', countryCode: 'UA' },
  { name: 'Кременчуг', countryCode: 'UA' },
  { name: 'Кривий Ріг', countryCode: 'UA' },
  { name: 'Кропивницький', countryCode: 'UA' },
  { name: 'Луцьк', countryCode: 'UA' },
  { name: 'Львів', countryCode: 'UA' },
  { name: 'Миколаїв', countryCode: 'UA' },
  { name: 'Могилів-Подільський', countryCode: 'UA' },
  { name: 'Новояворівськ', countryCode: 'UA' },
  { name: 'Одеса', countryCode: 'UA' },
  { name: 'Петропавлівська Борщагівка', countryCode: 'UA' },
  { name: 'Полтава', countryCode: 'UA' },
  { name: 'Рівне', countryCode: 'UA' },
  { name: 'Сміла', countryCode: 'UA' },
  { name: 'Софіївська Борщагівка', countryCode: 'UA' },
  { name: 'Суми', countryCode: 'UA' },
  { name: 'Тернопіль', countryCode: 'UA' },
  { name: 'Трускавець', countryCode: 'UA' },
  { name: 'Ужгород', countryCode: 'UA' },
  { name: 'Умань', countryCode: 'UA' },
  { name: 'Харків', countryCode: 'UA' },
  { name: 'Хмельницький', countryCode: 'UA' },
  { name: 'Черкаси', countryCode: 'UA' },
  { name: 'Чернівці', countryCode: 'UA' },
  { name: 'Чернігів', countryCode: 'UA' },
];

/**
 * Get cities for a country code
 * Returns local static data for all countries
 */
export function getCitiesByCountryCode(countryCode: string): CityData[] {
  switch (countryCode) {
    case 'US':
      return US_CITIES;
    case 'UK':
      return UK_CITIES;
    case 'DE':
      return DE_CITIES;
    case 'FR':
      return FR_CITIES;
    case 'UA':
      return UA_CITIES;
    default:
      return [];
  }
}

