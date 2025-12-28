'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Cog, Save } from 'lucide-react';

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
});

type ConfigurationFormValues = z.infer<typeof ConfigurationFormSchema>;

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  API_KEY_OPENAI: 'configuration_api_key_openai',
  API_KEY_PERPLEXITY: 'configuration_api_key_perplexity',
  API_KEY_GOOGLE_PAGESPEED: 'configuration_api_key_google_pagespeed',
  API_KEY_GOOGLE_PLACES: 'configuration_api_key_google_places',
  API_KEY_FIRECRAWL: 'configuration_api_key_firecrawl',
  API_KEY_GOOGLE_CUSTOM_SEARCH: 'configuration_api_key_google_custom_search',
  GOOGLE_CUSTOM_SEARCH_ENGINE_ID: 'configuration_google_custom_search_engine_id',
  DOMAIN: 'configuration_domain',
  CITY: 'configuration_city',
  CLINIC_NAME: 'configuration_clinic_name',
} as const;

/**
 * Helper functions for localStorage
 */
const getStoredValue = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const setStoredValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Configuration Page
 */
export default function ConfigurationPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    },
  });

  // Load saved values from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const savedOpenAI = getStoredValue(STORAGE_KEYS.API_KEY_OPENAI);
    const savedPerplexity = getStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY);
    const savedGooglePageSpeed = getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED);
    const savedGooglePlaces = getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PLACES);
    const savedFirecrawl = getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL);
    const savedGoogleCustomSearch = getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_CUSTOM_SEARCH);
    const savedGoogleCustomSearchEngineId = getStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_ENGINE_ID);
    const savedDomain = getStoredValue(STORAGE_KEYS.DOMAIN);
    const savedCity = getStoredValue(STORAGE_KEYS.CITY);
    const savedClinicName = getStoredValue(STORAGE_KEYS.CLINIC_NAME);

    if (
      savedOpenAI ||
      savedPerplexity ||
      savedGooglePageSpeed ||
      savedGooglePlaces ||
      savedFirecrawl ||
      savedGoogleCustomSearch ||
      savedGoogleCustomSearchEngineId ||
      savedDomain ||
      savedCity ||
      savedClinicName
    ) {
      form.reset({
        apiKeyOpenAI: savedOpenAI || '',
        apiKeyPerplexity: savedPerplexity || '',
        apiKeyGooglePageSpeed: savedGooglePageSpeed || '',
        apiKeyGooglePlaces: savedGooglePlaces || '',
        apiKeyFirecrawl: savedFirecrawl || '',
        apiKeyGoogleCustomSearch: savedGoogleCustomSearch || '',
        googleCustomSearchEngineId: savedGoogleCustomSearchEngineId || '',
        domain: savedDomain || '',
        city: savedCity || '',
        clinicName: savedClinicName || '',
      });
    }
  }, [form]);

  // Save values to localStorage when they change (debounced)
  useEffect(() => {
    if (!isMounted) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const subscription = form.watch((values) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setStoredValue(STORAGE_KEYS.API_KEY_OPENAI, values.apiKeyOpenAI || '');
        setStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY, values.apiKeyPerplexity || '');
        setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED, values.apiKeyGooglePageSpeed || '');
        setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PLACES, values.apiKeyGooglePlaces || '');
        setStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL, values.apiKeyFirecrawl || '');
        setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_CUSTOM_SEARCH, values.apiKeyGoogleCustomSearch || '');
        setStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_ENGINE_ID, values.googleCustomSearchEngineId || '');
        setStoredValue(STORAGE_KEYS.DOMAIN, values.domain || '');
        setStoredValue(STORAGE_KEYS.CITY, values.city || '');
        setStoredValue(STORAGE_KEYS.CLINIC_NAME, values.clinicName || '');
      }, 500);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [form, isMounted]);

  const onSubmit = async (values: ConfigurationFormValues) => {
    setIsSaving(true);

    // Save values to localStorage
    setStoredValue(STORAGE_KEYS.API_KEY_OPENAI, values.apiKeyOpenAI || '');
    setStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY, values.apiKeyPerplexity || '');
    setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED, values.apiKeyGooglePageSpeed || '');
    setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PLACES, values.apiKeyGooglePlaces || '');
    setStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL, values.apiKeyFirecrawl || '');
    setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_CUSTOM_SEARCH, values.apiKeyGoogleCustomSearch || '');
    setStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_ENGINE_ID, values.googleCustomSearchEngineId || '');
    setStoredValue(STORAGE_KEYS.DOMAIN, values.domain || '');
    setStoredValue(STORAGE_KEYS.CITY, values.city || '');
    setStoredValue(STORAGE_KEYS.CLINIC_NAME, values.clinicName || '');

    toast.success('Configuration saved successfully!');
    setIsSaving(false);
  };

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

                      {/* City */}
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="New York"
                                {...field}
                                disabled={isSaving}
                              />
                            </FormControl>
                            <FormDescription>
                              Primary location city
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

