import { AppLayout } from "../components/AppLayout";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
export default function PatientsPage() {
  const { token }=useAuth(); const [patients,setP]=useState<any[]>([]); const [search,setS]=useState("");
  useEffect(()=>{fetch("/api/patients",{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setP(d.patients??[])).catch(()=>{});},[token]);
  const filtered=patients.filter(p=>p.patient_name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <AppLayout title="Patient List">
      <div style={{marginBottom:16}}><input data-testid="patient-search" type="text" value={search} onChange={e=>setS(e.target.value)} placeholder="Search patients…" style={{height:38,background:"#fff",border:"1px solid #dee2e6",borderRadius:8,padding:"0 12px",fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",width:280}} /></div>
      <div data-testid="patient-list" style={{background:"#fff",border:"1px solid #dee2e6",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(26,42,94,0.06)"}}>
        {filtered.length===0?<div style={{padding:32,textAlign:"center",color:"#52667a",fontSize:13}}>No patients yet. Create your first patient to get started.</div>
        :filtered.map(p=>(
          <div key={p.id} data-testid="patient-row" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid #dee2e6"}}>
            <div><div style={{fontSize:14,fontWeight:500,color:"#1a2a5e"}}>{p.patient_name}</div><div style={{fontSize:12,color:"#52667a"}}>{p.diagnosis} · {p.glucose_unit}</div></div>
            <span data-testid="tir-badge" style={{fontSize:11,padding:"3px 10px",borderRadius:100,background:"rgba(46,125,50,0.08)",color:"#2E7D32",border:"1px solid rgba(46,125,50,0.2)"}}>TIR —</span>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
