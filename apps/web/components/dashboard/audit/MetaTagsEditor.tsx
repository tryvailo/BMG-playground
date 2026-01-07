/**
 * MetaTagsEditor Component
 * Week 4, Days 4-5: Edit and optimize meta tags
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export interface MetaTagsEditorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (metaTags: MetaTagsEditorData) => Promise<void>;
  initialData?: MetaTagsEditorData;
  url: string;
}

export interface MetaTagsEditorData {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
}

export function MetaTagsEditor({
  open = false,
  onOpenChange,
  onSave,
  initialData,
  url,
}: MetaTagsEditorProps) {
  const [data, setData] = useState<MetaTagsEditorData>(
    initialData || {
      title: '',
      description: '',
      canonical: url,
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary',
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(data);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onOpenChange?.(false);
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const titleLength = data.title.length;
  const descLength = data.description.length;

  const titleOptimal = titleLength >= 30 && titleLength <= 60;
  const descOptimal = descLength >= 120 && descLength <= 160;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Meta Tags</DialogTitle>
          <DialogDescription>Optimize your page metadata for better SEO</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Title</CardTitle>
              <CardDescription>30-60 characters recommended</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Enter page title"
                value={data.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, title: e.target.value })}
                maxLength={100}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {titleLength} / 100 characters
                </span>
                {titleOptimal ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> Optimal
                  </Badge>
                ) : titleLength < 30 ? (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="w-3 h-3" /> Too short
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" /> Too long
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta Description</CardTitle>
              <CardDescription>120-160 characters recommended</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Enter meta description"
                value={data.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, description: e.target.value })}
                maxLength={300}
                rows={3}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {descLength} / 300 characters
                </span>
                {descOptimal ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> Optimal
                  </Badge>
                ) : descLength < 120 ? (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="w-3 h-3" /> Too short
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" /> Too long
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Canonical */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canonical URL</CardTitle>
              <CardDescription>Specify the preferred version of this page</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="https://example.com/page"
                value={data.canonical}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, canonical: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Open Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Graph (Social Sharing)</CardTitle>
              <CardDescription>Optimize appearance on social media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">OG Title</label>
                <Input
                  placeholder="Title for social sharing"
                  value={data.ogTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, ogTitle: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-sm font-medium">OG Description</label>
                <Textarea
                  placeholder="Description for social sharing"
                  value={data.ogDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, ogDescription: e.target.value })}
                  maxLength={300}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">OG Image URL</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={data.ogImage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, ogImage: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Twitter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Twitter Card</CardTitle>
              <CardDescription>Optimize for Twitter sharing</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={data.twitterCard}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData({ ...data, twitterCard: e.target.value })}
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary with Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </CardContent>
          </Card>

          {/* Preview Alert */}
          {(!titleOptimal || !descOptimal) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some meta tags need optimization for better SEO performance
              </AlertDescription>
            </Alert>
          )}

          {/* Save Success */}
          {saved && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Meta tags saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
