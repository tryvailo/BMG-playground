'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Cog, Save, Loader2 } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { getProjectSettings, updateProjectSettings } from '~/lib/actions/project';
import { getCitiesByCountryCode } from '~/lib/data/cities';

/**
 * Region/Country options
 */
const REGION_OPTIONS = [
  { value: 'US', label: 'United States', language: 'en' },
  { value: 'UK', label: 'United Kingdom', language: 'en' },
  { value: 'DE', label: 'Germany', language: 'de' },
  { value: 'FR', label: 'France', language: 'fr' },
  { value: 'UA', label: 'Ukraine', language: 'uk' },
];

/**
 * Language options
 */
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
];

/**
 * Form Schema for Configuration
 */
const ConfigurationFormSchema = z.object({
  apiKeyOpenAI: z.string().optional(),
  apiKeyPerplexity: z.string().optional(),
  apiKeyGooglePageSpeed: z.string().optional(),
  apiKeyGooglePlaces: z.string().optional(),
  apiKeyFirecrawl: z.string().optional(),
  apiKeyGoogleCustomSearch: z.string().optional(),
  googleCustomSearchEngineId: z.string().optional(),
  domain: z.string().optional(),
  city: z.string().optional(),
  clinicName: z.string().optional(),
  region: z.string().optional(),
  language: z.string().optional(),
});

type ConfigurationFormValues = z.infer<typeof ConfigurationFormSchema>;

/**
 * LocalStorage Keys - Using global configuration keys (for API keys only)
 */
const STORAGE_KEYS = {
  API_KEY_OPENAI: 'configuration_api_key_openai',
  API_KEY_PERPLEXITY: 'configuration_api_key_perplexity',
  API_KEY_GOOGLE_PAGESPEED: 'configuration_api_key_google_pagespeed',
  API_KEY_GOOGLE_PLACES: 'configuration_api_key_google_places',
  API_KEY_FIRECRAWL: 'configuration_api_key_firecrawl',
  API_KEY_GOOGLE_CUSTOM_SEARCH: 'configuration_api_key_google_custom_search',
  GOOGLE_CUSTOM_SEARCH_ENGINE_ID: 'configuration_google_custom_search_engine_id',
  // Keep these for fallback/cache
  DOMAIN: 'configuration_domain',
  CITY: 'configuration_city',
  CLINIC_NAME: 'configuration_clinic_name',
  REGION: 'configuration_region',
  LANGUAGE: 'configuration_language',
} as const;

/**
 * Helper functions for localStorage
 */
const getStoredValue = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key) || '';
  } catch (_error) {
    return '';
  }
};

const setStoredValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (_error) {
    // Ignore localStorage errors
  }
};

/**
 * Configuration Page
 */
