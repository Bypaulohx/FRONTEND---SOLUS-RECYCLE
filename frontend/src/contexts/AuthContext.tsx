import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type MeResponse, type PrincipalType } from '../api/client';

export interface User {
  id: number;
  email: string;
  nome?: string;
  nomeFantasia?: string;
  telefone?: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  endereco?: MeResponse['endereco'];
  razaoSocial?: string;
  descricao?: string;
  tipoResiduo?: string;
  fazColetaDomicilio?: boolean;
  materiaisColeta?: string;
  pesoMinimoKg?: number;
  pesoMaximoKg?: number;
  diasFuncionamento?: string;
  feriados?: string;
  imagemLocal?: string;
}

interface AuthContextType {
  token: string | null;
  role: PrincipalType | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithToken: (token: string, role: PrincipalType) => void;
  logout: () => void;
  setToken: (t: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(data: MeResponse): User {
  const endereco = data.endereco ?? undefined;
  return {
    id: data.id,
    email: data.email,
    nome: data.nome ?? data.nomeFantasia ?? data.razaoSocial ?? data.email,
    nomeFantasia: data.nomeFantasia,
    telefone: data.telefone,
    cep: data.cpf ? undefined : endereco?.cep,
    numero: endereco?.numero,
    complemento: endereco?.complemento ?? undefined,
    endereco,
    razaoSocial: data.razaoSocial ?? undefined,
    descricao: data.descricao ?? undefined,
    tipoResiduo: data.tipoResiduo ?? undefined,
    fazColetaDomicilio: data.fazColetaDomicilio ?? undefined,
    materiaisColeta: data.materiaisColeta ?? undefined,
    pesoMinimoKg: data.pesoMinimoKg ?? undefined,
    pesoMaximoKg: data.pesoMaximoKg ?? undefined,
    diasFuncionamento: data.diasFuncionamento ?? undefined,
    feriados: data.feriados ?? undefined,
    imagemLocal: data.imagemLocal ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRoleState] = useState<PrincipalType | null>(() => {
    const stored = localStorage.getItem('role');
    return stored === 'USER' || stored === 'COMPANY' ? stored : null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
    setTokenState(t);
  }, []);

  const setRole = useCallback((value: PrincipalType | null) => {
    if (value) localStorage.setItem('role', value);
    else localStorage.removeItem('role');
    setRoleState(value);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const { data } = await authApi.me();
    setUser(data ? normalizeUser(data) : null);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    refreshUser();
  }, [token, refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await authApi.login({ email, password });
      if (error) return { error };
      if (data?.jwtToken) {
        setToken(data.jwtToken);
        setRole(data.role);
        setUser({
          id: data.id,
          email,
          nome: data.fullName || data.firstName,
          telefone: data.telefone,
        });
      }
      return {};
    },
    [setRole, setToken]
  );

  const loginWithToken = useCallback(
    (jwt: string, nextRole: PrincipalType) => {
      setToken(jwt);
      setRole(nextRole);
    },
    [setRole, setToken]
  );

  const logout = useCallback(() => {
    // O backend revoga o token; a limpeza local acontece independentemente da resposta.
    void authApi.logout();
    setToken(null);
    setRole(null);
    setUser(null);
  }, [setRole, setToken]);

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        loading,
        login,
        loginWithToken,
        logout,
        setToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
