import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { SelectAttention } from './pages/SelectAttention';
import { SelectiveHub } from './attentions/selective/SelectiveHub';
import VisualSearchPlay from './attentions/selective/VisualSearchPlay';
import { VisualSearchEvaluationScreen } from './attentions/selective/games/VisualSearchHunt/game/VisualSearchEvaluationScreen';
import { SustainedHub } from './attentions/sustained/SustainedHub';
import { AlternatingHub } from './attentions/alternating/AlternatingHub';
import { DividedHub } from './attentions/divided/DividedHub';
import { NotFound } from './pages/NotFound';
import './shared/base.css';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/treinar" element={<SelectAttention />} />
        <Route path="/treinar/seletiva" element={<SelectiveHub />} />
        <Route path="/treinar/seletiva/visual-search" element={<VisualSearchPlay />} />
        <Route path="/treinar/seletiva/visual-search/evaluation" element={<VisualSearchEvaluationScreen />} />
        <Route path="/treinar/sustentada" element={<SustainedHub />} />
        <Route path="/treinar/alternada" element={<AlternatingHub />} />
        <Route path="/treinar/dividida" element={<DividedHub />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
