/**
 * GluMira V7 — Education Hub
 * 100 topics across 10 groups (A-J) with search, filters, and collapsible sections.
 * Scandinavian Minimalist — bg-[var(--bg-primary)] interior.
 */
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EDUCATION_TOPICS, GROUPS, type EducationTopic } from "@/data/education-topics";

const AGE_RANGES = ["All", "0-5", "5-10", "10-13", "13-18", "Adult"] as const;
const AUDIENCES = ["All", "Parent", "Child", "Teen", "Clinician"] as const;

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-teal-400/30 text-[var(--text-primary)] rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function EducationPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("All");
  const [audienceFilter, setAudienceFilter] = useState<string>("All");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["A"]));

  const toggleGroup = (g: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return EDUCATION_TOPICS.filter(t => {
      if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (ageFilter !== "All" && t.ageRange !== "all" && !t.ageRange.includes(ageFilter.split("-")[0])) {
        // More precise age matching
        const filterParts = ageFilter.split("-").map(Number);
        const topicParts = t.ageRange.split("-").map(Number);
        if (t.ageRange === "all") return true;
        const [fLow, fHigh] = filterParts;
        const [tLow, tHigh] = topicParts;
        if (isNaN(tLow) || isNaN(tHigh)) return true;
        // Overlap check
        if (tHigh < fLow || tLow > fHigh) return false;
      }
      if (audienceFilter !== "All" && t.audience !== "all" && t.audience.toLowerCase() !== audienceFilter.toLowerCase()) return false;
      return true;
    });
  }, [search, ageFilter, audienceFilter]);

  const groupedFiltered = useMemo(() => {
    const map = new Map<string, EducationTopic[]>();
    for (const t of filtered) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Education</h1>
          <span className="bg-teal-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
            {filtered.length} topics
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-teal-600 transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-[var(--text-muted)] shrink-0 self-center">Age:</span>
            {AGE_RANGES.map(a => (
              <button type="button"
                key={a}
                onClick={() => setAgeFilter(a)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  ageFilter === a
                    ? "bg-teal-600 text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:opacity-80"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-[var(--text-muted)] shrink-0 self-center">For:</span>
            {AUDIENCES.map(a => (
              <button type="button"
                key={a}
                onClick={() => setAudienceFilter(a)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  audienceFilter === a
                    ? "bg-teal-600 text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:opacity-80"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-3">
          {GROUPS.map(group => {
            const topics = groupedFiltered.get(group.id);
            if (!topics || topics.length === 0) return null;
            const isOpen = openGroups.has(group.id);

            return (
              <div key={group.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                {/* Group header */}
                <button type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full text-left p-4 hover:opacity-80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-teal-500 font-bold text-sm">{group.id}</span>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{group.title}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{group.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[var(--bg-card)] text-[var(--text-muted)] text-xs px-2 py-0.5 rounded-full">
                        {topics.length}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs">{isOpen ? "−" : "+"}</span>
                    </div>
                  </div>
                </button>

                {/* Topics */}
                {isOpen && (
                  <div className="border-t border-[var(--border)]">
                    {topics.map(topic => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]/50 last:border-b-0 hover:opacity-90 transition-colors"
                      >
                        <Link
                          to={`/education/${topic.id}`}
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm text-[var(--text-primary)] leading-snug">
                            {highlightMatch(topic.title, search)}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-block bg-teal-900/50 text-teal-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {topic.ageRange === "all" ? "All ages" : `Ages ${topic.ageRange}`}
                            </span>
                            <span className="inline-block border border-slate-600 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {topic.audience === "all" ? "Everyone" : topic.audience.charAt(0).toUpperCase() + topic.audience.slice(1)}
                            </span>
                          </div>
                        </Link>
                        <button type="button"
                          onClick={() => navigate(`/mira?q=${encodeURIComponent(topic.title)}`)}
                          className="shrink-0 text-[10px] font-medium text-teal-400 border border-teal-700 rounded-lg px-2 py-1 hover:bg-teal-900/40 transition-colors"
                        >
                          Ask Mira
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)] text-sm">No topics match your search or filters.</p>
              <button type="button"
                onClick={() => { setSearch(""); setAgeFilter("All"); setAudienceFilter("All"); }}
                className="mt-3 text-teal-500 text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
