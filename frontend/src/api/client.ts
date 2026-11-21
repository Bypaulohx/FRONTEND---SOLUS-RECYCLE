/** Cliente HTTP para o backend Python (FastAPI) do Solus Recycle. */

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export interface ApiResult<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // corpo textual (ex.: /health)
    }

    if (!res.ok) {
      const body = data as { message?: string; error?: string; detail?: unknown };
      const detail = typeof body?.detail === 'string' ? body.detail : undefined;
      const error =
        body?.message ?? detail ?? body?.error ?? `Erro ${res.status}`;
      return { error, status: res.status };
    }
    return { data: data as T, status: res.status };
  } catch {
    return { error: 'Falha de conexão. Tente novamente.', status: 0 };
  }
}

export interface EnderecoBody {
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  type: string;
  jwtToken: string;
  message: string;
  role: 'USER' | 'COMPANY';
  id: number;
  firstName: string;
  fullName: string;
  telefone: string;
  cpf: string;
  cnpj: string;
}

export interface RegisterUserBody {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  telefone: string;
  endereco?: EnderecoBody;
}

export interface RegisterCompanyBody {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  senha: string;
  telefone: string;
  descricao?: string;
  tipoResiduo?: string;
  fazColetaDomicilio?: boolean;
  materiaisColeta?: string;
  pesoMinimoKg?: number | null;
  pesoMaximoKg?: number | null;
  endereco?: EnderecoBody;
}

export type PrincipalType = 'USER' | 'COMPANY';
export type SocialProvider = 'apple' | 'facebook' | 'google';

export interface MessageResponse {
  message: string;
  url: string | null;
}

export interface MeResponse {
  id: number;
  email: string;
  nome?: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
  endereco?: EnderecoBody | null;
  profilePicture?: string | null;
  descricao?: string | null;
  tipoResiduo?: string | null;
  fazColetaDomicilio?: boolean | null;
  materiaisColeta?: string | null;
  pesoMinimoKg?: number | null;
  pesoMaximoKg?: number | null;
  diasFuncionamento?: string | null;
  feriados?: string | null;
  imagemLocal?: string | null;
}

export interface FeriadoBody {
  data: string;
  motivo?: string;
  tipo?: 'nacional' | 'estadual' | 'municipal';
}

export interface CompanyProfileBody {
  nomeFantasia?: string;
  razaoSocial?: string;
  descricao?: string;
  telefone?: string;
  fazColetaDomicilio?: boolean;
  materiaisColeta?: string[];
  pesoMinimoKg?: number | null;
  pesoMaximoKg?: number | null;
  diasFuncionamento?: string[];
  feriados?: FeriadoBody[];
  imagemLocal?: string | null;
}

export interface EmpresaDTO {
  id: number;
  nomeFantasia?: string | null;
  razaoSocial: string | null;
  tipoResiduo: string | null;
  cep: string | null;
  profilePicture: string | null;
}

export interface AgendamentoDTO {
  id: number;
  userName: string | null;
  userTelefone?: string | null;
  userEndereco?: string | null;
  tipoResiduo: string | null;
  companyNomeFantasia: string | null;
  companyTelefone?: string | null;
  scheduleTime: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO';
  pesoEstimado: number | null;
}

export interface FuncionamentoDTO {
  id?: number | null;
  diaSemana?: string | null;
  horarioAbertura?: string | null;
  horarioFechamento?: string | null;
}

export interface PontoColetaDTO {
  id: number;
  nome: string | null;
  tipoResiduo: string | null;
  endereco: string | null;
  latitude: number;
  longitude: number;
  companyId?: number | null;
  companyNome?: string | null;
  distancia?: number;
  funcionamento?: FuncionamentoDTO[] | null;
  complemento?: string | null;
  raioKm?: number | null;
  materiais?: string[] | null;
  pesoMinimoKg?: number | null;
  pesoMaximoKg?: number | null;
  recebeMateriais?: boolean | null;
  coletaDomicilio?: boolean | null;
  telefone?: string | null;
  imagemUrl?: string | null;
}

