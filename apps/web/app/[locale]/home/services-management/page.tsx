'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';

import { ServicesTable } from '~/components/dashboard/playground/ServicesTable';
import { getProjectSettings, type ProjectSettings } from '~/lib/actions/project';
import { deleteService } from '~/lib/actions/services';

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  API_KEY_OPENAI: 'configuration_api_key_openai',
  API_KEY_PERPLEXITY: 'configuration_api_key_perplexity',
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

/**
 * Services Management Page
 */
export default function ServicesManagementPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [apiKeyOpenAI, setApiKeyOpenAI] = useState('');
  const [apiKeyPerplexity, setApiKeyPerplexity] = useState('');

  useEffect(() => {
    setIsMounted(true);
    
    const loadSettings = async () => {
      try {
        const result = await getProjectSettings({});
        if (result.success && result.data) {
          setProjectSettings(result.data);
        }
      } catch (error) {
        console.error('[Services Management] Error loading project settings:', error);
      }
    };
    
    loadSettings();
    
    if (typeof window === 'undefined') return;

    const storedApiKeyOpenAI = getStoredValue(STORAGE_KEYS.API_KEY_OPENAI);
    const storedApiKeyPerplexity = getStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY);

    setApiKeyOpenAI(storedApiKeyOpenAI);
    setApiKeyPerplexity(storedApiKeyPerplexity);
  }, []);

  useEffect(() => {
    if (!isMounted || projectSettings === null) return;

    const domain = projectSettings?.domain || '';

    if (!domain || !apiKeyOpenAI || !apiKeyPerplexity) {
      toast.warning('Please configure your domain and API keys in the Configuration page first.');
    } else if (!apiKeyOpenAI.startsWith('sk-') || !apiKeyPerplexity.startsWith('pplx-')) {
      toast.warning('Invalid API key format. Please update your API keys in the Configuration page.');
    }
  }, [isMounted, projectSettings, apiKeyOpenAI, apiKeyPerplexity]);

  const domain = projectSettings?.domain || '';

  const isReady = domain && apiKeyOpenAI && apiKeyPerplexity && 
                  apiKeyOpenAI.startsWith('sk-') && apiKeyPerplexity.startsWith('pplx-');

  const handleDeleteService = async (id: string) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      const result = await deleteService({ id });
      if (!result.success) {
        throw new Error('Failed to delete service from database');
      }
    }
  };

  return (
    <PageBody className="overflow-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Services Management</CardTitle>
                  <CardDescription>
                    Add and manage services to track in AI recommendations. Domain and API keys are configured in the Configuration page.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {isMounted && isReady ? (
            <ServicesTable
              domain={domain}
              apiKeyOpenAI={apiKeyOpenAI}
              apiKeyPerplexity={apiKeyPerplexity}
              storageKey="services_management_services"
              onDeleteService={handleDeleteService}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Please configure your domain and API keys in the Configuration page first.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageBody>
  );
}
