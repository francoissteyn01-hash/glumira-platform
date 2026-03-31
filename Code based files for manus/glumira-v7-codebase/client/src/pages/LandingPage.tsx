import { Link } from "react-router-dom";
export default function LandingPage() {
  return (
    <div style={{fontFamily:"DM Sans,system-ui,sans-serif",background:"#0d1b3e",minHeight:"100vh",color:"#fff"}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 48px",borderBottom:"1px solid rgba(42,181,193,0.1)"}}>
        <span style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:20,fontWeight:700}}>GluMira<sup style={{fontSize:10,color:"#2ab5c1"}}>™</sup></span>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <Link to="/pricing" style={{fontSize:13,color:"rgba(255,255,255,0.5)",textDecoration:"none"}}>Pricing</Link>
          <Link to="/login" style={{fontSize:13,color:"rgba(255,255,255,0.5)",textDecoration:"none"}}>Sign in</Link>
          <Link to="/register" style={{fontSize:13,background:"#2ab5c1",color:"#0d1b3e",padding:"7px 16px",borderRadius:8,textDecoration:"none",fontWeight:600}}>Join beta</Link>
        </div>
      </nav>
      <div style={{textAlign:"center",padding:"80px 24px 60px"}}>
        <p style={{fontSize:12,letterSpacing:"0.12em",textTransform:"uppercase",color:"#2ab5c1",marginBottom:20}}>Powered by IOB Hunter™</p>
        <h1 style={{fontFamily:"Playfair Display,Georgia,serif",fontSize:"clamp(36px,6vw,64px)",fontWeight:700,lineHeight:1.1,marginBottom:20}}>
          The science of insulin,<br/><em style={{fontStyle:"italic",color:"#2ab5c1"}}>made visible</em>
        </h1>
        <p style={{fontSize:18,color:"rgba(255,255,255,0.5)",maxWidth:500,margin:"0 auto 36px",lineHeight:1.7}}>
          For caregivers sitting awake at 2am, watching glucose numbers, asking why. We answer that question with science.
        </p>
        <Link to="/register" style={{display:"inline-block",background:"#2ab5c1",color:"#0d1b3e",padding:"14px 32px",borderRadius:10,fontSize:16,fontWeight:700,textDecoration:"none",marginRight:12}}>
          Start free beta →
        </Link>
        <Link to="/login" style={{display:"inline-block",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.6)",padding:"14px 24px",borderRadius:10,fontSize:16,textDecoration:"none"}}>
          Sign in
        </Link>
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.2)",paddingBottom:32}}>
        GluMira™ is an educational platform, not a medical device. Always discuss clinical decisions with your care team.
      </div>
    </div>
  );
}
