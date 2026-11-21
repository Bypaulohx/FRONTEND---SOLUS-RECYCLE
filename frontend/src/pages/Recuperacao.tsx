import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { authApi } from '../api/client';

export default function Recuperacao() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await authApi.initiateReset(email.trim(), 'USER');
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    try {
      sessionStorage.setItem('recovery_email', email.trim());
    } catch {
      // armazenamento pode estar indisponível
    }
    navigate('/verificacao', {
      state: { email: email.trim(), mode: 'reset' },
    });
  }

  return (
    <div className="container form-container">
      <BackButton to="/login" />
      <h2 className="main-title">Esqueceu sua senha?</h2>
      <p className="subtitle">Por favor, insira o e-mail vinculado à sua conta</p>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar código'}
        </button>
      </form>
      <p className="auth-footer">
        Lembrou da senha? <Link to="/login" className="login-link">Faça seu login</Link>
      </p>
    </div>
  );
}