export interface CepDTO {
  cep: string;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const authApi = {
  login: (body: LoginBody) => api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<MeResponse>('/auth/me'),
  logout: () => api<MessageResponse>('/auth/logout', { method: 'POST' }),
  updatePhone: (newPhone: string) =>
    api<MessageResponse>(`/profile/phone?newPhone=${encodeURIComponent(newPhone)}`, { method: 'PUT' }),
  updateAddress: (body: EnderecoBody) =>
    api<MessageResponse>('/profile/address', { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: () => api<MessageResponse>('/profile/account', { method: 'DELETE' }),
  updateCompany: (body: CompanyProfileBody) =>
    api<MessageResponse>('/profile/company', { method: 'PUT', body: JSON.stringify(body) }),
  socialUrl: (provider: SocialProvider, mode: 'login' | 'register' = 'login') =>
    api<{ url: string; demo: boolean }>(
      `/auth/social/${provider}/url?mode=${mode}`
    ),
  socialDemo: (provider: SocialProvider, state?: string | null) =>
    api<LoginResponse>(
      `/auth/social/${provider}/demo${state ? `?state=${encodeURIComponent(state)}` : ''}`,
      { method: 'POST' }
    ),
  check: (field: 'cpf' | 'cnpj' | 'email', value: string) =>
    api<{ unique: boolean; message: string }>(`/auth/check/${field}?value=${encodeURIComponent(value)}`),
  registerUser: (body: RegisterUserBody) =>
    api<MessageResponse>('/usuario', { method: 'POST', body: JSON.stringify(body) }),
  registerCompany: (body: RegisterCompanyBody) =>
    api<MessageResponse>('/empresa', { method: 'POST', body: JSON.stringify(body) }),
  verifyRegistration: (email: string, code: string) =>
    api<MessageResponse>('/cadastro/verificar', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  resendVerification: (email: string) =>
    api<MessageResponse>(`/cadastro/reenviar?email=${encodeURIComponent(email)}`, { method: 'POST' }),
  initiateReset: (identifier: string, principalType: PrincipalType) =>
    api<MessageResponse>('/password-reset/initiate', {
      method: 'POST',
      body: JSON.stringify({ identifier, principalType, deliveryMethod: 'email' }),
    }),
  verifyResetCode: (code: string, principalType: PrincipalType) =>
    api<MessageResponse>('/password-reset/verify-code-only', {
      method: 'POST',
      body: JSON.stringify({ principalType, code }),
    }),
  resetPassword: (code: string, principalType: PrincipalType, newPassword: string) =>
    api<MessageResponse>('/password-reset/verify-and-reset', {
      method: 'POST',
      body: JSON.stringify({ principalType, code, newPassword }),
    }),
};

export const solusApi = {
  empresas: () => api<EmpresaDTO[]>('/empresas'),
  meusAgendamentos: () => api<AgendamentoDTO[]>('/agendamentos/meus-agendamentos'),
  criarAgendamento: (body: {
    companyId: number;
    tipoResiduo: string;
    pesoEstimado: number;
    scheduleTime: string;
  }) => api<AgendamentoDTO>('/agendamentos', { method: 'POST', body: JSON.stringify(body) }),
  pontos: () => api<PontoColetaDTO[]>('/pontos-coleta'),
  cep: (cep: string) => api<CepDTO>(`/cep/${cep.replace(/\D/g, '')}`),
  criarPonto: (body: {
    nome: string;
    tipoResiduo: string;
    cep?: string;
    endereco?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => api<PontoColetaDTO>('/pontos-coleta', { method: 'POST', body: JSON.stringify(body) }),
  pontosProximos: (lat: number, lon: number, raio = 5) =>
    api<PontoColetaDTO[]>(`/pontos-coleta/proximos-coord?lat=${lat}&lon=${lon}&raio=${raio}`),
  agendamentosDaEmpresa: (companyId: number, status?: string) =>
    api<AgendamentoDTO[]>(
      `/agendamentos/company/${companyId}${status ? `?status=${encodeURIComponent(status)}` : ''}`
    ),
  confirmarAgendamento: (id: number) =>
    api<AgendamentoDTO>(`/agendamentos/${id}/confirmar`, { method: 'PUT' }),
  recusarAgendamento: (id: number) =>
    api<AgendamentoDTO>(`/agendamentos/${id}/recusar`, { method: 'PUT' }),
  cancelarAgendamento: (id: number) =>
    api<AgendamentoDTO>(`/agendamentos/${id}/cancelar`, { method: 'PUT' }),
  concluirAgendamento: (id: number) =>
    api<AgendamentoDTO>(`/agendamentos/${id}/concluir`, { method: 'PUT' }),
  atualizarPonto: (
    id: number,
    body: {
      nome?: string;
      tipoResiduo?: string;
      cep?: string;
      endereco?: string;
      latitude?: number | null;
      longitude?: number | null;
      complemento?: string | null;
      raioKm?: number | null;
      materiais?: string[] | null;
      pesoMinimoKg?: number | null;
      pesoMaximoKg?: number | null;
      recebeMateriais?: boolean | null;
      coletaDomicilio?: boolean | null;
      telefone?: string | null;
      funcionamento?: FuncionamentoDTO[] | null;
    }
  ) => api<PontoColetaDTO>(`/pontos-coleta/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  search: (q: string) => api<PontoColetaDTO[]>(`/search?q=${encodeURIComponent(q)}`),
};
