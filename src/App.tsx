import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './lib/ProtectedRoute';
import { ComingSoon } from './pages/ComingSoon';
import { Home } from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import { PoliticaPrivacidade } from './pages/PoliticaPrivacidade';
import { SelectAttention } from './pages/SelectAttention';
import { Historico } from './pages/Historico';
import { SelectiveHub } from './attentions/selective/SelectiveHub';
import { SustainedHub } from './attentions/sustained/SustainedHub';
import { AlternatingHub } from './attentions/alternating/AlternatingHub';
import { DividedHub } from './attentions/divided/DividedHub';
import { AguardandoAcesso } from './pages/AguardandoAcesso';
import { Admin } from './pages/Admin';
import { NotFound } from './pages/NotFound';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import './shared/base.css';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<ComingSoon />} />
          <Route path="/sobre" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />

          {/* Autenticado mas aguardando aprovação */}
          <Route path="/aguardando-acesso" element={<AguardandoAcesso />} />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute skipOnboardingGate>
                <OnboardingFlow />
              </ProtectedRoute>
            }
          />

          {/* Requer login + aprovação */}
          <Route path="/treinar" element={<ProtectedRoute><SelectAttention /></ProtectedRoute>} />

          {/* Seletiva */}
          <Route path="/treinar/seletiva" element={<ProtectedRoute><SelectiveHub /></ProtectedRoute>} />

          {/* Sustentada */}
          <Route path="/treinar/sustentada" element={<ProtectedRoute><SustainedHub /></ProtectedRoute>} />

          {/* Alternada */}
          <Route path="/treinar/alternada" element={<ProtectedRoute><AlternatingHub /></ProtectedRoute>} />

          {/* Dividida */}
          <Route path="/treinar/dividida" element={<ProtectedRoute><DividedHub /></ProtectedRoute>} />

          <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
