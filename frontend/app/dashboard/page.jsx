"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getTrends, getHistory } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

/*
 * TrendDashboard uses Recharts which depends on browser APIs
 * (ResizeObserver, window, document).  Dynamic import with ssr:false
 * ensures it is NEVER server-rendered, preventing:
 *   - ReferenceError: ResizeObserver is not defined
 *   - Hydration mismatch warnings
 *   - window is not defined errors
 */
const TrendDashboard = dynamic(
  () => import("@/components/TrendDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-10 text-center">
        <p className="text-sm text-gray-500 animate-pulse">Loading charts…</p>
      </div>
    ),
  }
);

// ... rest of dashboard/page.jsx remains exactly as previously generated ...