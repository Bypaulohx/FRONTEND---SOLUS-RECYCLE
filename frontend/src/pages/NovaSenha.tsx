import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import PasswordField from '../components/PasswordField';
import { authApi, type PrincipalType } from '../api/client';

interface RecoveryState {
  code?: string;
  principalType?: PrincipalType;
}

export default function NovaSenha() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as RecoveryState | null) ?? {};
  const code = state.code ?? '';
  const principalType: PrincipalType = state.principalType ?? 'USER';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (!code) {
      setError('Sessão inválida. Refaça a recuperação de senha.');
      return;
    }
    setLoading(true);
    const { error: err } = await authApi.resetPassword(code, principalType, newPassword);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/sucesso');
  }

  return (
    <div className="container form-container">
      <BackButton to="/verificacao" />
      <h2>Pronto!<br />Crie uma nova senha</h2>
      <form className="form" onSubmit={handleSubmit}>
        <PasswordField
          placeholder="Digite uma nova senha"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          minLength={8}
          aria-label="Digite uma nova senha"
        />
        <PasswordField
          placeholder="Confirme a nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={8}
          aria-label="Confirme a nova senha"
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Confirmando...' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
}
