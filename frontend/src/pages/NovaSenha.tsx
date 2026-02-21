import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/client';

export default function NovaSenha() {
  const location = useLocation();
  const state = location.state as { email?: string; code?: string } | null;
  const email = state?.email ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('recovery_email') : null) ?? '';
  const code = state?.code ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!email || !code) {
      setError('Sessão inválida. Refça a recuperação de senha.');
      return;
    }
    setLoading(true);
    const { error: err } = await authApi.resetPassword({ email, code, newPassword });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/sucesso');
  }

  return (
    <div className="container form-container">
      <Link to="/verificacao" className="back-btn">←</Link>
      <h2>Pronto!<br />Crie uma nova senha</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite uma nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <span className="toggle-password" onClick={() => setShowPassword((s) => !s)} role="button" tabIndex={0} aria-label="Alternar visibilidade da senha">
            {showPassword ? '🙈' : '👁'}
          </span>
        </div>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirme nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="green-btn" disabled={loading}>
          {loading ? 'Confirmando...' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
}
