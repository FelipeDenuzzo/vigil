import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/treinar');
    } catch {
      setErro('E-mail ou senha incorretos.');
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <h1>Entrar</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        {erro && <p style={{ color: 'red', fontSize: 14 }}>{erro}</p>}
        <button type="submit" style={{ padding: '12px', borderRadius: 8, background: '#01696f', color: 'white', fontSize: 16, border: 'none', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center' }}>
        Não tem conta? <Link to="/cadastro">Cadastrar</Link>
      </p>
    </div>
  );
}
