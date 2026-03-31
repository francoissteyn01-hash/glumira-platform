import { AppLayout } from "../components/AppLayout";
import { useState } from "react";
export default function ClinicianPage() {
  const [q,setQ]=useState(""); const [msgs,setMsgs]=useState([{role:"assistant",content:"Hello! I'm the GluMira™ Bernstein AI. Ask me anything about diabetes management. Discuss this with your care team."}]);
  async function ask(){if(!q.trim())return;setMsgs(m=>[...m,{role:"user",content:q}]);setQ("");const r=await fetch("/api/bernstein/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})});const d=await r.json();setMsgs(m=>[...m,{role:"assistant",content:d.answer??"I'm temporarily unavailable."}]);}
  return (
    <AppLayout title="Clinician Dashboard">
      <h1 style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:22,color:"#1a2a5e",marginBottom:20}}>Clinician</h1>
      <div data-testid="bernstein-panel" style={{background:"#fff",border:"1px solid #dee2e6",borderRadius:12,padding:20,maxWidth:640,boxShadow:"0 1px 3px rgba(26,42,94,0.06)"}}>
        <div style={{fontWeight:500,color:"#1a2a5e",marginBottom:12,fontSize:14}}>Bernstein AI — Educational Q&A</div>
        <div style={{height:220,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",background:m.role==="user"?"#2ab5c1":"#f8f9fa",color:m.role==="user"?"#0d1b3e":"#1a2a5e",borderRadius:10,padding:"8px 14px",fontSize:13,maxWidth:"80%"}}>{m.content}</div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input data-testid="bernstein-input" type="text" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask about Dr. Bernstein's method…"
            style={{flex:1,height:38,background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:8,padding:"0 12px",fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none"}} />
          <button onClick={ask} style={{padding:"0 16px",height:38,background:"#2ab5c1",color:"#0d1b3e",border:"none",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:13}}>Ask</button>
        </div>
        <p style={{fontSize:11,color:"#adb5bd",marginTop:10}}>Educational only · Not a medical device · Not a dosing tool</p>
      </div>
    </AppLayout>
  );
}
