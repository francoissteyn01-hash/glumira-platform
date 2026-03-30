/**
 * GluMira™ V7 — Pregnancy Module
 * Auto-generated placeholder — replace with full module content
 */
import { Link } from "react-router-dom";

export default function PregnancyModule() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/education" className="text-sm text-[#2ab5c1] hover:underline mb-6 inline-block">
          ← Back to Education
        </Link>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-10 text-center shadow-sm">
          <div className="text-6xl mb-4">🤱</div>
          <h1 className="text-3xl font-['Playfair_Display'] text-[#1a2a5e] mb-3">
            Pregnancy & Diabetes
          </h1>
          <p className="text-[#4a5568] font-['DM_Sans'] mb-6">
            This module is being prepared. Check back soon.
          </p>
          <p className="text-xs text-[#718096] mt-8">
            GluMira™ is an educational platform. Not a medical device.
          </p>
        </div>
      </div>
    </div>
  );
}