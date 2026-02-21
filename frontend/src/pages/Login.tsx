import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await login(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/home');
  }

  return (
    <div className="container form-container">
      <Link to="/" className="back-btn" aria-label="Voltar">
        ←
      </Link>
      <h2>Bem-vindo de volta!<br />Faça seu login</h2>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword((s) => !s)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? '🙈' : '👁'}
          </span>
        </div>
        <Link to="/recuperacao" className="forgot-password">Esqueceu a senha?</Link>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="entrar-btn" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="page-text" style={{ marginTop: 20 }}>
        Ainda não tem uma conta? <Link to="/cadastro" className="register-link">Faça seu cadastro</Link>
      </p>
    </div>
  );
}
