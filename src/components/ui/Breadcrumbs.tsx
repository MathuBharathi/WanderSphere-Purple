import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd } from './JsonLd';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const allItems = [{ label: 'Home', href: '/' }, ...items];

  const jsonLdItems = allItems.map((item) => ({
    name: item.label,
    item: item.href,
  }));

  return (
    <>
      <JsonLd type="breadcrumbs" breadcrumbItems={jsonLdItems} />
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center text-xs space-x-1.5 overflow-x-auto py-2 ${className}`}
      >
        <ol className="flex items-center space-x-1.5">
          {allItems.map((item, idx) => {
            const isLast = idx === allItems.length - 1;
            return (
              <li key={item.href} className="flex items-center space-x-1.5 whitespace-nowrap">
                {idx > 0 && (
                  <ChevronRight size={12} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
                )}
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-semibold"
                    style={{ color: 'var(--ws-accent)' }}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 hover:underline transition-colors"
                    style={{ color: 'var(--ws-text-secondary)' }}
                  >
                    {idx === 0 && <Home size={12} />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
