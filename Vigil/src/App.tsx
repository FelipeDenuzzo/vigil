import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { SelectAttention } from './pages/SelectAttention';
import { SelectiveHub } from './attentions/selective/SelectiveHub';
import { SustainedHub } from './attentions/sustained/SustainedHub';
import { AlternatingHub } from './attentions/alternating/AlternatingHub';
import { DividedHub } from './attentions/divided/DividedHub';
import { NotFound } from './pages/NotFound';
import './shared/base.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/treinar"            element={<SelectAttention />} />
        <Route path="/treinar/seletiva"   element={<SelectiveHub />} />
        <Route path="/treinar/sustentada" element={<SustainedHub />} />
        <Route path="/treinar/alternada"  element={<AlternatingHub />} />
        <Route path="/treinar/dividida"   element={<DividedHub />} />
        <Route path="*"                   element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}