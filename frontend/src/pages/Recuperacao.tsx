import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

export default function Recuperacao() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const { error } = await authApi.forgotPassword({ email: email.trim() });
    setLoading(false);
    if (error) {
      setMessage('Erro ao enviar. Tente novamente.');
      return;
    }
    setMessage('Se o e-mail existir, você receberá um código.');
    try { sessionStorage.setItem('recovery_email', email.trim()); } catch { /* ignore */ }
    navigate('/verificacao', { state: { email: email.trim() } });
  }

  return (
    <div className="container form-container">
      <h2 className="main-title">Esqueceu sua senha?</h2>
      <p className="subtitle">Por favor, insira o email vinculado à sua conta</p>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {message && <p className="page-text" style={{ color: '#00C853' }}>{message}</p>}
        <button type="submit" className="green-btn" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar código'}
        </button>
      </form>
      <p className="login-prompt">
        Lembrou da senha? <Link to="/login" className="login-link">Faça seu login</Link>
      </p>
    </div>
  );
}
