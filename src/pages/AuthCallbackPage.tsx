/**
 * GluMira™ — OAuth Callback Handler
 * Waits for Supabase PKCE code exchange, then redirects to dashboard.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/hooks/useAuth";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      }
    });

    // Fallback: if session already exists (e.g. hash tokens already parsed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });

    // Safety timeout — if nothing happens in 10s, send to auth page
    const timeout = setTimeout(() => {
      navigate("/auth", { replace: true });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#070D1A",
        color: "#ffffff",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img
          src="/brand/mira-hero.png"
          alt="Mira — GluMira™ guardian owl"
          style={{
            width: 72,
            height: 72,
            objectFit: "contain",
            margin: "0 auto 16px",
            mixBlendMode: "screen",
            filter: "drop-shadow(0 4px 18px rgba(42,181,193,0.3))",
          }}
        />
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 18 }}>
          GluMira<span style={{ color: "#2ab5c1" }}>™</span>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(42,181,193,0.3)",
            borderTopColor: "#2ab5c1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ opacity: 0.7, fontSize: 14 }}>Signing you in…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
