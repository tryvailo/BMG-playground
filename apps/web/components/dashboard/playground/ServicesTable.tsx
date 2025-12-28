'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calculator, Loader2, X, Save, Briefcase } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import { EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton } from '@kit/ui/empty-state';
import { Label } from '@kit/ui/label';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { Skeleton } from '@kit/ui/skeleton';
import { toast } from 'sonner';
import type { ServiceAnalysisData } from '~/lib/actions/playground-test';
import { runLiveDashboardTest } from '~/lib/actions/playground-test';
import { calculateServiceAivScore } from '~/lib/modules/analytics/calculator';
import { LLMLogsViewer } from './LLMLogsViewer';
import { ServiceAnalysisDetail } from './ServiceAnalysisDetail';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@kit/ui/tabs';

interface PlaygroundService {
  id: string;
  name: string;
  search_query: string;
  location_city: string;
  path?: string;
  location_country?: string;
}

interface ServiceCalculationResult {
  serviceId: string;
  serviceName: string;
  analysis: ServiceAnalysisData | null;
  aivScore: number;
  error?: string;
}

interface ServicesTableProps {
  domain: string;
  apiKeyOpenAI: string;
  apiKeyPerplexity: string;
  onCalculationsComplete?: (results: ServiceCalculationResult[]) => void;
  storageKey?: string; // Optional storage key for persisting services
}

const DEFAULT_SERVICES: PlaygroundService[] = [
  {
    id: 'default-1',
    name: 'МРТ (Магнітно-резонансна томографія)',
    search_query: 'Краща клініка МРТ Київ',
    location_city: 'Київ',
    path: '/services/mri',
    location_country: 'UA',
  },
  {
    id: 'default-2',
    name: 'УЗД серця (Ехокардіографія)',
    search_query: 'Зробити УЗД серця Київ ціна',
    location_city: 'Київ',
    path: '/services/ultrasound-heart',
    location_country: 'UA',
  },
  {
    id: 'default-3',
    name: 'Консультація терапевта',
    search_query: 'Прийом терапевта приватна клініка Київ',
    location_city: 'Київ',
    path: '/services/gp',
    location_country: 'UA',
  },
  {
    id: 'default-4',
    name: 'Консультація гінеколога',
    search_query: 'Приватна гінекологія Київ відгуки',
    location_city: 'Київ',
    path: '/services/gynecology',
    location_country: 'UA',
  },
  {
    id: 'default-5',
    name: 'Стоматологічна чистка',
    search_query: 'Професійна чистка зубів Київ ціна',
    location_city: 'Київ',
    path: '/services/dentistry',
    location_country: 'UA',
  },
  {
    id: 'default-6',
    name: 'Аналіз крові (комплексний)',
    search_query: 'Здати аналізи Київ приватна лабораторія',
    location_city: 'Київ',
    path: '/diagnostics/blood-test',
    location_country: 'UA',
  },
  {
    id: 'default-7',
    name: 'Дерматоскопія родимок',
    search_query: 'Перевірка родимок Київ дерматолог',
    location_city: 'Київ',
    path: '/services/dermatology',
    location_country: 'UA',
  },
  {
    id: 'default-8',
    name: 'Консультація офтальмолога',
    search_query: 'Перевірка зору Київ приватна клініка',
    location_city: 'Київ',
    path: '/services/ophthalmology',
    location_country: 'UA',
  },
  {
    id: 'default-9',
    name: 'Гастроскопія (ВЕГДС)',
    search_query: 'Де зробити гастроскопію в Києві під седацією',
    location_city: 'Київ',
    path: '/services/gastroenterology',
    location_country: 'UA',
  },
  {
    id: 'default-10',
    name: 'Виклик лікаря додому',
    search_query: 'Приватна швидка допомога або виклик лікаря Київ',
    location_city: 'Київ',
    path: '/services/home-visit',
    location_country: 'UA',
  },
];

/**
 * Generate mock calculation results for default services
 */