export default function ConfigurationPage() {
  const [_isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [availableCities, setAvailableCities] = useState<Array<{ name: string }>>([]);

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(ConfigurationFormSchema),
    defaultValues: {
      apiKeyOpenAI: '',
      apiKeyPerplexity: '',
      apiKeyGooglePageSpeed: '',
      apiKeyGooglePlaces: '',
      apiKeyFirecrawl: '',
      apiKeyGoogleCustomSearch: '',
      googleCustomSearchEngineId: '',
      domain: '',
      city: '',
      clinicName: '',
      region: 'US',
      language: 'en',
    },
  });

  // Update available cities when region changes
  useEffect(() => {
    const cities = getCitiesByCountryCode(selectedRegion);
    setAvailableCities(cities);
  }, [selectedRegion]);

  // Load saved values from database and localStorage on mount
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load API keys from localStorage
      const savedApiKeys = {
        apiKeyOpenAI: getStoredValue(STORAGE_KEYS.API_KEY_OPENAI),
        apiKeyPerplexity: getStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY),
        apiKeyGooglePageSpeed: getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED),
        apiKeyGooglePlaces: getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PLACES),
        apiKeyFirecrawl: getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL),
        apiKeyGoogleCustomSearch: getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_CUSTOM_SEARCH),
        googleCustomSearchEngineId: getStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_ENGINE_ID),
      };

      // Load project settings from database
      const result = await getProjectSettings({});

      if (result.success && result.data) {
        const projectData = result.data;
        
        // Also cache in localStorage for offline access
        setStoredValue(STORAGE_KEYS.DOMAIN, projectData.domain || '');
        setStoredValue(STORAGE_KEYS.CITY, projectData.city || '');
        setStoredValue(STORAGE_KEYS.CLINIC_NAME, projectData.clinicName || '');
        setStoredValue(STORAGE_KEYS.REGION, projectData.region || 'US');
        setStoredValue(STORAGE_KEYS.LANGUAGE, projectData.language || 'en');

        setSelectedRegion(projectData.region || 'US');

        form.reset({
          ...savedApiKeys,
          domain: projectData.domain || '',
          city: projectData.city || '',
          clinicName: projectData.clinicName || '',
          region: projectData.region || 'US',
          language: projectData.language || 'en',
        });
      } else {
        // Fallback to localStorage if no project data
        const fallbackData = {
          domain: getStoredValue(STORAGE_KEYS.DOMAIN),
          city: getStoredValue(STORAGE_KEYS.CITY),
          clinicName: getStoredValue(STORAGE_KEYS.CLINIC_NAME),
          region: getStoredValue(STORAGE_KEYS.REGION) || 'US',
          language: getStoredValue(STORAGE_KEYS.LANGUAGE) || 'en',
        };

        setSelectedRegion(fallbackData.region);

        form.reset({
          ...savedApiKeys,
          ...fallbackData,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      loadSettings();
    }
  }, [loadSettings]);

  // Watch for region changes to update available cities
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'region' && value.region) {
        setSelectedRegion(value.region);
        // Reset city when region changes
        form.setValue('city', '');
        // Auto-set language based on region
        const regionOption = REGION_OPTIONS.find(r => r.value === value.region);
        if (regionOption) {
          form.setValue('language', regionOption.language);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: ConfigurationFormValues) => {
    setIsSaving(true);

    try {
      // Save API keys to localStorage
      setStoredValue(STORAGE_KEYS.API_KEY_OPENAI, values.apiKeyOpenAI || '');
      setStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY, values.apiKeyPerplexity || '');
      setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED, values.apiKeyGooglePageSpeed || '');
      setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PLACES, values.apiKeyGooglePlaces || '');
      setStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL, values.apiKeyFirecrawl || '');
      setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_CUSTOM_SEARCH, values.apiKeyGoogleCustomSearch || '');
      setStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_ENGINE_ID, values.googleCustomSearchEngineId || '');

      // Save project settings to database
      const result = await updateProjectSettings({
        domain: values.domain,
        clinicName: values.clinicName,
        region: values.region,
        city: values.city,
        language: values.language,
      });

      if (result.success) {
        // Also cache in localStorage
        setStoredValue(STORAGE_KEYS.DOMAIN, values.domain || '');
        setStoredValue(STORAGE_KEYS.CITY, values.city || '');
        setStoredValue(STORAGE_KEYS.CLINIC_NAME, values.clinicName || '');
        setStoredValue(STORAGE_KEYS.REGION, values.region || 'US');
        setStoredValue(STORAGE_KEYS.LANGUAGE, values.language || 'en');

        toast.success('Configuration saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageBody>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full min-h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageBody>
    );
  }

  return (
    <PageBody>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full min-h-full">
        <div className="flex flex-col space-y-6 h-full min-h-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuration</h1>
            <p className="text-muted-foreground">
              Manage your API keys and clinic information. These settings will be used across all features.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cog className="h-5 w-5 text-muted-foreground" />
                <CardTitle>API Keys & Clinic Information</CardTitle>
              </div>
              <CardDescription>
                Configure your API keys and clinic details. All fields are optional but recommended for full functionality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* API Keys Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      API Keys
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* OpenAI API Key */}
                      <FormField
                        control={form.control}
                        name="apiKeyOpenAI"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenAI API Key</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="sk-..."
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Required for AI-powered analysis
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Perplexity API Key */}
                      <FormField
                        control={form.control}
                        name="apiKeyPerplexity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perplexity API Key</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="pplx-..."
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Required for search visibility checks
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Google PageSpeed API Key */}
                      <FormField
                        control={form.control}
                        name="apiKeyGooglePageSpeed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google PageSpeed API Key</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="AIzaSy..."
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional. For performance audits
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Google Places API Key */}
                      <FormField
                        control={form.control}
                        name="apiKeyGooglePlaces"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Places API Key</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="AIzaSy..."
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional. For Local Indicators audit
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Firecrawl API Key */}
                      <FormField
                        control={form.control}
                        name="apiKeyFirecrawl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Firecrawl API Key</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="fc-..."
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional. For parsing DOC.ua, Helsi, and checking backlinks
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Google Custom Search API Key */}
                      <FormField
                        control={form.control}
                        name="apiKeyGoogleCustomSearch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Custom Search API Key</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="AIzaSy..."
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional. For finding local backlinks (100 free requests/day)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Google Custom Search Engine ID */}
                      <FormField
                        control={form.control}
                        name="googleCustomSearchEngineId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Custom Search Engine ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="012345678901234567890:abcdefghijk"
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional. Your Custom Search Engine ID (cx parameter)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Clinic Information Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-foreground">
                      Clinic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Clinic Name */}
                      <FormField
                        control={form.control}
                        name="clinicName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinic Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Mayo Clinic"
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Your clinic or organization name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Domain */}
                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="mayoclinic.org"
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Your website domain (without http:// or https://)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Region */}
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region / Country</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSaving}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {REGION_OPTIONS.map((region) => (
                                  <SelectItem key={region.value} value={region.value}>
                                    {region.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Your clinic&apos;s country/region
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* City */}
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSaving || availableCities.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCities.map((city) => (
                                  <SelectItem key={city.name} value={city.name}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Primary location city
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Language */}
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSaving}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LANGUAGE_OPTIONS.map((lang) => (
                                  <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Primary content language
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-pulse" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageBody>
  );
}
