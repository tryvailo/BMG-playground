import { Link } from '~/lib/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ArrowLeft } from 'lucide-react';

import { SitePageHeader } from '../_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:blog') || 'Blog',
  };
};

// Simple frontmatter parser
function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterText = match[1];
  const postContent = match[2];
  const frontmatter: Record<string, string | string[] | boolean> = {};

  // Parse YAML-like frontmatter
  if (frontmatterText) {
    frontmatterText.split('\n').forEach((line) => {
      if (!line) return;
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value: string | string[] | boolean = line.substring(colonIndex + 1).trim();
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Parse arrays
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        }
        
        // Parse booleans
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        
        frontmatter[key] = value;
      }
    });
  }

  return { frontmatter, content: postContent };
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers (process in reverse order to avoid conflicts)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-10 mb-6">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-12 mb-8">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Lists - process line by line
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      processedLines.push('');
      continue;
    }
    const isListItem = /^- (.*)$/.test(line);
    
    if (isListItem) {
      if (!inList) {
        processedLines.push('<ul class="list-disc space-y-2 my-4 ml-6">');
        inList = true;
      }
      const content = line.replace(/^- (.*)$/, '$1');
      processedLines.push(`<li class="mb-2">${content}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  // Paragraphs - wrap non-empty lines that aren't already HTML tags
  html = html.split('\n\n').map(block => {
    if (!block.trim()) return '';
    // If block already contains HTML tags, return as is
    if (block.includes('<')) return block;
    // Otherwise wrap in paragraph
    return `<p class="mb-4 leading-relaxed">${block.trim()}</p>`;
  }).join('\n\n');
  
  return html;
}

async function BlogPage() {
  const { t } = await createI18nServerInstance();

  // Read the blog post
  const postPath = join(process.cwd(), 'content', 'posts', 'ai-visibility-clinics-2025.mdx');
  let postContent = '';
  let frontmatter: Record<string, unknown> = {};

  try {
    const fileContents = readFileSync(postPath, 'utf-8');
    const parsed = parseFrontmatter(fileContents);
    frontmatter = parsed.frontmatter;
    postContent = parsed.content || '';
  } catch (error) {
    console.error('Error reading blog post:', error);
    postContent = '';
  }

  return (
    <div className={'flex flex-col space-y-4 xl:space-y-8'}>
      <SitePageHeader
        title={t('marketing:blog') || 'Blog'}
        subtitle={t('marketing:blogSubtitle') || 'News and updates about the platform'}
      />

      <div className={'container flex flex-col space-y-8 pb-16'}>
        {(() => {
          const title = typeof frontmatter.title === 'string' ? frontmatter.title : null;
          const excerpt = typeof frontmatter.excerpt === 'string' ? frontmatter.excerpt : null;
          const date = typeof frontmatter.date === 'string' ? frontmatter.date : null;
          const tags = Array.isArray(frontmatter.tags) 
            ? frontmatter.tags.filter((tag): tag is string => typeof tag === 'string')
            : [];
          
          return title ? (
            <article className="max-w-4xl mx-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('marketing:backToBlog') || 'Back to blog'}</span>
              </Link>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h1 className="text-4xl font-bold mb-4">{title}</h1>
                
                {excerpt && (
                  <p className="text-xl text-muted-foreground mb-6">{excerpt}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                  {date && (
                    <time dateTime={date}>
                      {new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  {tags.length > 0 && (
                    <div className="flex gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              <div
                className="blog-content space-y-4"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(postContent || ''),
                }}
              />
            </div>
          </article>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('marketing:noPosts') || 'No posts found'}</p>
          </div>
        );
        })()}
      </div>
    </div>
  );
}

export default withI18n(BlogPage);

