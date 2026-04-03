import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, supabase } from "@/hooks/useAuth";
import UnitToggle from "@/components/UnitToggle";
import NightscoutSetup from "@/components/NightscoutSetup";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
export default function SettingsPage() {
  const { user }            = useAuth();
  const [nsUrl, setNsUrl]   = useState(()=>localStorage.getItem("ns_url")??"");
  const [nsSecret, setNs]   = useState(()=>localStorage.getItem("ns_secret")??"");
  const [saved, setSaved]   = useState(false);
  const [pwNew, setPwNew]   = useState("");
  const [pwMsg, setPwMsg]   = useState<string|null>(null);
  const saveNS = useCallback(() => { localStorage.setItem("ns_url",nsUrl); localStorage.setItem("ns_secret",nsSecret); setSaved(true); setTimeout(()=>setSaved(false),2000); }, [nsUrl, nsSecret]);
  useKeyboardSave(saveNS);
  async function changePw(){ setPwMsg(null); const{error}=await supabase.auth.updateUser({password:pwNew}); if(error)setPwMsg(error.message); else{setPwMsg("Password updated.");setPwNew("");} }
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <S title="Account"><p className="text-xs text-gray-300">Email</p><p className="text-sm text-white">{user?.email??"—"}</p></S>
        <S title="Change Password">
          <label htmlFor="pw-new" className="sr-only">New password</label>
          <input id="pw-new" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="New password (min 8 chars)" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
          {pwMsg&&<p className={`text-xs ${pwMsg.includes("updated")?"text-green-400":"text-red-400"}`} role="status">{pwMsg}</p>}
          <button onClick={changePw} disabled={pwNew.length<8} className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-4 py-2 text-sm font-medium transition-colors">Update password</button>
        </S>
        <S title="Nightscout">
          <label htmlFor="ns-url" className="sr-only">Nightscout URL</label>
          <input id="ns-url" value={nsUrl} onChange={e=>setNsUrl(e.target.value)} placeholder="https://yoursite.herokuapp.com" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
          <label htmlFor="ns-secret" className="sr-only">Nightscout API Secret</label>
          <input id="ns-secret" type="password" value={nsSecret} onChange={e=>setNs(e.target.value)} placeholder="API Secret (optional)" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"/>
          <button onClick={saveNS} className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-medium transition-colors">{saved?"✓ Saved":"Save Nightscout settings"}</button>
        </S>
        <NightscoutSetup />
        <S title="Glucose Units"><p className="text-xs text-gray-300 mb-2">Choose how glucose values are displayed across GluMira™</p><UnitToggle /></S>
        <S title="Caregivers"><p className="text-xs text-gray-300 mb-2">Allow parents, guardians, or clinicians to view or edit this profile.</p><Link to="/caregivers" className="text-xs text-brand-500 hover:text-brand-500/80 underline">Manage Caregivers</Link></S>
        <S title="Data"><a href="/import/handwritten" className="text-xs text-brand-500 hover:text-brand-500/80 underline">Import Handwritten Notes</a></S>
        <S title="Legal"><p className="text-xs text-gray-300 leading-relaxed">GluMira™ is an educational platform, not a registered medical device. Powered by IOB Hunter™</p></S>
      </div>
    </div>
  );
}
function S({title,children}:{title:string;children:React.ReactNode}){return(<div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4"><h2 className="text-sm font-semibold text-white">{title}</h2>{children}</div>);}
