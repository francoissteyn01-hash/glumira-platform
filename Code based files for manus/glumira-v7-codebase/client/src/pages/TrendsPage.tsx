import { AppLayout } from "../components/AppLayout";
export default function TrendsPage() {
  return (
    <AppLayout title="Glucose Trends">
      <div style={{background:"#fff",border:"1px solid #dee2e6",borderRadius:12,padding:24,maxWidth:800,boxShadow:"0 1px 3px rgba(26,42,94,0.06)"}}>
        <h2 style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:18,color:"#1a2a5e",marginBottom:8}}>Time in Range — 14-day analysis</h2>
        <p style={{fontSize:13,color:"#52667a",marginBottom:16}}>Glucose Management Indicator, coefficient of variation, and time in range breakdown.</p>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[["TIR (7 days)","74%","#2E7D32"],["GMI (7 days)","6.8%","#1a2a5e"],["CV (7 days)","28%","#52667a"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:10,padding:"16px 20px",minWidth:140}}>
              <div style={{fontSize:11,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em",color:"#52667a",marginBottom:6}}>{l}</div>
              <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:28,fontWeight:600,color:c}}>{v}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:11,color:"#adb5bd",marginTop:20}}>GluMira™ is an educational platform, not a medical device. Discuss with your care team.</p>
      </div>
    </AppLayout>
  );
}
