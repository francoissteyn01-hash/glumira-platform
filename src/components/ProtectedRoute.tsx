import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400 animate-pulse text-sm">Loading…</p></div>;
  if (!user)   return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
