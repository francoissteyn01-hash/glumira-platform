"use client";

/**
 * GluMira™ Offline Fallback Page
 * Version: 7.0.0
 * Route: /offline
 *
 * Shown by the service worker when the user is offline
 * and no cached version of the requested page is available.
 */

import React from "react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-glumira-bg flex flex-col items-center justify-center px-4 text-center">
      {/* Icon */}
      <div className="text-6xl mb-6">📡</div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        You&apos;re offline
      </h1>
      <p className="text-gray-500 max-w-sm mb-8">
        GluMira™ can&apos;t reach the server right now. Check your internet connection
        and try again. Your previously loaded data is still available.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.location.reload()}
          className="glum-btn-primary"
        >
          Try Again
        </button>
        <Link href="/dashboard" className="glum-btn-secondary">
          Go to Dashboard
        </Link>
      </div>

      {/* Cached data note */}
      <div className="mt-12 glum-alert-info max-w-sm text-sm">
        <strong>Cached data available.</strong> Your IOB calculations and meal logs
        from your last session are stored locally and will sync when you reconnect.
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        GluMira™ · IOB Hunter™ · Not a medical device
      </p>
    </div>
  );
}
