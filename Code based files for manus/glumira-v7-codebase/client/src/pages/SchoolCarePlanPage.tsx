import { AppLayout } from "../components/AppLayout";
import { useState } from "react";
export default function SchoolCarePlanPage() {
  const [school,setSchool]=useState(""); const [teacher,setTeacher]=useState("");
  return (
    <AppLayout title="School Care Plan">
      <h1 style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:22,color:"#1a2a5e",marginBottom:20}}>School Care Plan</h1>
      <form data-testid="scp-form" style={{background:"#fff",border:"1px solid #dee2e6",borderRadius:12,padding:24,maxWidth:560,boxShadow:"0 1px 3px rgba(26,42,94,0.06)"}} onSubmit={e=>e.preventDefault()}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={L.label} htmlFor="school-name">School name</label><input data-testid="scp-school-name" id="school-name" type="text" value={school} onChange={e=>setSchool(e.target.value)} placeholder="Windhoek Primary School" style={L.input} /></div>
          <div><label style={L.label} htmlFor="teacher-name">Teacher / contact name</label><input data-testid="scp-teacher-name" id="teacher-name" type="text" value={teacher} onChange={e=>setTeacher(e.target.value)} placeholder="Mrs. Nakamura" style={L.input} /></div>
          <button data-testid="scp-generate-btn" type="submit" style={L.btn}>Generate school care plan</button>
        </div>
        <p style={{fontSize:11,color:"#adb5bd",marginTop:16}}>GluMira™ is an educational platform, not a medical device. Discuss with your care team before distributing this plan.</p>
      </form>
    </AppLayout>
  );
}
const L:Record<string,React.CSSProperties>={label:{fontSize:12,fontWeight:500,color:"#1a2a5e",display:"block",marginBottom:4},input:{height:38,background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:8,padding:"0 12px",fontFamily:"DM Sans,sans-serif",fontSize:13,color:"#1a2a5e",outline:"none",width:"100%"},btn:{width:"100%",height:44,background:"#2ab5c1",color:"#0d1b3e",fontFamily:"DM Sans,sans-serif",fontSize:15,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",marginTop:4}};
