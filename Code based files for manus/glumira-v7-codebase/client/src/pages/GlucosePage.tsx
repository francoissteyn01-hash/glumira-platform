import { AppLayout } from "../components/AppLayout";
import { useState } from "react";
export default function GlucosePage() {
  const [value,setVal]=useState("");
  return (
    <AppLayout title="Glucose Log">
      <div style={{background:"#fff",border:"1px solid #dee2e6",borderRadius:12,padding:24,maxWidth:500,boxShadow:"0 1px 3px rgba(26,42,94,0.06)"}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label htmlFor="glucose-value" style={{fontSize:12,fontWeight:500,color:"#1a2a5e",display:"block",marginBottom:4}}>Glucose value (mmol/L)</label>
            <input id="glucose-value" type="number" min="1" max="35" step="0.1" placeholder="e.g. 6.4"
              value={value} onChange={e=>setVal(e.target.value)}
              style={{height:40,background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:8,padding:"0 12px",fontFamily:"DM Sans,sans-serif",fontSize:14,color:"#1a2a5e",outline:"none",width:"100%"}} />
          </div>
          <button onClick={()=>alert("In production: log reading to Supabase")}
            style={{height:44,background:"#2ab5c1",color:"#0d1b3e",fontFamily:"DM Sans,sans-serif",fontSize:15,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer"}}>
            Log reading
          </button>
        </div>
        <p style={{fontSize:11,color:"#adb5bd",marginTop:16}}>GluMira™ is an educational platform, not a medical device.</p>
      </div>
    </AppLayout>
  );
}
