import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BadgeTier } from "@/lib/constants";

interface Badge { id:string; slug:string; name:string; description:string; tier:BadgeTier; iconEmoji:string; earnedAt:string|null; }
const TIER: Record<BadgeTier,string> = { bronze:"border-amber-600 bg-amber-950/30 text-amber-400", silver:"border-gray-500 bg-gray-800 text-gray-300", gold:"border-yellow-400 bg-yellow-950/30 text-yellow-300", platinum:"border-violet-400 bg-violet-950/30 text-violet-300" };

export default function BadgesPage() {
  const [badges, setBadges]   = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string|null>(null);
  useEffect(()=>{ apiFetch<Badge[]>("/api/badges").then(setBadges).catch(e=>setError(e.message)).finally(()=>setLoading(false)); },[]);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><p className="text-gray-300 animate-pulse">Loading badges…</p></div>;
  const earned = badges.filter(b=>b.earnedAt!==null);
  const locked = badges.filter(b=>b.earnedAt===null);
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div><h1 className="text-2xl font-bold text-white">Your Badges</h1><p className="text-sm text-gray-300 mt-1">{earned.length} of {badges.length} earned</p></div>
        {error&&<div className="rounded-lg bg-red-950/40 border border-red-800 px-4 py-3"><p className="text-sm text-red-400">{error}</p></div>}
        {earned.length>0&&<section><h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-3">Earned</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{earned.map(b=><Card key={b.id} badge={b}/>)}</div></section>}
        {locked.length>0&&<section><h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-3">Locked</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{locked.map(b=><Card key={b.id} badge={b} locked/>)}</div></section>}
      </div>
    </div>
  );
}
function Card({badge,locked=false}:{badge:Badge;locked?:boolean}){return(<div className={cn("rounded-xl border-2 p-4 text-center transition-opacity",TIER[badge.tier],locked&&"opacity-40 grayscale")}><div className="text-4xl mb-2">{locked?"🔒":badge.iconEmoji}</div><p className="text-xs font-bold uppercase tracking-wide">{badge.tier}</p><p className="text-sm font-semibold mt-1">{badge.name}</p><p className="text-xs mt-1 opacity-75">{badge.description}</p>{badge.earnedAt&&<p className="text-xs mt-2 opacity-60">{new Date(badge.earnedAt).toLocaleDateString()}</p>}</div>);}
