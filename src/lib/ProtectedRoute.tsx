// src/lib/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  children: React.ReactNode;
  /** Se true, exige accessStatus === 'approved'. Padrão: true. */
  requireApproved?: boolean;
  /** Se true, exige isAdmin === true. */
  requireAdmin?: boolean;
  skipOnboardingGate?: boolean; // ← para a própria rota /onboarding não criar loop
}

export default function ProtectedRoute({
  children,
  requireApproved = true,
  requireAdmin = false,
  skipOnboardingGate = false,
}: Props) {
  const { user, accessStatus, isAdmin, onboardingCompleted } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/treinar" replace />;

  if (requireApproved && accessStatus !== 'approved') {
    return <Navigate to="/aguardando-acesso" replace />;
  }

  // ← ADICIONADO: usuário aprovado mas sem onboarding → redireciona
  if (requireApproved && !skipOnboardingGate && !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