const generateMockResults = (domain: string): Map<string, ServiceCalculationResult> => {
  const mockResults = new Map<string, ServiceCalculationResult>();

  DEFAULT_SERVICES.forEach((service, index) => {
    // Some visible, some not for realism
    const isVisible = index % 3 !== 0;
    const position = isVisible ? (index % 5) + 1 : null;
    const totalResults = 10;

    // Simulate AIV Score calculation
    const isVisibleVal = isVisible ? 1 : 0;
    const pScore = isVisible ? (1 - (position || 0) / totalResults) * 100 : 0;
    const cScore = 70;
    const aivScore = isVisibleVal * (isVisibleVal * 100 * 0.3 + pScore * 0.25 + cScore * 0.2);

    const analysisData: ServiceAnalysisData = {
      query: service.search_query,
      location: service.location_city,
      foundUrl: isVisible ? `https://${domain}${service.path}` : null,
      position: position,
      totalResults: totalResults,
      aiEngine: 'Simulated AI Analysis',
      competitors: [
        { rank: 1, name: 'Competitor A', strengths: 'High ratings' },
        { rank: 2, name: 'Competitor B', strengths: 'Fast response' },
        { rank: 3, name: 'Competitor C', strengths: 'Modern equipment' }
      ],
      recommendationText: isVisible
        ? `Your clinic is visible at position #${position}. To improve, focus on customer reviews.`
        : `Your clinic is not visible for this query. Improve your local SEO signal.`,
      llmLogs: []
    };

    mockResults.set(service.id, {
      serviceId: service.id,
      serviceName: service.name,
      aivScore: Math.round(aivScore * 10) / 10,
      analysis: {
        query: service.search_query,
        location: service.location_city,
        foundUrl: isVisible ? `https://${domain}${service.path}` : null,
        position: position,
        totalResults: totalResults,
        aiEngine: 'Simulated AI Analysis',
        competitors: [
          { rank: 1, name: 'Competitor A', strengths: 'High ratings' },
          { rank: 2, name: 'Competitor B', strengths: 'Fast response' },
          { rank: 3, name: 'Competitor C', strengths: 'Modern equipment' }
        ],
        recommendationText: isVisible
          ? `Your clinic is visible at position #${position}. To improve, focus on customer reviews.`
          : `Your clinic is not visible for this query. Improve your local SEO signal.`,
        llmLogs: []
      }
    });
  });

  return mockResults;
};

