import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import PasswordField from '../components/PasswordField';
import SocialButtons from '../components/SocialButtons';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <BackButton to="/" />
      <h2 className="auth-title">Bem-vindo de volta!<br />Faça seu login</h2>
      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <PasswordField
          placeholder="Digite sua senha"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <Link to="/recuperacao" className="forgot-password">Esqueceu a senha?</Link>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="social-divider">Ou entre com</p>
      <SocialButtons mode="login" />

      <p className="auth-footer">
        Ainda não tem uma conta? <Link to="/cadastro" className="register-link">Faça seu cadastro</Link>
      </p>
    </div>
  );
}
