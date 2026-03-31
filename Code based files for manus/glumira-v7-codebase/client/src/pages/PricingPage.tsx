import { Link } from "react-router-dom";
export default function PricingPage() {
  const tiers=[
    {name:"GluMira Free",price:"Free",desc:"90-day trial",features:["Nightscout CGM","Basic IOB calculator","Stacking score","Caregiver sharing"],cta:"Start free",color:"#2ab5c1"},
    {name:"GluMira Pro",price:"$29.99/mo",desc:"After beta",features:["Everything in Free","IOB decay curves","PDF export","Dexcom & Libre CGM","Team collaboration"],cta:"Start free beta",color:"#f59e0b",highlight:true},
    {name:"GluMira AI",price:"$99.99/mo",desc:"Coming soon",features:["Everything in Pro","AI predictions","REST API + HL7 FHIR","Population analytics","De-identified export"],cta:"Notify me",color:"#1a2a5e"},
  ];
  return (
    <div style={{fontFamily:"DM Sans,system-ui,sans-serif",background:"#f8f9fa",minHeight:"100vh",padding:"40px 24px"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <Link to="/" style={{fontSize:13,color:"#2ab5c1",textDecoration:"none"}}>← Back</Link>
        <h1 style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:36,color:"#1a2a5e",margin:"16px 0 8px"}}>Simple, transparent pricing</h1>
        <p style={{fontSize:16,color:"#52667a"}}>6-week free beta — Free and Pro, no card required</p>
        <p style={{fontSize:13,color:"#2ab5c1",fontWeight:500}}>African residents receive 30% discount automatically</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24,maxWidth:920,margin:"0 auto"}}>
        {tiers.map(t=>(
          <div key={t.name} style={{background:"#fff",border:`2px solid ${t.highlight?"#f59e0b":"#dee2e6"}`,borderRadius:16,padding:28,boxShadow:t.highlight?"0 8px 32px rgba(245,158,11,0.15)":"0 1px 3px rgba(26,42,94,0.06)"}}>
            <div style={{fontSize:20,fontWeight:700,color:"#1a2a5e",marginBottom:4}}>{t.name}</div>
            <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:28,fontWeight:600,color:t.color,marginBottom:4}}>{t.price}</div>
            <div style={{fontSize:12,color:"#52667a",marginBottom:20}}>{t.desc}</div>
            {t.features.map(f=><div key={f} style={{fontSize:13,color:"#52667a",marginBottom:6}}>✓ {f}</div>)}
            <Link to="/register" style={{display:"block",marginTop:20,textAlign:"center",background:t.color,color:t.highlight?"#1a2a5e":"#fff",padding:"10px",borderRadius:8,textDecoration:"none",fontWeight:600,fontSize:14}}>{t.cta}</Link>
          </div>
        ))}
      </div>
      <p style={{textAlign:"center",fontSize:12,color:"#adb5bd",marginTop:32}}>GluMira™ is an educational platform, not a medical device.</p>
    </div>
  );
}
