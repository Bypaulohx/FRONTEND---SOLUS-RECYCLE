import { useState } from 'react';
import { authApi, type SocialProvider } from '../api/client';

const providers: { id: SocialProvider; label: string; icon: string }[] = [
  { id: 'apple', label: 'Apple', icon: '/assets/Apple (Button).png' },
  { id: 'facebook', label: 'Facebook', icon: '/assets/Facebook (Button).png' },
  { id: 'google', label: 'Google', icon: '/assets/Google (Button).png' },
];

interface SocialButtonsProps {
  mode?: 'login' | 'register';
}

export default function SocialButtons({ mode = 'login' }: SocialButtonsProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  async function handle(provider: SocialProvider) {
    setMessage('');
    setLoading(provider);
    const { data, error } = await authApi.socialUrl(provider);
    setLoading(null);
    if (error || !data?.url) {
      setMessage(
        `Login com ${providers.find((p) => p.id === provider)?.label} ainda não está configurado.`
      );
      return;
    }
    window.location.assign(data.url);
  }

  return (
    <>
      <div className="social-buttons">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-button"
            onClick={() => void handle(provider.id)}
            aria-label={`${mode === 'login' ? 'Entrar' : 'Cadastrar'} com ${provider.label}`}
            disabled={loading !== null}
          >
            <img src={provider.icon} alt="" />
          </button>
        ))}
      </div>
      {message && <p className="form-error social-message">{message}</p>}
      {loading && <p className="page-text social-message">Abrindo {loading}...</p>}
    </>
  );
}
