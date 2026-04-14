/**
 * GluMira™ V7 — MarketingLayout
 * Shared shell for public surfaces — landing, pricing, science, demo.
 * Clinical Depth dark navy (Rule 21). Mira on nav + footer (Rule 43).
 * Disclaimer on every surface (Rule 27, Rule 51 privacy-safe).
 */

import { type ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND, FONTS, DISCLAIMER, loadBrandFonts } from "@/lib/brand";

type NavItem = { to: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { to: "/demo", label: "IOB Hunter" },
  { to: "/science", label: "Science" },
  { to: "/pricing", label: "Pricing" },
];

function MarketingNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(13,27,62,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          to="/"
          style={{
            color: BRAND.white,
            textDecoration: "none",
            fontFamily: FONTS.heading,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.01em",
          }}
        >
          GluMira<span style={{ fontSize: "0.55em", verticalAlign: "super" }}>™</span>
        </Link>

        <div
          className="mk-nav-links"
          style={{ display: "flex", gap: 22, alignItems: "center" }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  color: active ? BRAND.white : "rgba(255,255,255,0.65)",
                  textDecoration: "none",
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => navigate("/auth?mode=signup")}
            style={{
              minHeight: 40,
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid rgba(245,158,11,0.8)",
              background: BRAND.amber,
              color: BRAND.navyDeep,
              fontFamily: FONTS.body,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Start free trial
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mk-nav-links a { display: none; }
        }
      `}</style>
    </nav>
  );
}

function MarketingFooter() {
  return (
    <footer
      style={{
        marginTop: 64,
        padding: "40px 20px 28px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: BRAND.navyDeep,
        color: "rgba(255,255,255,0.58)",
        fontFamily: FONTS.body,
        fontSize: 13,
        lineHeight: 1.6,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            margin: 0,
            color: BRAND.white,
            fontFamily: FONTS.heading,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          GluMira<span style={{ fontSize: "0.55em", verticalAlign: "super" }}>™</span>
        </p>
        <p
          style={{
            margin: "4px 0 16px",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Silent. Vigilant. Yours.
        </p>

        <div
          style={{
            display: "flex",
            gap: 18,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <Link to="/science" style={{ color: "rgba(255,255,255,0.65)" }}>Science</Link>
          <Link to="/pricing" style={{ color: "rgba(255,255,255,0.65)" }}>Pricing</Link>
          <Link to="/demo" style={{ color: "rgba(255,255,255,0.65)" }}>IOB Hunter</Link>
          <Link to="/privacy" style={{ color: "rgba(255,255,255,0.65)" }}>Privacy</Link>
          <Link to="/terms" style={{ color: "rgba(255,255,255,0.65)" }}>Terms</Link>
        </div>

        <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {DISCLAIMER}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          © {new Date().getFullYear()} GluMira<span style={{ fontSize: "0.7em", verticalAlign: "super" }}>™</span>
        </p>
      </div>
    </footer>
  );
}

type Props = {
  children: ReactNode;
  showNav?: boolean;
  showFooter?: boolean;
};

export default function MarketingLayout({
  children,
  showNav = true,
  showFooter = true,
}: Props) {
  useEffect(() => {
    loadBrandFonts();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(155deg, ${BRAND.navyDeep} 0%, ${BRAND.navy} 100%)`,
        color: BRAND.white,
        fontFamily: FONTS.body,
      }}
    >
      {showNav && <MarketingNav />}
      {children}
      {showFooter && <MarketingFooter />}
    </div>
  );
}
