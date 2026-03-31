/**
 * GluMira™ V7 — client/src/components/AppLayout.tsx
 * Sidebar + topbar shell for all authenticated pages.
 * All sidebar nav items have data-testid per clinician.spec.ts
 */
import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

const NAV = [
  { to: "/dashboard",         label: "Dashboard",       icon: "📊", testId: "nav-dashboard" },
  { to: "/glucose",           label: "Glucose",         icon: "💧", testId: "nav-glucose" },
  { to: "/stacking",          label: "Stacking",        icon: "⚗️", testId: "nav-stacking" },
  { to: "/trends",            label: "Trends",          icon: "📈", testId: "nav-trends" },
  { to: "/doses",             label: "Doses",           icon: "💊", testId: "nav-doses" },
  { to: "/meals",             label: "Meals",           icon: "🥗", testId: "nav-meals" },
  { to: "/clinician",         label: "Clinician",       icon: "🧑‍⚕️", testId: "nav-clinician" },
  { to: "/school-care-plan",  label: "School Care Plan",icon: "🏫", testId: "nav-school" },
  { to: "/settings",          label: "Settings",        icon: "⚙️", testId: "nav-settings" },
];

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div style={S.shell}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.brand}>
          <span style={{fontSize:24}}>🦉</span>
          <span style={S.wordmark}>GluMira<sup style={{fontSize:8,verticalAlign:"super",color:"#2ab5c1"}}>™</sup></span>
        </div>

        <nav style={S.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.testId}
              style={({ isActive }) => ({
                ...S.navItem,
                ...(isActive ? S.navActive : {}),
              })}
            >
              <span style={{width:18,textAlign:"center"}}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={S.sbFooter}>
          <div style={S.userRow}>
            <span style={{fontSize:20}}>👤</span>
            <div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.65)"}}>{user?.email?.split("@")[0]}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>Beta participant</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            style={S.logoutBtn}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {title && (
          <div style={S.topbar}>
            <h1 style={S.pageTitle}>{title}</h1>
          </div>
        )}
        <div style={S.content}>{children}</div>
      </main>
    </div>
  );
}

const S: Record<string,React.CSSProperties> = {
  shell:    {display:"flex",height:"100vh",fontFamily:"DM Sans,system-ui,sans-serif",background:"#f8f9fa"},
  sidebar:  {width:220,background:"#0d1b3e",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"},
  brand:    {display:"flex",alignItems:"center",gap:8,padding:"20px 16px 24px"},
  wordmark: {fontFamily:"Playfair Display,Georgia,serif",fontSize:17,fontWeight:700,color:"#fff"},
  nav:      {flex:1,padding:"0 8px",display:"flex",flexDirection:"column",gap:2},
  navItem:  {display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,fontSize:13,color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"all 0.15s"},
  navActive:{background:"rgba(42,181,193,0.1)",color:"#2ab5c1",fontWeight:500},
  sbFooter: {padding:"16px 12px",borderTop:"1px solid rgba(255,255,255,0.05)"},
  userRow:  {display:"flex",alignItems:"center",gap:10,marginBottom:12},
  logoutBtn:{width:"100%",padding:"8px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"},
  main:     {flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  topbar:   {padding:"16px 24px",borderBottom:"1px solid #dee2e6",background:"#fff",flexShrink:0},
  pageTitle:{fontFamily:"Playfair Display,Georgia,serif",fontSize:20,fontWeight:700,color:"#1a2a5e",margin:0},
  content:  {flex:1,overflowY:"auto",padding:24},
};
