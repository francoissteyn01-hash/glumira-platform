import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, supabase } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const [profileStatus, setProfileStatus] = useState<"loading" | "complete" | "incomplete">("loading");

  useEffect(() => {
    if (!session) return;
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        setProfileStatus(data.profile?.profile_complete ? "complete" : "incomplete");
      })
      .catch(() => setProfileStatus("incomplete"));
  }, [session]);

  if (loading || (user && profileStatus === "loading")) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse text-sm">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Allow access to /profile without completion check (avoid redirect loop)
  if (location.pathname === "/profile") return <>{children}</>;

  // Block all other pages until profile is complete
  if (profileStatus === "incomplete") return <Navigate to="/profile" replace />;

  return <>{children}</>;
}
