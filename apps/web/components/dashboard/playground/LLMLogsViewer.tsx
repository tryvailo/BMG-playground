'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import type { LLMRequestLog } from '~/lib/actions/playground-test';

interface LLMLogsViewerProps {
  logs: LLMRequestLog[];
}

export function LLMLogsViewer({ logs }: LLMLogsViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (logs.length === 0) {
    return null;
  }

  const toggleLog = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJSON = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getProviderColor = (provider: string) => {
    return provider === 'openai' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300';
  };

  const getRoleColor = (role: string) => {
    return role === 'scanner' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300';
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          LLM Request & Response Logs
        </CardTitle>
        <CardDescription>
          Detailed logs of all LLM API requests and responses ({logs.length} request{logs.length !== 1 ? 's' : ''})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.map((log, index) => {
          const isExpanded = expandedLogs.has(index);
          const hasError = !!log.error;

          return (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden ${
                hasError
                  ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
              }`}
            >
              {/* Log Header */}
              <div
                className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleLog(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getProviderColor(log.provider)}>
                      {log.provider.toUpperCase()}
                    </Badge>
                    <Badge className={getRoleColor(log.role)}>
                      {log.role === 'scanner' ? 'Scanner' : 'Parser'}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {log.model}
                    </span>
                    {hasError && (
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    )}
                    {log.responseBody?.usage && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {log.responseBody.usage.total_tokens} tokens
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-white dark:bg-slate-950">
                  {/* Error Message */}
                  {hasError && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-300">
                      <strong>Error:</strong> {log.error}
                    </div>
                  )}

                  {/* Request Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Request
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(formatJSON(log.requestBody), index * 10 + 1);
                        }}
                      >
                        {copiedIndex === index * 10 + 1 ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-slate-900 dark:bg-slate-800 rounded p-3 overflow-x-auto">
                      <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap break-words">
                        {formatJSON(log.requestBody)}
                      </pre>
                    </div>
                  </div>

                  {/* Prompt Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Prompt
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(log.prompt, index * 10 + 2);
                        }}
                      >
                        {copiedIndex === index * 10 + 2 ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-slate-900 dark:bg-slate-800 rounded p-3 overflow-x-auto max-h-60 overflow-y-auto">
                      <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap break-words">
                        {log.prompt}
                      </pre>
                    </div>
                  </div>

                  {/* Response Section */}
                  {log.responseBody ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Response
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(log.responseBody?.content || '', index * 10 + 3);
                          }}
                        >
                          {copiedIndex === index * 10 + 3 ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      {log.responseBody.usage && (
                        <div className="mb-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="mr-3">
                            Prompt: {log.responseBody.usage.prompt_tokens} tokens
                          </span>
                          <span className="mr-3">
                            Completion: {log.responseBody.usage.completion_tokens} tokens
                          </span>
                          <span>Total: {log.responseBody.usage.total_tokens} tokens</span>
                        </div>
                      )}
                      <div className="bg-slate-900 dark:bg-slate-800 rounded p-3 overflow-x-auto max-h-96 overflow-y-auto">
                        <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap break-words">
                          {log.responseBody.content}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-300">
                      No response received
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

