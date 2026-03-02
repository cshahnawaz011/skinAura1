import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonCard({ lines = 3, hasImage = false, hasCircle = false }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {hasImage && (
        <Skeleton className="w-full h-40 rounded-xl" />
      )}
      {hasCircle && (
        <div className="flex justify-center">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
          />
        ))}
      </div>
    </div>
  );
}