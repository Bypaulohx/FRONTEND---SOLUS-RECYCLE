import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { authApi } from '../api/client';

type Mode = 'reset' | 'register';

interface VerificationState {
  email?: string;
  mode?: Mode;
}

const CODE_LENGTH = 6;

export default function Verificacao() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as VerificationState | null) ?? {};
  const storedEmail =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('recovery_email') : null;
  const email = state.email ?? storedEmail ?? '';
  const mode: Mode = state.mode ?? 'reset';

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digits;
    setCode(next);
    if (digits && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      setError(`Insira o código de ${CODE_LENGTH} dígitos.`);
      return;
    }
    if (!email) {
      setError('E-mail não encontrado. Volte e informe o e-mail novamente.');
      return;
    }
    setError('');
    setLoading(true);
    if (mode === 'register') {
      const { error: err } = await authApi.verifyRegistration(email, fullCode);
      setLoading(false);
      if (err) {
        setError(err);
        return;
      }
      navigate('/login', { state: { message: 'Cadastro concluído! Faça seu login.' } });
      return;
    }
    const { error: err } = await authApi.verifyResetCode(fullCode, 'USER');
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/nova-senha', { state: { code: fullCode, principalType: 'USER' } });
  }

  async function handleResend() {
    if (!email) {
      setError('Informe seu e-mail novamente para reenviar o código.');
      return;
    }
    setLoading(true);
    const { error: err } =
      mode === 'register'
        ? await authApi.resendVerification(email)
        : await authApi.initiateReset(email, 'USER');
    setLoading(false);
    if (err) setError(err);
    else setInfo('Um novo código foi enviado para o seu e-mail.');
  }

  return (
    <div className="container form-container">
      <BackButton to={mode === 'register' ? '/cadastro' : '/recuperacao'} />
      <h2>
        Verificação<br />
        Insira o código de {CODE_LENGTH} dígitos que enviamos para o seu e-mail
      </h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="code-container">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="code-input"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`Dígito ${index + 1}`}
              required
            />
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        {info && <p className="page-text success-text">{info}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>
      <p className="auth-footer">
        Não recebeu o código?{' '}
        <Link to="#" onClick={(e) => { e.preventDefault(); void handleResend(); }} className="register-link">
          Reenviar
        </Link>
      </p>
    </div>
  );
}
