'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calculator, Loader2, X, Save } from 'lucide-react';
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
import { Skeleton } from '@kit/ui/skeleton';
import { toast } from 'sonner';
import type { ServiceAnalysisData } from '~/lib/actions/playground-test';
import { runLiveDashboardTest } from '~/lib/actions/playground-test';
import { calculateServiceAivScore } from '~/lib/modules/analytics/calculator';
import { LLMLogsViewer } from './LLMLogsViewer';
import { ServiceAnalysisDetail } from './ServiceAnalysisDetail';

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

  // Load services from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const loadedServices = JSON.parse(stored) as PlaygroundService[];
        setServices(loadedServices);
      }
    } catch (error) {
      console.error('[ServicesTable] Error loading services from storage:', error);
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Save to localStorage whenever services change (but not on initial load)
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(services));
    } catch (error) {
      console.error('[ServicesTable] Error saving services to storage:', error);
    }
  }, [services, isInitialized, storageKey]);

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
          calculationResults.set(service.id, calculationResult);
          setCalculationResults(new Map(calculationResults));

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
          calculationResults.set(service.id, calculationResult);
          setCalculationResults(new Map(calculationResults));

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
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? 'outline' : 'default'}
              className="flex items-center gap-2"
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
                  <TableHead>AIV Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
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
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{service.search_query}</TableCell>
                      <TableCell>{service.location_city}</TableCell>
                      <TableCell>
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
                            onClick={() => handleEditService(service)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteService(service.id)}
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

        {/* Service Analysis Detail for each calculated service */}
        {calculationResults.size > 0 && (
          <div className="mt-8 space-y-8">
            {Array.from(calculationResults.values())
              .filter((result) => result.analysis && !result.error)
              .map((result) => {
                const service = services.find((s) => s.id === result.serviceId);
                if (!service || !result.analysis) return null;

                return (
                  <div key={result.serviceId} className="space-y-4">
                    {/* Service Analysis Detail Component */}
                    <ServiceAnalysisDetail
                      data={result.analysis}
                      domain={domain}
                      targetPage={service.path ? `https://${domain}${service.path}` : `https://${domain}`}
                      country={service.location_country || 'UA'}
                      competitorsAvgScore={70}
                    />
                  </div>
                );
              })}
          </div>
        )}

        {/* LLM Logs Viewer - Show all logs together */}
        {calculationResults.size > 0 && (
          <div className="mt-6">
            {Array.from(calculationResults.values())
              .filter((result) => result.analysis?.llmLogs && result.analysis.llmLogs.length > 0)
              .map((result) => (
                <div key={result.serviceId} className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    LLM Logs for: {result.serviceName}
                  </h3>
                  <LLMLogsViewer logs={result.analysis!.llmLogs} />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

