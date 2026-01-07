/**
 * ServiceTable Component
 * Week 3, Days 4-5: Table with filtering, sorting, and search
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { getAIVBadgeVariant, getAIVRating } from '~/lib/modules/services/aiv-calculator';
import { getPageSpeedBadgeVariant } from '~/lib/modules/audit/pagespeed-integration';

export interface Service {
  id: string;
  projectId: string;
  serviceName: string;
  targetPage: string;
  country?: string;
  city?: string;
  visibility_score?: number;
  position?: number;
  aiv_score?: number;
  pagespeed_score?: number;
  schema_score?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceTableProps {
  services: Service[];
  isLoading?: boolean;
  onServiceSelect?: (service: Service) => void;
  onServiceDelete?: (id: string) => void;
}

type SortColumn = keyof Service | 'none';
type SortDirection = 'asc' | 'desc' | 'none';
type VisibilityFilter = 'all' | 'visible' | 'hidden';

export function ServiceTable({
  services,
  isLoading = false,
  onServiceSelect,
  onServiceDelete,
}: ServiceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.serviceName.toLowerCase().includes(query) ||
          service.targetPage.toLowerCase().includes(query) ||
          service.city?.toLowerCase().includes(query)
      );
    }

    // Visibility filter
    if (visibilityFilter !== 'all') {
      const isVisible = visibilityFilter === 'visible';
      filtered = filtered.filter(
        (service) => (service.visibility_score ?? 0) > 0 === isVisible
      );
    }

    // Sorting
    if (sortColumn !== 'none' && sortDirection !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === undefined || bVal === undefined) return 0;

        let comparison = 0;
        if (typeof aVal === 'string') {
          comparison = (aVal as string).localeCompare(bVal as string);
        } else if (typeof aVal === 'number') {
          comparison = (aVal as number) - (bVal as number);
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [services, searchQuery, visibilityFilter, sortColumn, sortDirection]);

  // Toggle sorting
  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn('none');
        setSortDirection('none');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        {/* Search */}
        <Input
          placeholder="Search services, URLs, cities..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />

        {/* Visibility Filter */}
        <Select
          value={visibilityFilter}
          onValueChange={(value: string) => setVisibilityFilter(value as VisibilityFilter)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="visible">Visible Only</SelectItem>
            <SelectItem value="hidden">Hidden Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('serviceName')}
              >
                <div className="flex items-center gap-2">
                  Service {renderSortIcon('serviceName')}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('visibility_score')}
              >
                <div className="flex items-center gap-2">
                  Visibility {renderSortIcon('visibility_score')}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('aiv_score')}
              >
                <div className="flex items-center gap-2">
                  AIV Score {renderSortIcon('aiv_score')}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('pagespeed_score')}
              >
                <div className="flex items-center gap-2">
                  PageSpeed {renderSortIcon('pagespeed_score')}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('schema_score')}
              >
                <div className="flex items-center gap-2">
                  Schema {renderSortIcon('schema_score')}
                </div>
              </TableHead>

              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {isLoading ? 'Loading services...' : 'No services found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow
                  key={service.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onServiceSelect?.(service)}
                >
                  {/* Service Name */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{service.serviceName}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        {service.targetPage}
                      </span>
                      {service.city && (
                        <span className="text-xs text-muted-foreground">
                          📍 {service.city}
                          {service.country && `, ${service.country}`}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Visibility Score */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          (service.visibility_score ?? 0) > 0 ? 'success' : 'secondary'
                        }
                      >
                        {(service.visibility_score ?? 0).toFixed(0)}%
                      </Badge>
                      {service.position && (
                        <span className="text-sm text-muted-foreground">
                          Pos: {service.position}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* AIV Score */}
                  <TableCell>
                    {service.aiv_score !== undefined && (
                      <div className="flex items-center gap-2">
                        <Badge variant={getAIVBadgeVariant(service.aiv_score)}>
                          {service.aiv_score.toFixed(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getAIVRating(service.aiv_score)}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  {/* PageSpeed Score */}
                  <TableCell>
                    {service.pagespeed_score !== undefined ? (
                      <Badge variant={getPageSpeedBadgeVariant(service.pagespeed_score)}>
                        {service.pagespeed_score}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Schema Score */}
                  <TableCell>
                    {service.schema_score !== undefined ? (
                      <Badge variant={service.schema_score >= 50 ? 'success' : 'warning'}>
                        {service.schema_score}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onServiceSelect?.(service)}
                      >
                        View
                      </Button>
                      {onServiceDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onServiceDelete(service.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredServices.length} of {services.length} services
      </div>
    </div>
  );
}
