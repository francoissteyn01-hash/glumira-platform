/**
 * GluMira V7 — Individual Education Topic Page
 * Mobile-first, Scandinavian Minimalist (bg-gray-950).
 */
import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { EDUCATION_TOPICS } from "@/data/education-topics";

export default function EducationTopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [markedRead, setMarkedRead] = useState(false);

  const topic = useMemo(
    () => EDUCATION_TOPICS.find(t => t.id === Number(id)),
    [id]
  );

  const relatedTopics = useMemo(() => {
    if (!topic) return [];
    return EDUCATION_TOPICS
      .filter(t => t.group === topic.group && t.id !== topic.id)
      .slice(0, 3);
  }, [topic]);

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-sm">Topic not found.</p>
          <Link to="/education" className="text-teal-500 text-sm hover:underline">
            Back to Education
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/education")}
          className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Education
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/education" className="hover:text-gray-300 transition-colors">Education</Link>
          <span>/</span>
          <span className="text-teal-500 font-medium">Group {topic.group}</span>
          <span>/</span>
          <span className="text-gray-400">{topic.groupTitle}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
          {topic.title}
        </h1>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block bg-teal-900/50 text-teal-400 text-xs font-medium px-3 py-1 rounded-full">
            {topic.ageRange === "all" ? "All ages" : `Ages ${topic.ageRange}`}
          </span>
          <span className="inline-block border border-slate-600 text-slate-400 text-xs font-medium px-3 py-1 rounded-full">
            {topic.audience === "all" ? "Everyone" : topic.audience.charAt(0).toUpperCase() + topic.audience.slice(1)}
          </span>
          <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
            topic.status === "available"
              ? "bg-green-900/40 text-green-400"
              : "bg-amber-900/40 text-amber-400"
          }`}>
            {topic.status === "available" ? "Available" : "Coming Soon"}
          </span>
        </div>

        {/* Content section */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Content</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Content coming soon — this topic is being written by our clinical education team.
          </p>
        </div>

        {/* Key takeaways */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Key Takeaways</h2>
          <ul className="space-y-2">
            {[1, 2, 3].map(i => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                <span className="text-sm text-gray-500">Coming soon</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mark as read */}
        <button
          onClick={() => setMarkedRead(prev => !prev)}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
            markedRead
              ? "bg-teal-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {markedRead ? "Marked as Read" : "Mark as Read"}
        </button>

        {/* Related topics */}
        {relatedTopics.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Related Topics in Group {topic.group}
            </h2>
            <div className="space-y-2">
              {relatedTopics.map(rt => (
                <Link
                  key={rt.id}
                  to={`/education/${rt.id}`}
                  className="block rounded-xl border border-gray-800 bg-gray-900 p-4 hover:bg-gray-800/60 transition-colors"
                >
                  <p className="text-sm text-white">{rt.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-teal-400 bg-teal-900/50 px-2 py-0.5 rounded-full">
                      {rt.ageRange === "all" ? "All ages" : `Ages ${rt.ageRange}`}
                    </span>
                    <span className="text-[10px] text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full">
                      {rt.audience === "all" ? "Everyone" : rt.audience.charAt(0).toUpperCase() + rt.audience.slice(1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating "Ask Mira" button */}
      <button
        onClick={() => navigate(`/mira?q=${encodeURIComponent(topic.title)}`)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow-lg shadow-teal-900/50 flex items-center justify-center transition-colors z-50"
        title="Ask Mira about this"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
}
