'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';

export default function PrototypePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="correction" className="rounded-md">
              PROTOTYPE LAB
            </Badge>
            <span className="font-mono text-xs font-bold text-ink/60">
              /prototype • UI Sandbox
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg bg-paper border-2 border-black px-3 py-1.5 font-mono text-xs font-black text-ink shadow-[0_2px_0_0_#1C1C1C] hover:bg-mustard transition-all"
          >
            <span>Back to App</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          KAIwa Prototype Studio
        </h1>
        <p className="max-w-2xl font-sans text-base text-ink/80">
          Clean sandbox ready for prototyping new UI components, interactive features, and design experiments.
        </p>
      </header>

      <div className="rounded-3xl border-2 border-dashed border-black/30 bg-white/60 p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-mustard shadow-[0_3px_0_0_#1C1C1C] mb-4">
          <Layers className="h-6 w-6 text-ink" />
        </div>
        <h3 className="font-display text-xl font-black text-ink">
          Prototype Space Ready
        </h3>
        <p className="mt-1 max-w-md mx-auto font-sans text-sm text-ink/70">
          Previous prototypes have been graduated to production. This space is clear for the next UI design or feature prototype.
        </p>
      </div>
    </div>
  );
}
