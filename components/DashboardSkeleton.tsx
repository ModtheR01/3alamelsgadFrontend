'use client';

import React from 'react';

/** Shared pulsing placeholder bar used to build up skeleton layouts. */
export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[#EAE4DC] ${className}`} />;
}

/** Skeleton rows for admin dashboard tables (Products, Banners, etc.). */
export function SkeletonTableRows({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <tbody className="divide-y divide-[#EAE4DC]">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="py-3 px-4">
              <SkeletonBar className={`h-3 ${colIndex === 0 ? 'w-32' : 'w-20'}`} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/** Skeleton card grid for image-led tabs (Events, Projects, Collaborations). */
export function SkeletonCardGrid({
  count = 6,
  columnsClassName = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  imageAspectClassName = 'aspect-[4/3]',
  showImage = true,
}: {
  count?: number;
  columnsClassName?: string;
  imageAspectClassName?: string;
  showImage?: boolean;
}) {
  return (
    <div className={`grid ${columnsClassName} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-[#EAE4DC] shadow-sm overflow-hidden">
          {showImage && <div className={`${imageAspectClassName} bg-[#EFEBE3] animate-pulse`} />}
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-2.5 w-1/3" />
            <SkeletonBar className="h-4 w-2/3" />
            <SkeletonBar className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton stacked rows for list-style tabs (Orders). */
export function SkeletonListRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
            <SkeletonBar className="h-3 w-40" />
            <SkeletonBar className="h-6 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonBar className="h-10 w-full rounded-lg" />
            <SkeletonBar className="h-10 w-full rounded-lg" />
            <SkeletonBar className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
