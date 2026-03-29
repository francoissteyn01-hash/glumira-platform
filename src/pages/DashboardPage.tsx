import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatGlucose, glucoseStatus, timeAgo, cn } from "@/lib/utils";
import { DISCLAIMER } from "@/lib/constants";

interface GlucoseReading { glucose: number; time: string; trend: string; }
const ARROWS: Record<string,string> = { DoubleUp:"⇈",SingleUp:"↑",FortyFiveUp:"↗",Flat:"→",FortyFiveDown:"↘",SingleDown:"↓",DoubleDown:"⇊",NONE:"—" };
const COLOURS: Record<string,string> = { low:"text-blue-400 border-blue-500",normal:"text-green-400 border-green-500",high:"text-amber-400 border-amber-500",critical:"text-red-400 border-red-500" };

export default function DashboardPage() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [nsUrl, setNsUrl]       = useState(() => localStorage.getItem("ns_url")??"");
  const [nsSecret, setNsSecret] = useState(() => localStorage.getItem("ns_secret")??"");
  const [syncing, setSyncing]   = useState(false);
  const [error, setError]       = useState<string|null>(null);
  const latest = readings[0]??null;
  const status = latest ? glucoseStatus(latest.glucose) : "normal";

  async function syncNS() {
    if (!nsUrl) return;
    setSyncing(true);
    try {
      localStorage.setItem("ns_url", nsUrl);
      localStorage.setItem("ns_secret", nsSecret);
      const data = await apiFetch<{readings:GlucoseReading[]}>("/api/nightscout/sync",{method:"POST",body:JSON.stringify({url:nsUrl,apiSecret:nsSecret,days:1})});
      setReadings(data.readings??[]); setError(null);
    } catch(e:any) { setError(e.message); } finally { setSyncing(false); }
  }

  useEffect(() => { if (nsUrl) syncNS(); }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Dashboard</h1><p className="text-sm text-gray-500">Welcome back{user?.email?`, ${user.email.split("@")[0]}`:""}</p></div>
        <div className="rounded-lg bg-amber-950/40 border border-amber-800 px-4 py-3"><p className="text-xs text-amber-400">{DISCLAIMER}</p></div>
        <div className={cn("rounded-2xl border-2 bg-gray-900 p-6 flex items-center justify-between",latest?COLOURS[status]:"border-gray-800")}>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Latest Glucose</p>
            {latest ? <><p className={cn("text-5xl font-bold",COLOURS[status].split(" ")[0])}>{formatGlucose(latest.glucose)}<span className="text-2xl ml-2">{ARROWS[latest.trend]??"—"}</span></p><p className="text-xs text-gray-500 mt-1">{timeAgo(latest.time)}</p></> : <p className="text-3xl font-bold text-gray-600">—</p>}
          </div>
          <button onClick={syncNS} disabled={syncing||!nsUrl} className="text-xs text-gray-500 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40">{syncing?"Syncing…":"↻ Sync"}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Readings (24h)" value={readings.length>0?readings.length.toString():"—"} unit="entries"/>
          <StatCard label="Time in Range" value={readings.length>0?`${Math.round((readings.filter(r=>r.glucose>=3.9&&r.glucose<=10).length/readings.length)*100)}%`:"—"} unit="3.9–10 mmol/L"/>
          <StatCard label="Average" value={readings.length>0?formatGlucose(readings.reduce((s,r)=>s+r.glucose,0)/readings.length):"—"} unit="24h mean"/>
        </div>
        {error && <div className="rounded-lg bg-red-950/40 border border-red-800 px-4 py-3"><p className="text-sm text-red-400">{error}</p></div>}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Nightscout Connection</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={nsUrl} onChange={e=>setNsUrl(e.target.value)} placeholder="https://yoursite.herokuapp.com" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
            <input type="password" value={nsSecret} onChange={e=>setNsSecret(e.target.value)} placeholder="API Secret (optional)" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
          </div>
          <button onClick={syncNS} disabled={syncing||!nsUrl} className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 py-2 text-sm font-medium transition-colors">{syncing?"Connecting…":"Connect & Sync"}</button>
        </div>
        {readings.length>0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800"><p className="text-sm font-semibold text-white">Recent Readings</p></div>
            <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
              {readings.slice(0,20).map((r,i)=>(
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <span className={cn("text-sm font-semibold",COLOURS[glucoseStatus(r.glucose)].split(" ")[0])}>{formatGlucose(r.glucose)} {ARROWS[r.trend]??""}</span>
                  <span className="text-xs text-gray-500">{timeAgo(r.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function StatCard({label,value,unit}:{label:string;value:string;unit:string}){return(<div className="rounded-xl border border-gray-800 bg-gray-900 p-5"><p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p><p className="text-xs text-gray-600">{unit}</p></div>);}
