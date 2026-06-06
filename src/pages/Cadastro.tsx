import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      navigate('/treinar');
    } catch {
      setErro('Erro ao cadastrar. Verifique os dados e tente novamente.');
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <h1>Criar conta</h1>
      <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
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
          placeholder="Senha (mínimo 6 caracteres)"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
          minLength={6}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        {erro && <p style={{ color: 'red', fontSize: 14 }}>{erro}</p>}
        <button type="submit" style={{ padding: '12px', borderRadius: 8, background: '#01696f', color: 'white', fontSize: 16, border: 'none', cursor: 'pointer' }}>
          Cadastrar
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center' }}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
