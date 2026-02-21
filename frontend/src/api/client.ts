/** URL base da API do backend (ver .env.example: em dev use /api + proxy; em produção use a URL completa do backend). */
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    let data: T | { error?: string } = {};
    try {
      data = text ? (JSON.parse(text) as T) : {};
    } catch {
      // ignore
    }
    if (!res.ok) {
      const err = (data as { error?: string }).error ?? `Erro ${res.status}`;
      return { error: err, status: res.status };
    }
    return { data: data as T, status: res.status };
  } catch (e) {
    return { error: 'Falha de conexão. Tente novamente.', status: 0 };
  }
}

export const authApi = {
  register: (body: RegisterBody) => api<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    api<{ token: string; user: { id: number; email: string } }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body: { email: string }) =>
    api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  verifyCode: (body: { email: string; code: string }) =>
    api<{ valid: boolean }>('/auth/verify-code', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    api<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<{ id: number; email: string; nome: string; telefone: string; cep: string; numero: string; complemento: string }>('/auth/me'),
};

export interface RegisterBody {
  nome: string;
  email: string;
  password: string;
  documento_tipo: 'cpf' | 'cnpj';
  documento: string;
  telefone: string;
  cep: string;
  numero: string;
  complemento?: string;
  aceita_notificacoes?: boolean;
  tipo?: 'comunidade' | 'organizacao';
}
