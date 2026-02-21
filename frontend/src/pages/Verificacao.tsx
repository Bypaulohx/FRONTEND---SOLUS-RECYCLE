import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/client';

export default function Verificacao() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('recovery_email') : null) ?? '';
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const navigate = useNavigate();

  function handleChange(i: number, v: string) {
    if (v.length > 1) v = v.slice(-1);
    const next = [...code];
    next[i] = v.replace(/\D/g, '');
    setCode(next);
    if (v && i < 3) refs[i + 1].current?.focus();
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs[i - 1].current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Insira o código de 4 dígitos.');
      return;
    }
    if (!email) {
      setError('E-mail não encontrado. Volte e informe o e-mail novamente.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await authApi.verifyCode({ email, code: fullCode });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/nova-senha', { state: { email, code: fullCode } });
  }

  return (
    <div className="container form-container">
      <Link to="/recuperacao" className="back-btn">←</Link>
      <h2>Verificação<br />Insira o código de 4 dígitos que enviamos para o seu email</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="code-container">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="code-input"
              value={code[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              required
            />
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="green-btn" disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>
      <p className="page-text">Não recebeu o código? <Link to="/recuperacao">Reenviar</Link></p>
    </div>
  );
}
