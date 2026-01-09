'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calculator, Loader2, X, Save, Briefcase, MoreHorizontal, CheckCircle2, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { getCitiesByCountryCode, type CityData } from '~/lib/data/cities';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getServices, createService, deleteService as dbDeleteService, type Service } from '~/lib/actions/services';
import { saveScanResult } from '~/lib/actions/scans';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Horizon UI Design Tokens
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  secondary: '#A3AED0',
  secondaryLight: '#A3AED015',
  success: '#01B574',
  warning: '#FFB547',
  error: '#EE5D50',
  background: '#F4F7FE',
  cardBg: '#FFFFFF',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
};

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
  projectId: string;
  domain: string;
  apiKeyOpenAI: string;
  apiKeyPerplexity: string;
  onCalculationsComplete?: (results: ServiceCalculationResult[]) => void;
  storageKey?: string; // Kept for backward compatibility but using DB principally
  onDeleteService?: (id: string) => Promise<void>;
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
  projectId,
  domain,
  apiKeyOpenAI,
  apiKeyPerplexity,
  onCalculationsComplete,
  storageKey = 'playground_services',
  onDeleteService,
}: ServicesTableProps) {
  const [services, setServices] = useState<PlaygroundService[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResults, setCalculationResults] = useState<Map<string, ServiceCalculationResult>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityData[]>([]);

  // Load cities for Ukraine (default country)
  useEffect(() => {
    const uaCities = getCitiesByCountryCode('UA');
    setCities(uaCities);
  }, []);

  // Load services from database on mount
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      try {
        const dbServices = await getServices({ projectId });
        if (dbServices && dbServices.length > 0) {
          setServices(dbServices.map((s: Service) => ({
            id: s.id,
            name: s.name,
            search_query: s.search_query,
            location_city: s.location_city || '',
            path: s.path || '',
            location_country: s.location_country || 'UA'
          })));
        } else {
          setServices(DEFAULT_SERVICES);
          const mockResults = generateMockResults(domain || 'yourclinic.com');
          setCalculationResults(mockResults);
        }
      } catch (error) {
        console.error('[ServicesTable] Error loading services:', error);
        setServices(DEFAULT_SERVICES);
      }
      setIsInitialized(true);
    };

    loadData();
  }, [projectId, domain]);

  // Save to localStorage whenever services change (but not on initial load)
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(services));

      // Also persist calculation results (convert Map to plain object for JSON)
      const resultsObj = Object.fromEntries(calculationResults.entries());
      localStorage.setItem(`${storageKey}_results`, JSON.stringify(resultsObj));
    } catch (error) {
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

  const handleAddService = async () => {
    if (!newService.name || !newService.search_query || !newService.location_city) {
      toast.error('Please fill in all required fields (Name, Search Query, Location City)');
      return;
    }

    try {
      const service = await createService({
        project_id: projectId,
        name: newService.name,
        search_query: newService.search_query,
        location_city: newService.location_city,
        path: newService.path || undefined,
        location_country: newService.location_country || 'UA',
      });

      const updatedService: PlaygroundService = {
        id: service.id,
        name: service.name,
        search_query: service.search_query,
        location_city: service.location_city || '',
        path: service.path || undefined,
        location_country: service.location_country || undefined,
      };

      setServices([...services, updatedService]);
      setNewService({
        name: '',
        search_query: '',
        location_city: '',
        path: '',
        location_country: '',
      });
      setIsAdding(false);
      toast.success('Service added successfully');
    } catch (error) {
      console.error('[ServicesTable] Error adding service:', error);
      toast.error('Failed to add service to database');
    }
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

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteService = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю послугу?')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete from DB if it's a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        await dbDeleteService({ id });
      }

      if (onDeleteService) {
        await onDeleteService(id);
      }

      const updatedServices = services.filter((s) => s.id !== id);
      setServices(updatedServices);
      calculationResults.delete(id);
      setCalculationResults(new Map(calculationResults));

      if (selectedServiceId === id) {
        setSelectedServiceId(null);
      }

      toast.success('Послугу видалено');
    } catch (error) {
      console.error('[ServicesTable] Error deleting service:', error);
      toast.error('Не вдалося видалити послугу');
    } finally {
      setIsDeleting(false);
    }
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

      // When no results found, AIV = 1 (no competitors)
      let aivScore = 1;
      if (!serviceAnalysis.noResults && serviceAnalysis.totalResults > 0) {
        const aivScoreResult = calculateServiceAivScore({
          isVisible: serviceAnalysis.foundUrl !== null,
          position: serviceAnalysis.position,
          totalResults: serviceAnalysis.totalResults,
          competitorsAvgScore: 70,
        });
        aivScore = aivScoreResult.finalScore;
      }

      const calculationResult: ServiceCalculationResult = {
        serviceId: service.id,
        serviceName: service.name,
        analysis: serviceAnalysis,
        aivScore,
      };

      // Save scan to database
      try {
        await saveScanResult({
          service_id: service.id,
          ai_engine: serviceAnalysis.aiEngine?.toLowerCase().includes('perplexity') ? 'perplexity' : 'openai',
          visible: serviceAnalysis.foundUrl !== null,
          position: serviceAnalysis.position,
          raw_response: serviceAnalysis.recommendationText,
          analyzed_at: new Date().toISOString()
        });
      } catch (saveError) {
        console.error('[ServicesTable] Error saving scan to DB:', saveError);
      }

      setCalculationResults(prev => {
        const newMap = new Map(prev);
        newMap.set(service.id, calculationResult);
        return newMap;
      });

      toast.success(`Calculated: ${service.name}`);
    } catch (error) {
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

          // When no results found, AIV = 1 (no competitors)
          let aivScore = 1;
          if (!serviceAnalysis.noResults && serviceAnalysis.totalResults > 0) {
            const aivScoreResult = calculateServiceAivScore({
              isVisible: serviceAnalysis.foundUrl !== null,
              position: serviceAnalysis.position,
              totalResults: serviceAnalysis.totalResults,
              competitorsAvgScore: 70, // Default for playground
            });
            aivScore = aivScoreResult.finalScore;
          }

          const calculationResult: ServiceCalculationResult = {
            serviceId: service.id,
            serviceName: service.name,
            analysis: serviceAnalysis,
            aivScore,
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
        } catch (error) {
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
    } catch (error) {
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
    <Card className="transition-all duration-300 rounded-[20px] border-none bg-white shadow-[0_18px_40px_rgba(112,144,176,0.12)] overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>Services Management</CardTitle>
            <CardDescription className="text-sm" style={{ color: HORIZON.secondary }}>
              Add and manage services to track in AI recommendations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {services.length > 0 && (
              <Button
                onClick={handleCalculateAll}
                disabled={isCalculating || !apiKeyOpenAI || !apiKeyPerplexity}
                className="flex items-center gap-2 rounded-xl text-white font-medium shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: HORIZON.primary }}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    Calculate All
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleResetToDefaults}
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Reset to default example services"
            >
              Reset
            </Button>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? 'outline' : 'default'}
              className={cn(
                "flex items-center gap-2 rounded-xl font-medium transition-all",
                !isAdding
                  ? "text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  : "border-gray-200"
              )}
              style={!isAdding ? { backgroundColor: HORIZON.primary } : undefined}
            >
              <Plus className="h-4 w-4" />
              {isAdding ? 'Cancel' : 'Add Service'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <MoreHorizontal className="h-5 w-5" />
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
                <Select
                  value={newService.location_city}
                  onValueChange={(value) => setNewService({ ...newService, location_city: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Оберіть місто" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {cities.map((city, idx) => (
                      <SelectItem key={`${city.name}-${idx}`} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <EmptyStateText>Click &quot;Add Service&quot; to get started.</EmptyStateText>
            <EmptyStateButton onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </EmptyStateButton>
          </EmptyState>
        ) : (
          <div className="rounded-[20px] overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F4F7FE] border-none hover:bg-[#F4F7FE]">
                  <TableHead className="text-xs font-bold uppercase tracking-wider py-4" style={{ color: HORIZON.secondary }}>
                    <div className="flex items-center gap-1">
                      Service Name
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.secondary }}>
                    <div className="flex items-center gap-1">
                      Search Query
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.secondary }}>
                    <div className="flex items-center gap-1">
                      Location
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: HORIZON.secondary }}>Visibility</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: HORIZON.secondary }}>Position</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: HORIZON.secondary }}>AIV Score</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.secondary }}>Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider w-32" style={{ color: HORIZON.secondary }}>Actions</TableHead>
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
                          <Select
                            value={editService.location_city}
                            onValueChange={(value) =>
                              setEditService({ ...editService, location_city: value })
                            }
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Оберіть місто" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {cities.map((city, idx) => (
                                <SelectItem key={`edit-${city.name}-${idx}`} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        'cursor-pointer transition-all duration-200 border-none',
                        selectedServiceId === service.id
                          ? 'bg-[#4318FF08]'
                          : 'hover:bg-gray-50/50'
                      )}
                      onClick={() => setSelectedServiceId(service.id === selectedServiceId ? null : service.id)}
                    >
                      <TableCell className="font-semibold py-4" style={{ color: HORIZON.textPrimary }}>{service.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm" style={{ color: HORIZON.secondary }}>{service.search_query}</TableCell>
                      <TableCell className="text-sm" style={{ color: HORIZON.secondary }}>{service.location_city}</TableCell>
                      <TableCell className="text-center">
                        {result ? (
                          result.analysis?.foundUrl ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${HORIZON.success}15`, color: HORIZON.success }}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Visible
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${HORIZON.error}15`, color: HORIZON.error }}>
                              <XCircle className="h-3.5 w-3.5" />
                              Hidden
                            </div>
                          )
                        ) : (
                          <span style={{ color: HORIZON.secondary }}>—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result?.analysis?.position !== undefined && result.analysis.position !== null ? (
                          <span className="text-sm font-bold" style={{ color: HORIZON.textPrimary }}>#{result.analysis.position}</span>
                        ) : (
                          <span style={{ color: HORIZON.secondary }}>—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {result ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" style={{ minWidth: '60px' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, result.aivScore)}%`,
                                  backgroundColor: result.aivScore > 50 ? HORIZON.primary : HORIZON.warning
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold min-w-[40px]" style={{ color: HORIZON.textPrimary }}>
                              {result.aivScore.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: HORIZON.secondary }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {result?.error ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${HORIZON.error}15`, color: HORIZON.error }}>
                            <XCircle className="h-3.5 w-3.5" />
                            Error
                          </div>
                        ) : result ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${HORIZON.success}15`, color: HORIZON.success }}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100" style={{ color: HORIZON.secondary }}>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Pending
                          </div>
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
                            disabled={isDeleting}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                            title="Видалити послугу"
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
          <div className="mt-8 space-y-6 pt-6" style={{ borderTop: `1px solid ${HORIZON.background}` }}>
            {(() => {
              const result = calculationResults.get(selectedServiceId);
              const service = services.find((s) => s.id === selectedServiceId);

              if (!service) return null;

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-5 rounded-[20px]"
                    style={{ backgroundColor: HORIZON.background }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: HORIZON.primaryLight }}
                      >
                        <Briefcase className="h-6 w-6" style={{ color: HORIZON.primary }} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold" style={{ color: HORIZON.textPrimary }}>
                          Аналіз: {service.name}
                        </h2>
                        <p className="text-sm" style={{ color: HORIZON.secondary }}>
                          {service.search_query} • {service.location_city}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedServiceId(null)}
                      className="rounded-xl h-10 px-4 font-medium hover:bg-white"
                      style={{ color: HORIZON.secondary }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList
                      className="grid w-full max-w-md grid-cols-2 p-1 rounded-xl h-12"
                      style={{ backgroundColor: HORIZON.background }}
                    >
                      <TabsTrigger
                        value="overview"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                        style={{ color: HORIZON.textSecondary }}
                      >
                        Results
                      </TabsTrigger>
                      <TabsTrigger
                        value="calculate"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                        style={{ color: HORIZON.textSecondary }}
                      >
                        Actions & Logs
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      {!result || !result.analysis || result.error ? (
                        <div
                          className="p-12 text-center rounded-[20px]"
                          style={{ backgroundColor: HORIZON.background }}
                        >
                          <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: HORIZON.secondaryLight }}
                          >
                            <Calculator className="h-8 w-8" style={{ color: HORIZON.secondary }} />
                          </div>
                          <h3 className="text-lg font-bold mb-2" style={{ color: HORIZON.textPrimary }}>
                            No Analysis Data
                          </h3>
                          <p className="max-w-sm mx-auto mb-6" style={{ color: HORIZON.secondary }}>
                            {result?.error
                              ? `Error occurred: ${result.error}`
                              : 'This service has not been analyzed yet. Click the button below to start AI analysis.'}
                          </p>
                          <Button
                            onClick={() => handleCalculateService(service.id)}
                            disabled={isCalculating}
                            className="rounded-xl px-6 py-5 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                            style={{ backgroundColor: HORIZON.primary }}
                          >
                            {isCalculating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Calculating...
                              </>
                            ) : (
                              <>
                                <Calculator className="h-4 w-4 mr-2" />
                                Calculate Now
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
                        {/* Action Card */}
                        <div
                          className="p-6 rounded-[20px]"
                          style={{ backgroundColor: 'white', boxShadow: '0 4px 12px rgba(112, 144, 176, 0.1)' }}
                        >
                          <h3 className="text-base font-bold mb-2" style={{ color: HORIZON.textPrimary }}>
                            Analysis Control
                          </h3>
                          <p className="text-sm mb-4" style={{ color: HORIZON.secondary }}>
                            Run a new calculation or view technical AI interaction logs.
                          </p>
                          <Button
                            onClick={() => handleCalculateService(service.id)}
                            disabled={isCalculating}
                            className="rounded-xl h-11 font-medium border-2"
                            variant="outline"
                            style={{ borderColor: HORIZON.primary, color: HORIZON.primary }}
                          >
                            {isCalculating ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Calculator className="h-4 w-4 mr-2" />
                            )}
                            Restart Calculation
                          </Button>
                        </div>

                        {/* LLM Logs */}
                        {result?.analysis?.llmLogs && result.analysis.llmLogs.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold" style={{ color: HORIZON.textPrimary }}>
                                Technical LLM Logs
                              </h3>
                              <Badge
                                className="font-semibold text-xs rounded-lg"
                                style={{ backgroundColor: HORIZON.primaryLight, color: HORIZON.primary }}
                              >
                                {result.analysis.llmLogs.length} entries
                              </Badge>
                            </div>
                            <LLMLogsViewer logs={result.analysis.llmLogs} />
                          </div>
                        )}

                        {!result?.analysis?.llmLogs && (
                          <div
                            className="p-8 text-center rounded-[20px]"
                            style={{ backgroundColor: HORIZON.background }}
                          >
                            <p className="text-sm" style={{ color: HORIZON.secondary }}>
                              Logs will be available after calculation completes.
                            </p>
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

