import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import type { AuthRole } from "@/types/auth";

export default function RequireAuth({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: AuthRole[];
}) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && roles.length > 0) {
    const role = user.role ?? "buyer";
    if (!roles.includes(role)) return <Navigate to="/account" replace />;
  }

  return children;
}
