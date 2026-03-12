'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

      <p className="text-base font-medium text-slate-700">
        Loading your dashboard...
      </p>

      <div className="mt-6 w-64 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}