export function ServicesTable({
  domain,
  apiKeyOpenAI,
  apiKeyPerplexity,
  onCalculationsComplete,
  storageKey = 'playground_services',
}: ServicesTableProps) {
  const [services, setServices] = useState<PlaygroundService[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResults, setCalculationResults] = useState<Map<string, ServiceCalculationResult>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Load services from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      const storedResults = localStorage.getItem(`${storageKey}_results`);

      if (stored) {
        const loadedServices = JSON.parse(stored) as PlaygroundService[];
        setServices(loadedServices);

        if (storedResults) {
          try {
            const parsedResults = JSON.parse(storedResults);
            // Convert plain object back to Map
            const resultsMap = new Map<string, ServiceCalculationResult>(Object.entries(parsedResults));
            setCalculationResults(resultsMap);
          } catch (e) {
            console.error('[ServicesTable] Error parsing stored results:', e);
          }
        }
      } else {
        // Use default services and generate mock results if nothing in storage
        setServices(DEFAULT_SERVICES);
        const mockResults = generateMockResults(domain || 'yourclinic.com');
        setCalculationResults(mockResults);
      }
    } catch (_error) {
      console.error('[ServicesTable] Error loading services from storage:', error);
      setServices(DEFAULT_SERVICES);
      setCalculationResults(generateMockResults(domain || 'yourclinic.com'));
    }
    setIsInitialized(true);
  }, [storageKey, domain]);

  // Save to localStorage whenever services change (but not on initial load)
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(services));

      // Also persist calculation results (convert Map to plain object for JSON)
      const resultsObj = Object.fromEntries(calculationResults.entries());
      localStorage.setItem(`${storageKey}_results`, JSON.stringify(resultsObj));
    } catch (_error) {
      console.error('[ServicesTable] Error saving services or results to storage:', error);
    }
  }, [services, calculationResults, isInitialized, storageKey]);

  // Form state for new service
  const [newService, setNewService] = useState<Omit<PlaygroundService, 'id'>>({
    name: '',
    search_query: '',
    location_city: '',
    path: '',
    location_country: '',
  });

  // Form state for editing
  const [editService, setEditService] = useState<PlaygroundService | null>(null);

  const handleAddService = () => {
    if (!newService.name || !newService.search_query || !newService.location_city) {
      toast.error('Please fill in all required fields (Name, Search Query, Location City)');
      return;
    }

    const service: PlaygroundService = {
      id: `service-${Date.now()}`,
      name: newService.name,
      search_query: newService.search_query,
      location_city: newService.location_city,
      path: newService.path || undefined,
      location_country: newService.location_country || undefined,
    };

    const updatedServices = [...services, service];
    setServices(updatedServices);
    setNewService({
      name: '',
      search_query: '',
      location_city: '',
      path: '',
      location_country: '',
    });
    setIsAdding(false);
    toast.success('Service added successfully');
  };

  const handleEditService = (service: PlaygroundService) => {
    setEditService({ ...service });
    setEditingId(service.id);
  };

  const handleSaveEdit = () => {
    if (!editService) return;

    if (!editService.name || !editService.search_query || !editService.location_city) {
      toast.error('Please fill in all required fields');
      return;
    }

    setServices(services.map((s) => (s.id === editService.id ? editService : s)));
    setEditingId(null);
    setEditService(null);
    toast.success('Service updated successfully');
  };

  const handleDeleteService = (id: string) => {
    const updatedServices = services.filter((s) => s.id !== id);
    setServices(updatedServices);
    calculationResults.delete(id);
    setCalculationResults(new Map(calculationResults));
    toast.success('Service deleted');
  };

  const handleResetToDefaults = () => {
    if (confirm('Ви впевнені, що хочете скинути список послуг до стандартних? Ваші поточні зміни будуть втрачені.')) {
      setServices(DEFAULT_SERVICES);
      const mockResults = generateMockResults(domain || 'yourclinic.com');
      setCalculationResults(mockResults);
      toast.success('Список послуг скинуто до стандартних');
    }
  };

  const handleCalculateService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    if (!apiKeyOpenAI || !apiKeyPerplexity) {
      toast.error('Please provide both OpenAI and Perplexity API keys in Configuration');
      return;
    }

    if (!domain) {
      toast.error('Please provide a domain in Configuration');
      return;
    }

    setIsCalculating(true);
    // Select it immediately so user can see progress/pending state
    setSelectedServiceId(serviceId);

    try {
      console.log('[ServicesTable] Calculating individual service:', service.name);

      const input = {
        apiKeyOpenAI: apiKeyOpenAI.trim(),
        apiKeyPerplexity: apiKeyPerplexity.trim(),
        domain: domain.trim(),
        query: service.search_query.trim(),
        city: service.location_city.trim(),
      };

      const result = await runLiveDashboardTest(input);
      const { serviceAnalysis } = result;

      const aivScoreResult = calculateServiceAivScore({
        isVisible: serviceAnalysis.foundUrl !== null,
        position: serviceAnalysis.position,
        totalResults: serviceAnalysis.totalResults,
        competitorsAvgScore: 70,
      });

      const calculationResult: ServiceCalculationResult = {
        serviceId: service.id,
        serviceName: service.name,
        analysis: serviceAnalysis,
        aivScore: aivScoreResult.finalScore,
      };

      setCalculationResults(prev => {
        const newMap = new Map(prev);
        newMap.set(service.id, calculationResult);
        return newMap;
      });

      toast.success(`Calculated: ${service.name}`);
    } catch (_error) {
      console.error('[ServicesTable] Error calculating service:', service.name, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const calculationResult: ServiceCalculationResult = {
        serviceId: service.id,
        serviceName: service.name,
        analysis: null,
        aivScore: 0,
        error: errorMessage,
      };

      setCalculationResults(prev => {
        const newMap = new Map(prev);
        newMap.set(service.id, calculationResult);
        return newMap;
      });

      toast.error(`Failed to calculate ${service.name}: ${errorMessage}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateAll = async () => {
    if (services.length === 0) {
      toast.error('No services to calculate. Please add services first.');
      return;
    }

    if (!apiKeyOpenAI || !apiKeyPerplexity) {
      toast.error('Please provide both OpenAI and Perplexity API keys');
      return;
    }

    // Validate API key formats before making requests
    if (!apiKeyOpenAI.trim().startsWith('sk-')) {
      toast.error('Invalid OpenAI API key format. OpenAI keys must start with "sk-". You may have entered a Google API key instead.');
      return;
    }

    if (!apiKeyPerplexity.trim().startsWith('pplx-')) {
      toast.error('Invalid Perplexity API key format. Perplexity keys must start with "pplx-".');
      return;
    }

    if (!domain || !domain.trim()) {
      toast.error('Please provide a valid domain');
      return;
    }

    setIsCalculating(true);
    const results: ServiceCalculationResult[] = [];

    try {
      // Calculate each service sequentially to avoid rate limits
      for (const service of services) {
        try {
          console.log('[ServicesTable] Calculating service:', service.name);
          console.log('[ServicesTable] Domain:', domain);
          console.log('[ServicesTable] Query:', service.search_query);
          console.log('[ServicesTable] City:', service.location_city);
          console.log('[ServicesTable] Has OpenAI key:', !!apiKeyOpenAI);
          console.log('[ServicesTable] Has Perplexity key:', !!apiKeyPerplexity);

          // Validate inputs before calling
          if (!service.search_query || !service.search_query.trim()) {
            throw new Error('Search query is required');
          }
          if (!service.location_city || !service.location_city.trim()) {
            throw new Error('Location city is required');
          }

          // Prepare input with all required fields
          const input = {
            apiKeyOpenAI: apiKeyOpenAI.trim(),
            apiKeyPerplexity: apiKeyPerplexity.trim(),
            domain: domain.trim(),
            query: service.search_query.trim(),
            city: service.location_city.trim(),
          };

          console.log('[ServicesTable] Calling runLiveDashboardTest with:', {
            domain: input.domain,
            query: input.query,
            city: input.city,
            hasOpenAIKey: !!input.apiKeyOpenAI,
            hasPerplexityKey: !!input.apiKeyPerplexity,
          });

          const result = await runLiveDashboardTest(input);

          console.log('[ServicesTable] Calculation result received for:', service.name);

          const { serviceAnalysis } = result;

          // Calculate AIV Score
          const aivScoreResult = calculateServiceAivScore({
            isVisible: serviceAnalysis.foundUrl !== null,
            position: serviceAnalysis.position,
            totalResults: serviceAnalysis.totalResults,
            competitorsAvgScore: 70, // Default for playground
          });

          const calculationResult: ServiceCalculationResult = {
            serviceId: service.id,
            serviceName: service.name,
            analysis: serviceAnalysis,
            aivScore: aivScoreResult.finalScore,
          };

          results.push(calculationResult);
          setCalculationResults(prev => {
            const newMap = new Map(prev);
            newMap.set(service.id, calculationResult);
            return newMap;
          });

          // Auto-select the first service with a result if none selected
          if (!selectedServiceId) {
            setSelectedServiceId(service.id);
          }

          toast.success(`Calculated: ${service.name}`);
        } catch (_error) {
          console.error('[ServicesTable] Error calculating service:', service.name, error);
          console.error('[ServicesTable] Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack',
            service: service.name,
            domain,
            query: service.search_query,
            city: service.location_city,
            hasOpenAIKey: !!apiKeyOpenAI,
            hasPerplexityKey: !!apiKeyPerplexity,
          });

          let errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Improve error messages for common API key errors
          if (errorMessage.includes('Incorrect API key') || errorMessage.includes('API key')) {
            if (errorMessage.includes('AIza')) {
              errorMessage = 'Invalid OpenAI API key. You may have entered a Google API key instead. OpenAI keys start with "sk-".';
            } else if (errorMessage.includes('Unauthorized')) {
              errorMessage = 'Invalid API key. Please check your OpenAI and Perplexity API keys.';
            } else {
              errorMessage = 'Invalid API key. Please check your API keys and try again.';
            }
          } else if (errorMessage.includes('Both AI scans failed')) {
            errorMessage = 'Both AI services failed. Please check your API keys and try again.';
          }

          const calculationResult: ServiceCalculationResult = {
            serviceId: service.id,
            serviceName: service.name,
            analysis: null,
            aivScore: 0,
            error: errorMessage,
          };

          results.push(calculationResult);
          setCalculationResults(prev => {
            const newMap = new Map(prev);
            newMap.set(service.id, calculationResult);
            return newMap;
          });

          toast.error(`Failed to calculate ${service.name}: ${errorMessage}`);
        }
      }

      if (onCalculationsComplete) {
        onCalculationsComplete(results);
      }

      toast.success(`Calculated ${results.length} service(s)`);
    } catch (_error) {
      console.error('[ServicesTable] Error calculating services:', error);
      toast.error('Failed to calculate services');
    } finally {
      setIsCalculating(false);
    }
  };

  const getServiceResult = (serviceId: string): ServiceCalculationResult | undefined => {
    return calculationResults.get(serviceId);
  };

  return (
    <Card className="transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Services Management</CardTitle>
            <CardDescription>
              Add and manage services to track in AI recommendations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {services.length > 0 && (
              <Button
                onClick={handleCalculateAll}
                disabled={isCalculating || !apiKeyOpenAI || !apiKeyPerplexity}
                className="flex items-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Calculate All Parameters
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleResetToDefaults}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              title="Reset to default example services"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? 'outline' : 'default'}
              className={`flex items-center gap-2 transition-all ${!isAdding ? 'bg-primary hover:bg-primary/90 shadow-md transform hover:scale-105' : ''}`}
            >
              <Plus className="h-4 w-4" />
              {isAdding ? 'Cancel' : 'Add Service'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Service Form */}
        {isAdding && (
          <div className="p-4 border border-border rounded-lg bg-muted/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="service-name" className="mb-1">
                  Service Name *
                </Label>
                <Input
                  id="service-name"
                  placeholder="e.g., MRI Scan"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="search-query" className="mb-1">
                  Search Query *
                </Label>
                <Input
                  id="search-query"
                  placeholder="e.g., Best MRI clinic in Kyiv"
                  value={newService.search_query}
                  onChange={(e) => setNewService({ ...newService, search_query: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location-city" className="mb-1">
                  Location City *
                </Label>
                <Input
                  id="location-city"
                  placeholder="e.g., Kyiv"
                  value={newService.location_city}
                  onChange={(e) => setNewService({ ...newService, location_city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="path" className="mb-1">
                  Path (optional)
                </Label>
                <Input
                  id="path"
                  placeholder="e.g., /services/mri"
                  value={newService.path}
                  onChange={(e) => setNewService({ ...newService, path: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddService} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Service
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Services Table */}
        {services.length === 0 ? (
          <EmptyState>
            <EmptyStateHeading>No services added yet</EmptyStateHeading>
            <EmptyStateText>Click "Add Service" to get started.</EmptyStateText>
            <EmptyStateButton onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </EmptyStateButton>
          </EmptyState>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Search Query</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Visibility (V)</TableHead>
                  <TableHead className="text-center">Position (P)</TableHead>
                  <TableHead className="text-center">Comp. Score (C)</TableHead>
                  <TableHead className="text-center">AIV Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const result = getServiceResult(service.id);
                  const isEditing = editingId === service.id;

                  if (isEditing && editService) {
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <Input
                            value={editService.name}
                            onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editService.search_query}
                            onChange={(e) =>
                              setEditService({ ...editService, search_query: e.target.value })
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editService.location_city}
                            onChange={(e) =>
                              setEditService({ ...editService, location_city: e.target.value })
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          {result ? (
                            <Badge variant={result.analysis?.foundUrl ? 'success' : 'outline'}>
                              {result.analysis?.foundUrl ? '1' : '0'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result?.analysis?.position !== undefined && result.analysis.position !== null ? (
                            <span className="text-sm font-medium">#{result.analysis.position}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result ? (
                            <span className="text-sm font-medium">70</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result ? (
                            <Badge variant={result.aivScore > 50 ? 'success' : 'warning'}>
                              {result.aivScore.toFixed(1)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result?.error ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : result ? (
                            <Badge variant="success">Calculated</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              onClick={handleSaveEdit}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingId(null);
                                setEditService(null);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow
                      key={service.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedServiceId === service.id ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedServiceId(service.id === selectedServiceId ? null : service.id)}
                    >
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{service.search_query}</TableCell>
                      <TableCell>{service.location_city}</TableCell>
                      <TableCell>
                        {result ? (
                          <Badge variant={result.analysis?.foundUrl ? 'success' : 'outline'}>
                            {result.analysis?.foundUrl ? '1' : '0'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result?.analysis?.position !== undefined && result.analysis.position !== null ? (
                          <span className="text-sm font-medium">#{result.analysis.position}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result ? (
                          <span className="text-sm font-medium">70</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result ? (
                          <Badge variant={result.aivScore > 50 ? 'success' : 'warning'}>
                            {result.aivScore.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {result?.error ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : result ? (
                          <Badge variant="success">Calculated</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCalculateService(service.id);
                            }}
                            disabled={isCalculating}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                            title="Calculate only this service"
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditService(service);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Service Analysis Detail for the selected service */}
        {selectedServiceId && (
          <div className="mt-8 space-y-8 animate-fade-in pt-6 border-t border-border">
            {(() => {
              const result = calculationResults.get(selectedServiceId);
              const service = services.find((s) => s.id === selectedServiceId);

              if (!service) return null;

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Аналіз: {service.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {service.search_query} • {service.location_city}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedServiceId(null)}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Закрити
                    </Button>
                  </div>

                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="overview">Результати (ТЗ)</TabsTrigger>
                      <TabsTrigger value="calculate">Дії та Логи</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      {!result || !result.analysis || result.error ? (
                        <div className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/30">
                          <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium mb-2">Немає даних для аналізу</h3>
                          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {result?.error
                              ? `Виникла помилка: ${result.error}`
                              : 'Ця послуга ще не була проаналізована. Натисніть кнопку нижче, щоб запустити пошук в AI системах.'}
                          </p>
                          <Button
                            onClick={() => handleCalculateService(service.id)}
                            disabled={isCalculating}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isCalculating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Розрахунок...
                              </>
                            ) : (
                              <>
                                <Calculator className="h-4 w-4 mr-2" />
                                Розрахувати зараз
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <ServiceAnalysisDetail
                            data={result.analysis}
                            domain={domain}
                            targetPage={service.path ? `https://${domain}${service.path}` : `https://${domain}`}
                            country={service.location_country || 'UA'}
                            competitorsAvgScore={70}
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="calculate" className="mt-6">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Керування аналізом</CardTitle>
                            <CardDescription>
                              Запустіть новий розрахунок або перегляньте технічні логи взаємодії з AI.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              onClick={() => handleCalculateService(service.id)}
                              disabled={isCalculating}
                              variant="outline"
                              className="w-full md:w-auto"
                            >
                              {isCalculating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Calculator className="h-4 w-4 mr-2" />
                              )}
                              Перезапустити розрахунок
                            </Button>
                          </CardContent>
                        </Card>

                        {result?.analysis?.llmLogs && result.analysis.llmLogs.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              Технічні логи LLM
                              <Badge variant="outline" className="font-normal">
                                {result.analysis.llmLogs.length} записів
                              </Badge>
                            </h3>
                            <LLMLogsViewer logs={result.analysis.llmLogs} />
                          </div>
                        )}

                        {!result?.analysis?.llmLogs && (
                          <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">Логи будуть доступні після завершення розрахунку.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

