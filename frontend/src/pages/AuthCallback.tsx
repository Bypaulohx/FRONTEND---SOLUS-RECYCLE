import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, type SocialProvider } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

/** Destino final dos fluxos OAuth (real ou demonstrativo). */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Concluindo seu login...');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function concluir() {
      const erro = params.get('error');
      if (erro) {
        setMessage(erro);
        window.setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      const token = params.get('token');
      const role = params.get('role');
      if (token && (role === 'USER' || role === 'COMPANY')) {
        loginWithToken(token, role);
        navigate('/home', { replace: true });
        return;
      }

      const provider = params.get('provider') as SocialProvider | null;
      if (params.get('demo') === '1' && provider) {
        const { data, error } = await authApi.socialDemo(provider, params.get('state'));
        if (error || !data) {
          setMessage(error ?? 'Não foi possível concluir o login social.');
          window.setTimeout(() => navigate('/login', { replace: true }), 2500);
          return;
        }
        loginWithToken(data.jwtToken, data.role);
        navigate('/home', { replace: true });
        return;
      }

      setMessage('Solicitação de login social inválida.');
      window.setTimeout(() => navigate('/login', { replace: true }), 2500);
    }

    void concluir();
  }, [loginWithToken, navigate, params]);

  return (
    <div className="container form-container">
      <h2 className="auth-title">Solus Recycle</h2>
      <p className="page-text">{message}</p>
    </div>
  );
}
