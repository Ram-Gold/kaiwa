'use client';

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { cn } from '../../lib/utils.js';

export function CardSkeleton({ className = '', count = 1 }) {
  const items = Array.from({ length: count });

  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9" duration={1.5}>
      {items.map((_, index) => (
        <div key={index} className="w-full flex flex-col items-center">
          <div className="w-full space-y-2">
            {/* THE EXACT NEUBRUTAL CARD SHELL */}
            <div
              className={cn(
                'nb-card-clean p-6 relative block text-left outline-none pointer-events-none select-none bg-white',
                className
              )}
            >
              {/* TOP SYMMETRICAL BADGE ROW */}
              <div className="flex items-center justify-between gap-2 mb-5">
                <span className="nb-pill bg-slate-100 text-transparent border-2 border-ink select-none">
                  <Skeleton width={52} height={12} borderRadius={9999} />
                </span>
                <span className="nb-pill bg-slate-100 text-transparent border-2 border-ink select-none">
                  <Skeleton width={24} height={12} borderRadius={9999} />
                </span>
              </div>

              {/* CARD TITLE & SUBTITLE WITH EXACT RESERVED HEIGHT */}
              <div className="mb-6 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black leading-8 w-3/5">
                    <Skeleton height={26} borderRadius={8} />
                  </h3>
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Skeleton width={20} height={20} borderRadius={6} />
                  </div>
                </div>
                {/* Fixed height container ensures ZERO layout shift */}
                <div className="h-5 flex items-center w-2/5">
                  <Skeleton height={14} width="100%" borderRadius={6} />
                </div>
              </div>

              {/* FOOTER / PROGRESS BAR */}
              <div className="space-y-1.5 pt-2 border-t-2 border-slate-100">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="w-16">
                    <Skeleton height={12} borderRadius={4} />
                  </span>
                  <span className="w-8">
                    <Skeleton height={12} borderRadius={4} />
                  </span>
                </div>
                <div className="w-full bg-slate-100 border-2 border-black h-3.5 rounded-full overflow-hidden p-0.5">
                  <div className="h-full w-2/5 rounded-full overflow-hidden">
                    <Skeleton height="100%" borderRadius={9999} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </SkeletonTheme>
  );
}

export default CardSkeleton;
