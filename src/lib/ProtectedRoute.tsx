// src/lib/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  children: React.ReactNode;
  /** Se true, exige accessStatus === 'approved'. Padrão: true. */
  requireApproved?: boolean;
  /** Se true, exige isAdmin === true. */
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireApproved = true,
  requireAdmin = false,
}: Props) {
  const { user, accessStatus, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/treinar" replace />;

  if (requireApproved && accessStatus !== 'approved') {
    return <Navigate to="/aguardando-acesso" replace />;
  }

  return <>{children}</>;
}
