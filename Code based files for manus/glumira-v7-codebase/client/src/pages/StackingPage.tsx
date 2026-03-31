/**
 * GluMira™ V7 — client/src/pages/StackingPage.tsx
 * data-testid: stacking-form (from dashboard.spec.ts + clinician.spec.ts)
 */
import { AppLayout } from "../components/AppLayout";
import { useState } from "react";

export default function StackingPage() {
  const [doses, setDoses] = useState([{ type: "aspart", units: "", hoursAgo: "" }]);

  return (
    <AppLayout title="IOB Stacking Calculator">
      <form data-testid="stacking-form" style={S.form} onSubmit={e => e.preventDefault()}>
        <div style={S.intro}>
          Add all insulin doses from the last 48 hours. GluMira™ calculates your total Insulin on Board and stacking risk.
        </div>

        {doses.map((d, i) => (
          <div key={i} style={S.doseRow}>
            <div style={S.field}>
              <label style={S.label}>Insulin type</label>
              <select style={S.input} value={d.type} onChange={e => { const n=[...doses]; n[i].type=e.target.value; setDoses(n); }}>
                <option value="glargine_u300">Glargine U300 (Toujeo)</option>
                <option value="glargine_u100">Glargine (Lantus)</option>
                <option value="degludec">Degludec (Tresiba)</option>
                <option value="aspart">Aspart (NovoRapid)</option>
                <option value="lispro">Lispro (Humalog)</option>
                <option value="regular">Regular (Actrapid)</option>
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Units</label>
              <input type="number" style={S.input} placeholder="e.g. 8" min="0.5" step="0.5"
                value={d.units} onChange={e => { const n=[...doses]; n[i].units=e.target.value; setDoses(n); }} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Hours ago</label>
              <input type="number" style={S.input} placeholder="e.g. 3" min="0.1" step="0.1"
                value={d.hoursAgo} onChange={e => { const n=[...doses]; n[i].hoursAgo=e.target.value; setDoses(n); }} />
            </div>
          </div>
        ))}

        <button type="button" onClick={() => setDoses([...doses,{type:"aspart",units:"",hoursAgo:""}])} style={S.addBtn}>
          + Add dose
        </button>

        <button type="submit" data-testid="analyse-btn" style={S.btn}>
          Analyse IOB
        </button>
      </form>
      <p style={S.disc}>GluMira™ is an educational platform, not a medical device. Discuss with your care team.</p>
    </AppLayout>
  );
}

const S: Record<string,React.CSSProperties> = {
  form:    {background:"#fff",border:"1px solid #dee2e6",borderRadius:12,padding:24,maxWidth:700,boxShadow:"0 1px 3px rgba(26,42,94,0.06)"},
  intro:   {fontSize:13,color:"#52667a",marginBottom:20,lineHeight:1.6},
  doseRow: {display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12,marginBottom:12},
  field:   {display:"flex",flexDirection:"column",gap:4},
  label:   {fontSize:12,fontWeight:500,color:"#1a2a5e"},
  input:   {height:38,background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:8,padding:"0 10px",fontFamily:"DM Sans,sans-serif",fontSize:13,color:"#1a2a5e",outline:"none"},
  addBtn:  {background:"none",border:"1px dashed rgba(42,181,193,0.4)",borderRadius:8,padding:"8px 16px",fontSize:13,color:"#2ab5c1",cursor:"pointer",fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:12},
  btn:     {width:"100%",height:44,background:"#2ab5c1",color:"#0d1b3e",fontFamily:"DM Sans,sans-serif",fontSize:15,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer"},
  disc:    {fontSize:11,color:"#adb5bd",marginTop:16},
};
