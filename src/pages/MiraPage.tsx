import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import MiraOwl from "@/components/MiraOwl";
import { cn } from "@/lib/utils";
import { DISCLAIMER } from "@/lib/constants";

interface Message { role:"user"|"assistant"; content:string; timestamp:Date; }

export default function MiraPage() {
  const [messages, setMessages] = useState<Message[]>([{role:"assistant",content:"Hi! I'm Mira, your GluMira™ education assistant 👋\n\nI can help you understand diabetes management concepts.\n\n⚠️ I'm an educational tool — always check with your healthcare team before making changes.",timestamp:new Date()}]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  async function send() {
    const text = input.trim(); if (!text||loading) return;
    setMessages(p=>[...p,{role:"user",content:text,timestamp:new Date()}]); setInput(""); setLoading(true);
    try {
      const res = await apiFetch<{reply:string}>("/api/mira/chat",{method:"POST",body:JSON.stringify({message:text,history:messages.map(m=>({role:m.role,content:m.content}))})});
      setMessages(p=>[...p,{role:"assistant",content:res.reply,timestamp:new Date()}]);
    } catch { setMessages(p=>[...p,{role:"assistant",content:"Sorry, I couldn't reach the server. Please try again.",timestamp:new Date()}]); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-3 flex items-center gap-3">
        <MiraOwl size={36} />
        <div><p className="font-semibold text-white text-sm">Mira AI</p><p className="text-xs text-gray-300">Educational assistant · Not medical advice</p></div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m,i)=>(
          <div key={i} className={cn("flex",m.role==="user"?"justify-end":"justify-start")}>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",m.role==="user"?"bg-violet-600 text-white rounded-br-sm":"bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-sm")}>{m.content}</div>
          </div>
        ))}
        {loading&&<div className="flex justify-start"><div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3"><span className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/></span></div></div>}
        <div ref={bottomRef}/>
      </div>
      <p className="text-xs text-gray-400 text-center px-4 pb-1 max-w-2xl mx-auto w-full">{DISCLAIMER}</p>
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask Mira a question…" className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
          <button onClick={send} disabled={loading||!input.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 py-2.5 text-sm font-medium transition-colors">Send</button>
        </div>
      </div>
    </div>
  );
}
