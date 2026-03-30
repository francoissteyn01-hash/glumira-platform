import { useState } from "react";
import { supabase } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

type Mode = "login" | "signup" | "reset";

export default function AuthPage() {
  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState<{ type: "error"|"success"; text: string } | null>(null);

  async function handleSubmit() {
    setLoading(true); setMsg(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        setMsg({ type: "success", text: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
        if (error) throw error;
        setMsg({ type: "success", text: "Password reset email sent." });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Something went wrong" });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-violet-400">GluMira™</h1>
        <p className="text-sm text-gray-500 mt-1">Diabetes education platform</p>
      </div>
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
          {(["login","signup"] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setMsg(null); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${mode===m?"bg-violet-600 text-white":"text-gray-400 hover:text-white"}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {mode==="signup" && <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"/>}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
          {mode!=="reset" && <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"/>}
          {msg && <div className={`rounded-lg px-3 py-2.5 text-sm ${msg.type==="error"?"bg-red-900/30 border border-red-700 text-red-400":"bg-green-900/30 border border-green-700 text-green-400"}`}>{msg.text}</div>}
          <button onClick={handleSubmit} disabled={loading||!email||(mode!=="reset"&&!password)} className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-2.5 text-sm font-semibold transition-colors">
            {loading?"Please wait…":mode==="login"?"Sign in":mode==="signup"?"Create account":"Send reset email"}
          </button>
          {mode==="login"&&<button onClick={()=>{setMode("reset");setMsg(null);}} className="w-full text-center text-xs text-gray-500 hover:text-gray-300">Forgot password?</button>}
          {mode==="reset"&&<button onClick={()=>{setMode("login");setMsg(null);}} className="w-full text-center text-xs text-gray-500 hover:text-gray-300">← Back to sign in</button>}
        </div>
      </div>
      <p className="mt-6 text-xs text-gray-600 text-center max-w-sm">{DISCLAIMER}</p>
    </div>
  );
}
