import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './lib/ProtectedRoute';
import { Home } from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import { SelectAttention } from './pages/SelectAttention';
import { Historico } from './pages/Historico';
import { SelectiveHub } from './attentions/selective/SelectiveHub';
import VisualSearchPlay from './attentions/selective/VisualSearchPlay';
import VisualSearchEvaluationContainer from './attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationContainer';
import { SustainedHub } from './attentions/sustained/SustainedHub';
import { AlternatingHub } from './attentions/alternating/AlternatingHub';
import { DividedHub } from './attentions/divided/DividedHub';
import { NotFound } from './pages/NotFound';
import './shared/base.css';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/treinar" element={<ProtectedRoute><SelectAttention /></ProtectedRoute>} />
          <Route path="/treinar/seletiva" element={<ProtectedRoute><SelectiveHub /></ProtectedRoute>} />
          <Route path="/treinar/seletiva/visual-search" element={<ProtectedRoute><VisualSearchPlay /></ProtectedRoute>} />
          <Route path="/treinar/seletiva/visual-search/resultado" element={<ProtectedRoute><VisualSearchEvaluationContainer /></ProtectedRoute>} />
          <Route path="/treinar/seletiva/visual-search/evaluation" element={<ProtectedRoute><VisualSearchEvaluationContainer /></ProtectedRoute>} />
          <Route path="/treinar/sustentada" element={<ProtectedRoute><SustainedHub /></ProtectedRoute>} />
          <Route path="/treinar/alternada" element={<ProtectedRoute><AlternatingHub /></ProtectedRoute>} />
          <Route path="/treinar/dividida" element={<ProtectedRoute><DividedHub /></ProtectedRoute>} />
          <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
